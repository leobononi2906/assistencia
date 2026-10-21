// assist-perguntar — Tira-dúvidas da assistência. O atendente faz uma PERGUNTA
// livre e a IA responde com base na base de conhecimento (assist_kb_produto) +
// regras + dicas (assist_ia_regras), num formato pronto para mandar ao cliente,
// com os links de vídeo pertinentes.
//
// Entrada:  POST { pergunta: string, produto?: string, email?: string }
// Saída:    { ok, resposta, videos:[url], confianca, cache }
//
// Segredo: ANTHROPIC_API_KEY (obrigatório).
//
// ---------------------------------------------------------------------------
// REGISTRO E CACHE (14/09/2026)
//
// Antes nada era gravado: nem a pergunta, nem a resposta. E cada pergunta
// mandava a base INTEIRA para a Anthropic (11 produtos, ~34 mil caracteres,
// ~12 mil tokens de entrada). Perguntar duas vezes a mesma coisa custava duas
// vezes.
//
// Agora a resposta fica em assist_ia_perguntas, com chave na pergunta
// NORMALIZADA + produto. Repetida, sai de lá e a IA não é chamada.
//
// O que impede o cache de mentir: fonte_versao. O prompt manda a IA priorizar
// a informação mais recente, então um cache cego serviria procedimento velho
// depois de uma correção -- e ninguém perceberia, porque a resposta continua
// parecendo boa. Cada linha guarda a impressão digital das fontes; se a base
// mudar, o cache deixa de valer e a pergunta vai para a IA de novo.
//
// A ordem aqui importa: a impressão digital é lida com uma consulta BARATA (só
// carimbos e contagens) ANTES de montar o prompt. Num acerto de cache os 34 mil
// caracteres nem chegam a ser lidos do banco.
// ---------------------------------------------------------------------------
// SÓ O PRODUTO DA PERGUNTA (21/10/2026)
//
// Mandar a base inteira fazia a IA dizer "não encontrei" para o que estava lá:
// das 74 perguntas de confiança baixa em 30 dias, 33 tinham resposta na base
// (E04/E20/E40 do gerador, por exemplo). O mesmo código muda de sentido entre
// produtos -- o E4 aparece em 17 fontes -- e o Haiku 4.5 se perdia no meio.
// Agora o produto (o escolhido na tela, senão o citado na pergunta) separa as
// páginas e os documentos técnicos que vão no prompt; sem produto reconhecível,
// vai tudo, como antes. "Outros" não é produto. Os resumos dos documentos
// técnicos entram como conhecimento, não só como lista de links.
// ---------------------------------------------------------------------------

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Haiku 5.5 pensa antes de responder (o raciocínio vem em blocos "thinking"
// antes do texto) -- por isso a leitura filtra os blocos "text", e o
// max_tokens precisa de folga para o raciocínio.
const MODELO = "claude-haiku-5-5";

const ESQUEMA_RESPOSTA = {
  type: "object",
  properties: {
    resposta: { type: "string" },
    videos: { type: "array", items: { type: "string" } },
    confianca: { type: "string", enum: ["alta", "media", "baixa"] },
  },
  required: ["resposta", "videos", "confianca"],
  additionalProperties: false,
};

// Famílias de produto: o que no texto (já normalizado) indica a família, e
// quais páginas da base (nome normalizado) ela usa. `linha` casa com
// prt_materiais.linha_produto.
const FAMILIAS = [
  { linha: "gerador", termos: /\bgerador|\bgerado\b|inverter/, kb: /^gerador/ },
  { linha: "geladeira", termos: /geladeira|refrigerador|adventure|dual zone|\bst ?(18|30) ?l?\b|\b\d{2} ?(l|lt|lts|litros)\b/, kb: /^geladeira/ },
  { linha: "lavadora", termos: /lavadora|maquina de lavar/, kb: /^lavadora/ },
  { linha: "ar_condicionado", termos: /\bar\b|ar condicionado|climatizador|split|advant|\bg2\b|\bg3\b|slim|clean|compact|st ?4000|t4000|ca22/, kb: /^ar condicionado/ },
];
// Dentro do ar, o modelo citado estreita as páginas. Sem modelo (ou ST4000,
// que não tem página), vão todas as do ar.
const MODELOS_AR = [
  { termos: /advant/, kb: /advantage/ },
  { termos: /\bg2\b|\bg3\b/, kb: /\bg2\b|\bg3\b/ },
  { termos: /split/, kb: /split/ },
  { termos: /slim|clean/, kb: /slim/ },
  { termos: /compact/, kb: /compact/ },
];

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// "Como mudar o Ar-Condicionado para GRAUS?" e "como mudar o ar condicionado
// para graus" são a mesma pergunta. Sem isto o cache quase nunca acertaria.
function normalizar(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // tira acento
    .replace(/[^a-z0-9\s]/g, " ")                        // tira pontuação
    .replace(/\s+/g, " ")
    .trim();
}

// O WhatsApp não entende markdown: `**x**` e `## x` chegam crus ao cliente.
// O prompt já pede o formato certo; isto é a rede para o que escapar, e vale
// também para as respostas guardadas antes da regra existir.
function paraWhatsApp(s: string): string {
  return String(s || "")
    .replace(/\\n/g, "\n")                                   // \n literal → quebra real
    .replace(/\r\n?/g, "\n")
    .replace(/\[([^\]\n]+)\]\((https?:[^)\s]+)\)/g, "$1: $2") // [texto](url) → texto: url
    .replace(/\*\*([^*\n]+)\*\*/g, "*$1*")                    // **x** → *x*
    .replace(/__([^_\n]+)__/g, "*$1*")                        // __x__ → *x*
    .replace(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, "*$1*") // ## Título → *Título*
    .replace(/^[ \t]*[-*+][ \t]+/gm, "• ")                    // - item → • item
    .replace(/^[ \t]*(-{3,}|\*{3,}|_{3,})[ \t]*$/gm, "")      // --- separador
    .replace(/\*\*/g, "")                                     // ** que sobrou sem par
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Que parte da base vai no prompt. null = tudo (produto não reconhecido).
function escolherEscopo(pergunta: string, produto: string | null) {
  const texto = normalizar(`${produto || ""} ${pergunta}`);
  const familias = FAMILIAS.filter((f) => f.termos.test(texto));
  if (!familias.length) return null;
  const modelosAr = MODELOS_AR.filter((m) => m.termos.test(texto));
  return {
    linhas: new Set(familias.map((f) => f.linha)),
    paginaServe: (nome: string) => {
      const n = normalizar(nome);
      return familias.some((f) =>
        f.kb.test(n) && (f.linha !== "ar_condicionado" || !modelosAr.length || modelosAr.some((m) => m.kb.test(n)))
      );
    },
  };
}

