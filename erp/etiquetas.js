/* ERP Bononi — Etiquetas (código de barras Code128 em JS puro, impressão térmica/Argox) */

/* Tabela de padrões Code128 (índice = valor do código; larguras de barras/espaços em módulos) */
const _C128=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212",
"112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122",
"321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
"231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131",
"311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122",
"141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142",
"121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113",
"114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];

/* Gera SVG de código de barras Code128-B para o texto informado */
function barcode128(texto, opts){
  opts=opts||{}; const mod=opts.mod||1.6, h=opts.h||46;
  let s=String(texto||'').replace(/[^\x20-\x7E]/g,''); if(!s) return '';
  const codes=[104]; // Start B
  let sum=104;
  for(let i=0;i<s.length;i++){ const v=s.charCodeAt(i)-32; codes.push(v); sum+=v*(i+1); }
  codes.push(sum%103); // dígito verificador
  codes.push(106);     // Stop
  let pat=''; codes.forEach(c=>{ pat+=_C128[c]; });
  let x=0, rects='';
  for(let i=0;i<pat.length;i++){ const w=parseInt(pat[i],10)*mod; if(i%2===0){ rects+='<rect x="'+x.toFixed(2)+'" y="0" width="'+w.toFixed(2)+'" height="'+h+'"/>'; } x+=w; }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+x.toFixed(2)+'" height="'+h+'" viewBox="0 0 '+x.toFixed(2)+' '+h+'" preserveAspectRatio="none" style="width:100%;height:'+h+'px">'+rects+'</svg>';
}
window.barcode128=barcode128;

/* Abre diálogo para escolher a quantidade de etiquetas de um produto */
function etiquetaProdutoDialog(id){
  const r=(window.__prodRows||[]).find(p=>String(p.id)===String(id))||{};
  openModal('Etiqueta — '+esc(r.nome||('#'+id)),
    '<div class="form-grid"><div class="field"><label>Quantidade de etiquetas</label>'+
      '<input type="number" id="et-qtd" min="1" value="1" style="width:120px"></div></div>'+
    '<p style="font-size:12px;color:hsl(var(--text-muted))">Código de barras: <b>'+esc(r.codigo_barras||r.referencia||'—')+'</b> (Code128). Formato para impressora térmica/Argox.</p>',
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>'+
    '<button class="btn" onclick="imprimirEtiquetaProduto('+id+',Number(($(\'#et-qtd\')||{}).value)||1)">Imprimir</button>');
}
window.etiquetaProdutoDialog=etiquetaProdutoDialog;

/* Imprime N etiquetas térmicas do produto */
function imprimirEtiquetaProduto(id, qtd){
  const r=(window.__prodRows||[]).find(p=>String(p.id)===String(id)); if(!r){ toast('Produto não encontrado','err'); return; }
  qtd=Math.max(1, Number(qtd)||1);
  const cod=String(r.codigo_barras||r.referencia||r.id);
  const nome=esc(String(r.nome||'').slice(0,42));
  const preco=r.preco_venda!=null?fmtFull(r.preco_venda):'';
  const bc=barcode128(cod,{mod:1.4,h:42});
  let um='<div class="etq">'+
      '<div class="nome">'+nome+'</div>'+
      '<div class="ref">Ref: '+esc(r.referencia||'—')+'</div>'+
      '<div class="bc">'+bc+'</div>'+
      '<div class="cod">'+esc(cod)+'</div>'+
      (preco?'<div class="preco">'+preco+'</div>':'')+
    '</div>';
  let etiquetas=''; for(let i=0;i<qtd;i++) etiquetas+=um;
  const w=window.open('','_blank','width=420,height=520'); if(!w){ toast('Permita pop-ups para imprimir','err'); return; }
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Etiquetas</title><style>'+
    '@page{size:50mm 30mm;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}'+
    '.etq{width:50mm;height:30mm;padding:1.5mm 2mm;page-break-after:always;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}'+
    '.nome{font-size:8pt;font-weight:bold;line-height:1.05;max-height:2.4em;overflow:hidden}'+
    '.ref{font-size:7pt;color:#000}.bc{margin:0.5mm 0}.bc svg{display:block}'+
    '.cod{font-size:7pt;text-align:center;letter-spacing:1px;margin-top:-0.5mm}'+
    '.preco{font-size:12pt;font-weight:bold;text-align:right}'+
    '@media screen{body{background:#eee;padding:10px}.etq{background:#fff;border:1px solid #ccc;margin:0 auto 8px}}'+
    '</style></head><body>'+etiquetas+
    '<div class="noprint" style="text-align:center;margin:10px 0"><button onclick="window.print()" style="padding:8px 16px">Imprimir</button></div>'+
    '<style>@media print{.noprint{display:none}}</style></body></html>');
  w.document.close(); setTimeout(function(){ try{ w.focus(); w.print(); }catch(e){} },350);
}
window.imprimirEtiquetaProduto=imprimirEtiquetaProduto;

