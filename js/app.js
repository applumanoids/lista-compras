/* Minha Lista de Compras – Lumanoids
   Dados salvos só no aparelho (localStorage). Item: {id, nome, status:'lista'|'carrinho', preco:null|número, qtd} */
(() => {
'use strict';
const CHAVE = 'lumanoids.compras.v2';
const CHAVE_CUSTOM = 'lumanoids.compras.produtos';
const $ = s => document.querySelector(s);
const brl = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n||0);
const norm = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const esc = t => String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap = t => t.trim().replace(/\s+/g,' ').replace(/^./,c=>c.toUpperCase());
const novoId = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const lerPreco = t => { t=String(t||'').replace(/[^\d,.]/g,''); if(!t) return null;
  if (t.includes(',')) t=t.replace(/\./g,'').replace(',','.'); const n=parseFloat(t); return isNaN(n)||n<=0?null:Math.round(n*100)/100; };
const fmtInput = n => n==null?'':String(n).replace('.',',');

function carregar(k,pad){ try{ const v=JSON.parse(localStorage.getItem(k)); return v??pad; }catch{ return pad; } }
function salvar(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){ toast('Não foi possível salvar neste aparelho'); } }

let itens = carregar(CHAVE,[]);
let custom = carregar(CHAVE_CUSTOM,[]);
const gravar = () => salvar(CHAVE,itens);

// Catálogo = inicial + cadastrados por mim
function catalogoCompleto(){
  const mapa = {}; // nomeNormalizado -> {nome,cat}
  for (const [cat,lista] of Object.entries(window.CATALOGO)) lista.forEach(n=>mapa[norm(n)]={nome:n,cat});
  custom.forEach(n=>{ if(!mapa[norm(n)]) mapa[norm(n)]={nome:n,cat:'Meus produtos'}; });
  return Object.values(mapa);
}
const existe = nome => itens.find(i=>norm(i.nome)===norm(nome));
function registrarSeNovo(nome){
  if (!catalogoCompleto().some(p=>norm(p.nome)===norm(nome))){ custom.push(nome); salvar(CHAVE_CUSTOM,custom); }
}

// ---------- Render ----------
function render(){
  const carr = itens.filter(i=>i.status==='carrinho');
  const lista = itens.filter(i=>i.status==='lista');
  const total = carr.reduce((s,i)=> i.preco? s+i.preco*i.qtd : s, 0);
  const sem = carr.filter(i=>!i.preco).length;
  $('#total').textContent = brl(total);
  $('#cPend').textContent = lista.length;
  $('#cCarr').textContent = carr.length;
  $('#cSem').textContent = sem;
  $('#qtdCarrinho').textContent = carr.length;
  $('#qtdLista').textContent = lista.length;

  $('#listaCarrinho').innerHTML = carr.length ? carr.map(i=>{
    const tem=!!i.preco;
    return `<div class="item ${tem?'com':'sem'} item-compacto" data-id="${i.id}">
      <button class="item-nome" data-a="abrirCarrinho" title="${esc(i.nome)}">${esc(i.nome)}</button>
      <span class="qtd-compacta">${i.qtd}×</span>
      <button class="preco-compacto" data-a="abrirCarrinho" aria-label="Editar preço">${tem?brl(i.preco*i.qtd):'Sem preço'}</button>
      <button class="icone-btn" data-a="devolver" aria-label="Devolver à lista">↩</button>
      <button class="icone-btn" data-a="excluir" aria-label="Excluir">×</button>
    </div>`;}).join('') : '<div class="vazio">Nenhum produto no carrinho.</div>';
  $('#listaPendentes').innerHTML = lista.length ? lista.map(i=>`
    <div class="item pend item-compacto" data-id="${i.id}">
      <button class="item-nome" data-a="abrirLista" title="${esc(i.nome)}">${esc(i.nome)}</button>
      <button class="icone-btn acao-adicionar" data-a="abrirLista" aria-label="Adicionar ao carrinho">＋</button>
    </div>`).join('') : '<div class="vazio">Digite um produto ou escolha do catálogo.</div>';
}