// Muda quando a regra de formato do prompt muda: força refazer as guardadas.
const VERSAO_PROMPT = "prompt:v3-produto-haiku55";

// Impressão digital das fontes. Consulta barata de propósito: só carimbos e
// contagens, nunca o conteúdo. É o que permite decidir pelo cache sem ler os
// 34 mil caracteres da base.
async function fonteVersao(): Promise<string> {
  const [kb, mat, reg] = await Promise.all([
    supabase.from("assist_kb_produto").select("atualizado_em"),
    supabase.from("prt_materiais").select("criado_em, processado_em").eq("ativo", true),
    supabase.from("assist_ia_regras").select("atualizado_em").eq("id", 1).maybeSingle(),
  ]);
  const maior = (xs: (string | null)[]) => xs.filter(Boolean).sort().pop() || "0";
  const kbRows = kb.data || [];
  const matRows = mat.data || [];
  return [
    `kb:${maior(kbRows.map((r) => r.atualizado_em))}:${kbRows.length}`,
    `mat:${maior(matRows.flatMap((r) => [r.criado_em, r.processado_em]))}:${matRows.length}`,
    `reg:${(reg.data && reg.data.atualizado_em) || "0"}`,
    VERSAO_PROMPT,
  ].join("|");
}

// Busca a pergunta guardada. produto é opcional, e no banco a chave usa
// coalesce(produto,'') -- aqui o null precisa ser tratado com .is(), porque
// em SQL null não é igual a nada, nem a null.
async function buscarGuardada(norm: string, prod: string | null) {
  const q = supabase.from("assist_ia_perguntas")
    .select("id, resposta, fonte_versao, usos")
    .eq("pergunta_norm", norm);
  const { data } = await (prod === null ? q.is("produto", null) : q.eq("produto", prod)).maybeSingle();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "falta o segredo ANTHROPIC_API_KEY" }, 500);

    const { pergunta, produto, email } = await req.json().catch(() => ({}));
    if (!pergunta || !String(pergunta).trim()) {
      return json({ error: "informe a pergunta" }, 400);
    }

    const norm = normalizar(pergunta);
    // "Outros" é o valor padrão da tela, não um produto: vale como "não escolhido".
    const prod = produto && normalizar(produto) !== "outros" ? String(produto) : null;
    const versao = await fonteVersao();
    const achada = await buscarGuardada(norm, prod);

    // --------------------------------------------- já perguntaram, e a base é a mesma
    if (achada && achada.fonte_versao === versao) {
      await supabase.from("assist_ia_perguntas")
        .update({ usos: (achada.usos || 1) + 1, ultimo_uso: new Date().toISOString() })
        .eq("id", achada.id);
      const r = achada.resposta || {};
      return json({
        ok: true,
        resposta: paraWhatsApp(r.resposta || ""),
        videos: Array.isArray(r.videos) ? r.videos : [],
        confianca: r.confianca || "media",
        cache: true,
      });
    }

    // ------------------------------ não tinha, ou a base mudou: pergunta à IA

    // Data curta DD/MM/AAAA (UTC) para carimbar recência das fontes.
    const fmtData = (ts: string | null) => {
      if (!ts) return "sem data";
      const d = new Date(ts);
      return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
    };

    const escopo = escolherEscopo(String(pergunta), prod);

    const { data: kb } = await supabase
      .from("assist_kb_produto")
      .select("produto, conteudo_md, atualizado_em");
    const paginas = (kb || []).filter((k) => !escopo || escopo.paginaServe(k.produto || ""));
    const baseConhecimento = paginas
      .map((k) => `### PRODUTO: ${k.produto} (atualizado em ${fmtData(k.atualizado_em)})\n${k.conteudo_md}`)
      .join("\n\n---\n\n") || "(nenhuma página de produto para este assunto)";

    // Materiais técnicos & vídeos (prt_materiais) — leitura ao vivo, do mais NOVO ao mais antigo.
    const { data: materiais } = await supabase
      .from("prt_materiais")
      .select("titulo, descricao, tipo, url, linha_produto, modelo, resumo_tecnico, criado_em")
      .eq("ativo", true)
      .order("criado_em", { ascending: false });
    const listaMateriais = (materiais || [])
      .filter((m) => m.url)
      .filter((m) => !escopo || escopo.linhas.has(m.linha_produto || ""))
      .map((m) => {
        const cab = `- [${m.linha_produto || "?"}${m.modelo ? " / " + m.modelo : ""}] ${m.titulo} (${m.tipo}, doc de ${fmtData(m.criado_em)}): ${m.url}${m.descricao ? " — " + m.descricao : ""}`;
        return m.resumo_tecnico ? `${cab}\n  RESUMO DO DOCUMENTO: ${m.resumo_tecnico}` : cab;
      })
      .join("\n") || "(sem materiais)";

    const { data: regras } = await supabase
      .from("assist_ia_regras")
      .select("instrucoes, dicas")
      .eq("id", 1)
      .maybeSingle();
    const instrucoesEquipe = (regras?.instrucoes || "").trim();
    const dicasEquipe = (regras?.dicas || "").trim();

    const sistema =
      "Você é o tira-dúvidas da assistência técnica do Grupo Bononi (produtos Stonni). " +
      "Um ATENDENTE faz uma pergunta; responda com base SOMENTE no conhecimento fornecido: as PÁGINAS DE PRODUTO, " +
      "os DOCUMENTOS TÉCNICOS (o 'RESUMO DO DOCUMENTO' de cada um vale como base, tanto quanto as páginas) " +
      "e as regras/dicas da equipe. Produza uma resposta CORDIAL e OBJETIVA, pronta para o atendente copiar e " +
      "mandar ao cliente no WhatsApp (linguagem simples; passo a passo quando fizer sentido). " +
      "Se houver vídeo pertinente, inclua o link em 'videos' (use apenas links presentes nas páginas ou nos documentos). " +
      "\n\nCÓDIGOS DE ERRO: o mesmo código significa coisas diferentes em produtos diferentes — use só o que vale " +
      "para o produto da pergunta. Se o código ou o assunto aparece no conhecimento fornecido para esse produto, " +
      "responda com a solução: nunca diga que não encontrou algo que está no texto. Se a solução muda conforme " +
      "o modelo ou a voltagem (ex.: 12V × 24V), dê a de cada um em vez de só perguntar. " +
      "Só quando o conhecimento realmente NÃO cobrir a dúvida: diga que precisa confirmar e peça o dado que falta " +
      "(ex.: código de erro no display). NÃO invente solução." +
      "\n\nCAMPOS: 'resposta' = o texto para o WhatsApp; 'videos' = links; 'confianca' = 'alta' quando a resposta " +
      "está no conhecimento fornecido, 'media' quando está mas depende de um dado que o atendente não informou, " +
      "'baixa' quando o conhecimento não cobre. Português do Brasil." +
      "\n\nFORMATO DO TEXTO EM 'resposta' (vai colado no WhatsApp, que NÃO entende markdown): " +
      "NÃO use markdown — nada de **, ##, títulos, tabelas nem [texto](link). " +
      "Para destacar, use *um asterisco de cada lado* (negrito do WhatsApp), com moderação. " +
      "Passo a passo: um passo por linha, numerado como 1) 2) 3). " +
      "Separe saudação, explicação e fechamento com uma linha em branco (\\n\\n). " +
      "Link, se precisar, solto no texto. Mensagem curta, no máximo um emoji." +
      "\n\nPRIORIDADE POR RECÊNCIA: quando duas fontes se contradisserem sobre o MESMO tema, vale SEMPRE a mais recente. " +
      "Ordem de prioridade: (1) DICAS DA EQUIPE — são as correções mais recentes e sempre prevalecem; " +
      "(2) DOCUMENTOS TÉCNICOS mais recentes — compare a data 'doc de DD/MM/AAAA'; " +
      "(3) PÁGINAS DE PRODUTO do Notion — veja 'atualizado em DD/MM/AAAA'. " +
      "Uma informação mais nova sobre o mesmo assunto SUBSTITUI a mais antiga." +
      (instrucoesEquipe ? `\n\nREGRAS DA EQUIPE:\n${instrucoesEquipe}` : "") +
      (dicasEquipe ? `\n\nDICAS DA EQUIPE:\n${dicasEquipe}` : "");

    const contexto =
      `PERGUNTA DO ATENDENTE: ${String(pergunta).trim()}\n\n` +
      (prod ? `PRODUTO (escolhido pelo atendente): ${prod}\n\n` : "") +
      `PÁGINAS DE PRODUTO (Notion):\n${baseConhecimento}\n\n` +
      `DOCUMENTOS TÉCNICOS & VÍDEOS (o resumo é conhecimento; o link pode ir ao cliente):\n${listaMateriais}`;

    const anthropic = new Anthropic({ apiKey });
    // deno-lint-ignore no-explicit-any
    let msg: any;
    try {
      msg = await anthropic.messages.create({
        model: MODELO,
        max_tokens: 6000,
        system: sistema,
        messages: [{ role: "user", content: [{ type: "text", text: contexto }] }],
        output_config: { effort: "medium", format: { type: "json_schema", schema: ESQUEMA_RESPOSTA } },
      // deno-lint-ignore no-explicit-any
      } as any);
    } catch (e) {
      if (e instanceof Anthropic.APIError) return json({ error: `Anthropic ${e.status}: ${e.message}` }, 502);
      throw e;
    }
    if (msg.stop_reason === "refusal") return json({ error: "A IA recusou esta pergunta. Reformule e tente de novo." }, 502);
    if (msg.stop_reason === "max_tokens") return json({ error: "A resposta da IA ficou grande demais e foi cortada. Tente de novo." }, 502);
    // deno-lint-ignore no-explicit-any
    const texto = (msg.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();

    let parsed: { resposta?: string; videos?: string[]; confianca?: string } = {};
    try {
      const jstart = texto.indexOf("{");
      const jend = texto.lastIndexOf("}");
      parsed = JSON.parse(texto.slice(jstart, jend + 1));
    } catch (_e) {
      // se não vier JSON, devolve o texto puro como resposta
      parsed = { resposta: texto, videos: [], confianca: "media" };
    }

    const saida = {
      resposta: paraWhatsApp(parsed.resposta || ""),
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
      confianca: parsed.confianca || "media",
    };

    // ------------------------------------------------ guarda para a próxima vez
    // Falha aqui NÃO pode derrubar a resposta: a pessoa já esperou pela IA, e
    // não conseguir gravar o cache é problema nosso, não dela.
    try {
      if (achada) {
        // já existia, mas a base mudou: a resposta velha é substituída
        await supabase.from("assist_ia_perguntas")
          .update({ resposta: saida, fonte_versao: versao, ultimo_uso: new Date().toISOString() })
          .eq("id", achada.id);
      } else {
        await supabase.from("assist_ia_perguntas").insert({
          pergunta_norm: norm,
          produto: prod,
          pergunta: String(pergunta).trim(),
          resposta: saida,
          fonte_versao: versao,
          usuario_email: email || null,
        });
      }
    } catch (_e) { /* silencioso de propósito -- ver comentário acima */ }

    return json({ ok: true, ...saida, cache: false });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