/* Etiqueta de expedição (destinatário) a partir de uma venda */
async function imprimirEtiquetaExpedicao(idVenda){
  try{
    const {data,error}=await sb.rpc('erp_venda_detalhe',{p_id:idVenda}); if(error) throw error;
    const v=data.venda||{};
    const clientes=await lookup('clientes');
    const c=clientes.find(x=>String(x.id)===String(v.id_cliente))||{};
    const linhaEnd=[c.endereco,c.numero].filter(Boolean).join(', ')+(c.complemento?' - '+c.complemento:'');
    const linhaCid=[c.cidade,c.uf].filter(Boolean).join(' / ');
    const bc=barcode128(String(v.numero||idVenda),{mod:1.3,h:38});
    const body=
      '<div class="exp">'+
        '<div class="rem">REMETENTE: '+esc(v.empresa||'')+'</div>'+
        '<div class="dest-lbl">DESTINATÁRIO</div>'+
        '<div class="nome">'+esc(c.nome||v.cliente||'')+'</div>'+
        (linhaEnd?'<div class="l">'+esc(linhaEnd)+'</div>':'')+
        (c.bairro?'<div class="l">'+esc(c.bairro)+'</div>':'')+
        (linhaCid?'<div class="l">'+esc(linhaCid)+'</div>':'')+
        (c.cep?'<div class="l">CEP: '+esc(c.cep)+'</div>':'')+
        '<div class="bc">'+bc+'</div>'+
        '<div class="ped">Venda '+esc(v.numero||'')+'</div>'+
      '</div>';
    const w=window.open('','_blank','width=520,height=420'); if(!w){ toast('Permita pop-ups para imprimir','err'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Etiqueta de expedição</title><style>'+
      '@page{size:100mm 60mm;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}'+
      '.exp{width:100mm;height:60mm;padding:4mm 5mm;page-break-after:always;display:flex;flex-direction:column}'+
      '.rem{font-size:8pt;border-bottom:1px solid #000;padding-bottom:1mm;margin-bottom:1.5mm}'+
      '.dest-lbl{font-size:8pt;font-weight:bold;letter-spacing:1px}'+
      '.nome{font-size:14pt;font-weight:bold;margin:0.5mm 0}.l{font-size:10pt;line-height:1.25}'+
      '.bc{margin-top:auto}.bc svg{display:block}.ped{font-size:9pt;text-align:center}'+
      '@media screen{body{background:#eee;padding:10px}.exp{background:#fff;border:1px solid #ccc;margin:0 auto}}'+
      '@media print{.noprint{display:none}}'+
      '</style></head><body>'+body+
      '<div class="noprint" style="text-align:center;margin:10px 0"><button onclick="window.print()" style="padding:8px 16px">Imprimir</button></div>'+
      '</body></html>');
    w.document.close(); setTimeout(function(){ try{ w.focus(); w.print(); }catch(e){} },350);
  }catch(e){ toast('Erro ao imprimir etiqueta: '+(e.message||e),'err'); }
}
window.imprimirEtiquetaExpedicao=imprimirEtiquetaExpedicao;