// ---------- Ações ----------
function adicionarLista(nome, silencioso){
  nome = cap(nome||''); if(!nome) return false;
  const ja = existe(nome);
  if (ja){ toast(`${ja.nome} já está ${ja.status==='lista'?'na lista':'no carrinho'}`); return false; }
  registrarSeNovo(nome);
  itens.push({id:novoId(),nome,status:'lista',preco:null,qtd:1});
  gravar(); render(); if(!silencioso) toast(`${nome} adicionado à lista`); return true;
}
const porId = id => itens.find(i=>i.id===id);

document.addEventListener('click', e=>{
  const b = e.target.closest('[data-a]'); if(!b) return;
  const el = b.closest('[data-id]'); const it = el && porId(el.dataset.id);
  const a = b.dataset.a;
  if (a==='abrirLista') abrirSheetLista(it);
  else if (a==='abrirCarrinho') abrirSheetCarrinho(it);
  else if (a==='mais'){ it.qtd=Math.min(999,it.qtd+1); gravar(); render(); }
  else if (a==='menos'){ it.qtd=Math.max(1,it.qtd-1); gravar(); render(); }
  else if (a==='devolver'){ it.status='lista'; it.preco=null; it.qtd=1; gravar(); render(); toast(`${it.nome} voltou para a lista`); }
  else if (a==='excluir'){ if(confirm(`Excluir "${it.nome}"?`)){ itens=itens.filter(x=>x!==it); gravar(); render(); } }
});

// ---------- Busca com sugestões ----------
const inp = $('#inpNome'), box = $('#sugestoes');
function sugerir(){
  const q = norm(inp.value); if(!q){ box.hidden=true; return; }
  const todos = catalogoCompleto();
  const ini = todos.filter(p=>norm(p.nome).startsWith(q));
  const meio = todos.filter(p=>!norm(p.nome).startsWith(q) && norm(p.nome).split(/\s+/).some(w=>w.startsWith(q)) || (!norm(p.nome).startsWith(q) && q.length>2 && norm(p.nome).includes(q)));
  const res = [...ini,...meio.filter(m=>!ini.includes(m))].slice(0,6);
  let html = res.map(p=>`<button data-nome="${esc(p.nome)}">${esc(p.nome)}<small>${esc(p.cat)}</small></button>`).join('');
  if (!todos.some(p=>norm(p.nome)===q)) html += `<button class="novo" data-nome="${esc(cap(inp.value))}">＋ Cadastrar "${esc(cap(inp.value))}"</button>`;
  box.innerHTML = html; box.hidden = false;
}
inp.addEventListener('input',sugerir);
box.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
  adicionarLista(b.dataset.nome); inp.value=''; box.hidden=true; inp.focus(); });
function addDoCampo(){ if(adicionarLista(inp.value)){ } inp.value=''; box.hidden=true; inp.focus(); }
$('#btnAdd').addEventListener('click',addDoCampo);
$('#btnAddCarrinho').addEventListener('click',()=>{
  const nome=cap(inp.value||'');
  if(!nome){toast('Digite o nome do produto primeiro');inp.focus();return;}
  const ja=existe(nome);
  if(ja){toast(`${ja.nome} já está ${ja.status==='lista'?'na lista':'no carrinho'}`);return;}
  registrarSeNovo(nome);
  const it={id:novoId(),nome,status:'lista',preco:null,qtd:1};
  itens.push(it);gravar();render();inp.value='';box.hidden=true;
  abrirSheetLista(it);
  // A tela permite informar preço e quantidade antes de adicionar ao carrinho.
  // Se cancelar, o produto permanece na lista, sem perder o cadastro.
});
inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addDoCampo(); } });
document.addEventListener('click',e=>{ if(!e.target.closest('.campo-busca')) box.hidden=true; });

// ---------- Sheet ----------
const sheet=$('#sheet'), fundo=$('#fundo');
function abrir(html){ sheet.innerHTML='<div class="sheet-alca"></div>'+html; sheet.hidden=false; fundo.hidden=false; sheet.scrollTop=0; }
function fechar(){ sheet.hidden=true; fundo.hidden=true; sheet.innerHTML=''; }
fundo.addEventListener('click',fechar);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!sheet.hidden) fechar(); });
function stepperHTML(q){ return `<div class="stepper"><button type="button" id="sMenos" aria-label="Diminuir">−</button><span id="sQtd">${q}</span><button type="button" id="sMais" aria-label="Aumentar">+</button></div>`; }
function ligarStepper(q0){ let q=q0; const s=$('#sQtd');
  $('#sMenos').onclick=()=>{ q=Math.max(1,q-1); s.textContent=q; };
  $('#sMais').onclick=()=>{ q=Math.min(999,q+1); s.textContent=q; };
  return ()=>q; }

function abrirSheetLista(it){
  abrir(`<h3>Pegou no mercado?</h3>
    <label for="sNome">Produto</label><input type="text" id="sNome" value="${esc(it.nome)}">
    <div class="linha-2"><div><label>Quantidade</label>${stepperHTML(it.qtd||1)}</div>
    <div><label for="sPreco">Preço unitário</label><input type="text" id="sPreco" class="preco-input" inputmode="decimal" placeholder="R$ 0,00"></div></div>
    <p class="dica">Sem preço? Ele vai para o carrinho em amarelo e fica fora da soma até você informar.</p>
    <div class="acoes">
      <button class="btn-verde" id="sOk">🛒 Adicionar ao carrinho</button>
      <button class="btn-sec" id="sSalvar">Salvar nome</button>
      <button class="btn-perigo" id="sDel">Excluir da lista</button>
    </div>`);
  const getQ = ligarStepper(it.qtd||1);
  $('#sOk').onclick=()=>{ const n=cap($('#sNome').value)||it.nome; it.nome=n; it.qtd=getQ(); it.preco=lerPreco($('#sPreco').value); it.status='carrinho';
    gravar(); fechar(); render(); toast(it.preco?`${n} no carrinho`:`${n} no carrinho (sem preço)`); };
  $('#sSalvar').onclick=()=>{ const n=cap($('#sNome').value); if(!n) return; if(norm(n)!==norm(it.nome)&&existe(n)){ toast('Já existe um item com esse nome'); return; }
    it.nome=n; registrarSeNovo(n); gravar(); fechar(); render(); };
  $('#sDel').onclick=()=>{ itens=itens.filter(x=>x!==it); gravar(); fechar(); render(); };
}

function abrirSheetCarrinho(it){
  abrir(`<h3>${esc(it.nome)}</h3>
    <div class="linha-2"><div><label>Quantidade</label>${stepperHTML(it.qtd)}</div>
    <div><label for="sPreco">Preço unitário</label><input type="text" id="sPreco" class="preco-input" inputmode="decimal" placeholder="R$ 0,00" value="${fmtInput(it.preco)}"></div></div>
    <div class="acoes">
      <button class="btn-verde" id="sOk">Salvar</button>
      <button class="btn-sec" id="sVolta">↩ Devolver à lista</button>
      <button class="btn-perigo" id="sDel">Excluir</button>
    </div>`);
  const getQ = ligarStepper(it.qtd);
  setTimeout(()=>$('#sPreco').focus(),250);
  const salvarEdicao=()=>{ it.qtd=getQ(); it.preco=lerPreco($('#sPreco').value); gravar(); fechar(); render(); };
  $('#sOk').onclick=salvarEdicao;
  $('#sPreco').addEventListener('keydown',e=>{ if(e.key==='Enter') salvarEdicao(); });
  $('#sVolta').onclick=()=>{ it.status='lista'; it.preco=null; it.qtd=1; gravar(); fechar(); render(); toast(`${it.nome} voltou para a lista`); };
  $('#sDel').onclick=()=>{ itens=itens.filter(x=>x!==it); gravar(); fechar(); render(); };
}

// ---------- Catálogo ----------
$('#btnCatalogo').addEventListener('click',()=>{
  const cats=['Todos',...Object.keys(window.CATALOGO)]; if(custom.length) cats.push('Meus produtos');
  let catAtual='Todos', busca='';
  abrir(`<h3>Catálogo de produtos</h3>
    <input type="search" id="cBusca" placeholder="Buscar no catálogo">
    <div class="cats" id="cCats"></div>
    <div class="cat-lista" id="cLista"></div>
    <div class="acoes"><button class="btn-prim" id="cFim" style="min-height:52px">Concluir</button></div>`);
  const pinta=()=>{
    $('#cCats').innerHTML=cats.map(c=>`<button class="cat ${c===catAtual?'on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    let prods=catalogoCompleto().filter(p=>catAtual==='Todos'||p.cat===catAtual).filter(p=>!busca||norm(p.nome).includes(busca));
    prods.sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    $('#cLista').innerHTML=prods.map(p=>{ const it=existe(p.nome);
      const cl=it?(it.status==='lista'?'sel':'car'):''; return `<button class="prod ${cl}" data-n="${esc(p.nome)}">${it?(it.status==='lista'?'✓ ':'🛒 '):''}${esc(p.nome)}</button>`; }).join('')||'<div class="vazio">Nada encontrado. Use o campo da lista para cadastrar.</div>';
  };
  pinta();
  $('#cBusca').oninput=e=>{ busca=norm(e.target.value); pinta(); };
  $('#cCats').onclick=e=>{ const b=e.target.closest('[data-c]'); if(b){ catAtual=b.dataset.c; pinta(); } };
  $('#cLista').onclick=e=>{ const b=e.target.closest('[data-n]'); if(!b) return; const it=existe(b.dataset.n);
    if(!it) adicionarLista(b.dataset.n,true);
    else if(it.status==='lista'){ itens=itens.filter(x=>x!==it); gravar(); render(); }
    else toast('Já está no carrinho');
    pinta(); };
  $('#cFim').onclick=fechar;
});

// ---------- Calculadora ----------
$('#btnCalc').addEventListener('click',()=>{
  let expr='';
  const teclas=['C','( )','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','⌫','0',',','='];
  abrir(`<h3>Calculadora</h3>
    <div class="visor"><small id="kExp"></small><b id="kRes">0</b></div>
    <div class="teclas">${teclas.map(t=>`<button class="tecla ${'÷×−+%C( )⌫'.includes(t)&&t!==','?'op':''} ${t==='='?'ig':''}" data-k="${t}">${t}</button>`).join('')}</div>
    <div class="acoes"><button class="btn-sec" id="kTotal">Usar o total da compra (${brl(itens.reduce((s,i)=>i.status==='carrinho'&&i.preco?s+i.preco*i.qtd:s,0))})</button></div>`);
  const mostra=()=>{ $('#kExp').textContent=expr; $('#kRes').textContent=calc(expr,true)??'0'; };
  function calc(x,suave){ if(!x) return null;
    let s=x.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-').replace(/,/g,'.').replace(/(\d+(\.\d+)?)%/g,'($1/100)');
    if(!/^[\d+\-*/().\s]+$/.test(s)) return null;
    try{ const v=Function('"use strict";return ('+s+')')(); if(!isFinite(v)) return suave?null:'Erro';
      return String(Math.round(v*1e8)/1e8).replace('.',','); }catch{ return null; } }
  document.querySelector('.teclas').onclick=e=>{ const k=e.target.closest('[data-k]')?.dataset.k; if(!k) return;
    if(k==='C') expr=''; else if(k==='⌫') expr=expr.slice(0,-1);
    else if(k==='='){ const r=calc(expr); if(r!=null) expr=r; }
    else if(k==='( )'){ const ab=(expr.match(/\(/g)||[]).length, fe=(expr.match(/\)/g)||[]).length;
      expr += (ab>fe && /[\d)%]$/.test(expr)) ? ')' : '('; }
    else expr+=k; mostra(); };
  $('#kTotal').onclick=()=>{ expr+=String(itens.reduce((s,i)=>i.status==='carrinho'&&i.preco?s+i.preco*i.qtd:s,0)).replace('.',','); mostra(); };
  mostra();
});

// ---------- Copiar / Compartilhar ----------
function textoLista(){
  const carr=itens.filter(i=>i.status==='carrinho'), lista=itens.filter(i=>i.status==='lista');
  const total=carr.reduce((s,i)=>i.preco?s+i.preco*i.qtd:s,0);
  let t='🛒 Minha Lista de Compras – Lumanoids\n';
  if(carr.length){ t+='\nNo carrinho:\n'+carr.map(i=>i.preco?`🟢 ${i.nome} — ${i.qtd} x ${brl(i.preco)} = ${brl(i.preco*i.qtd)}`:`🟡 ${i.nome} — ${i.qtd} un (sem preço)`).join('\n')+'\n'; }
  if(lista.length){ t+='\nFalta comprar:\n'+lista.map(i=>`🔵 ${i.nome}`).join('\n')+'\n'; }
  if(carr.length) t+=`\nTotal da compra: ${brl(total)}`;
  return t.trim();
}
async function copiar(txt){ try{ await navigator.clipboard.writeText(txt); return true; }catch{
  const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); let ok=false; try{ ok=document.execCommand('copy'); }catch{} ta.remove(); return ok; } }
$('#btnCopiar').addEventListener('click',async()=>{ if(!itens.length) return toast('A lista está vazia'); toast(await copiar(textoLista())?'Lista copiada':'Não foi possível copiar'); });


// ---------- Limpar ----------
$('#btnLimpar').addEventListener('click',()=>{
  abrir(`<h3>Limpar lista</h3>
    <p class="dica" style="font-size:.95rem">Os dados ficam salvos só neste aparelho. Depois de limpar, não dá para recuperar.</p>
    <div class="acoes">
      <button class="btn-sec" id="lCarr">Limpar só o carrinho</button>
      <button class="btn-sec" id="lLista">Limpar só a lista de compras</button>
      <button class="btn-perigo" id="lTudo">Limpar tudo</button>
      <button class="btn-sec" id="lCancel">Cancelar</button>
    </div>`);
  const fazer=(f,msg)=>()=>{ itens=itens.filter(f); gravar(); fechar(); render(); toast(msg); };
  $('#lCarr').onclick=fazer(i=>i.status!=='carrinho','Carrinho limpo');
  $('#lLista').onclick=fazer(i=>i.status!=='lista','Lista limpa');
  $('#lTudo').onclick=fazer(()=>false,'Tudo limpo');
  $('#lCancel').onclick=fechar;
});

// ---------- Informações ----------
$('#btnInfo').addEventListener('click',()=>{
  abrir(`<h3>Lumanoids</h3>
    <a class="info-card" href="https://applumanoids.github.io/Tudo-em-dia/" target="_blank" rel="noopener noreferrer">
       <b>✅ Conheça o Tudo em Dia</b><span>Conheça o aplicativo Tudo em Dia e organize seus compromissos.</span></a>
    <a class="info-card" href="https://applumanoids.github.io/Carteira/" target="_blank" rel="noopener">
      <b>💰 Conheça a Carteira</b><span>Organize sua vida financeira com a Minha Carteira.</span></a>
    <a class="info-card" href="https://applumanoids.github.io/sitelumanoids.com/" target="_blank" rel="noopener">
      <b>🚀 Soluções Lumanoids</b><span>Conheça o site e as soluções em dados, apps e automação.</span></a>
    <div class="info-preco">Sabe quanto custaria criar um app como esse na Lumanoids? <strong>R$ 200</strong>.</div>
    <div class="acoes"><button class="btn-sec" id="iFim">Fechar</button></div>`);
  $('#iFim').onclick=fechar;
});

// ---------- Toast ----------
let tt; function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(tt); tt=setTimeout(()=>t.classList.remove('on'),2200); }

// ---------- Instalação PWA: apenas no rodapé ----------
let promptInstalar=null;
const instalacao=$('#instalacaoRodape');
const botaoInstalar=$('#btnInstalar');
const instrucao=$('#instrucaoInstalar');
const instalado=()=>matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
function atualizarInstalacao(){
  const registrado=localStorage.getItem('lumanoids.compras.instalado')==='1';
  instalacao.hidden=!!instalado() || registrado;
  if(instalado() || registrado) return;
  botaoInstalar.hidden=false;
  instrucao.hidden=true;
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptInstalar=e;atualizarInstalacao();});
botaoInstalar.addEventListener('click',async()=>{
  if(promptInstalar){const evento=promptInstalar;promptInstalar=null;await evento.prompt();const escolha=await evento.userChoice;if(escolha.outcome==='accepted'){try{localStorage.setItem('lumanoids.compras.instalado','1')}catch{}}atualizarInstalacao();return;}
  instrucao.hidden=false;
  instrucao.textContent=ios?'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.':'No Chrome, abra o menu ⋮ e selecione Instalar app ou Adicionar à tela inicial.';
});
window.addEventListener('appinstalled',()=>{try{localStorage.setItem('lumanoids.compras.instalado','1')}catch{} atualizarInstalacao();});
atualizarInstalacao();

if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
render();
})();
