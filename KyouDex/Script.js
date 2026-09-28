/* ---------- Dados ---------- */
let pokemons = []; // preenchida pela PokéAPI (veja carregar() abaixo)

const $ = s => document.querySelector(s);

/* ---------- Capturas (salvas no navegador) ---------- */
const capturados = new Set((() => { try { return JSON.parse(localStorage.getItem(CHAVE_CAPTURAS)) || []; } catch { return []; } })());
const salvarCapturas = () => { try { localStorage.setItem(CHAVE_CAPTURAS, JSON.stringify([...capturados])); } catch {} };
const atualizarContador = () => { $('#contador').textContent = String(capturados.size).padStart(3,'0'); };

/* ---------- Estado ---------- */
const estado = {regiao:'Kanto', tipo:null, busca:'', ordem:'asc', lista:false};
const pad = n => String(n).padStart(4,'0');

/* ---------- Filtros laterais ---------- */
function montarFiltros(){
  const regs = ['Todas',...REGIOES];
  const scroll = $('#regioes').scrollTop; // mantém a posição da rolagem ao re-renderizar
  $('#regioes').innerHTML = regs.map(r=>{
    const qtd = r==='Todas' ? 1025 : FAIXAS[r][1]-FAIXAS[r][0]+1;
    return `<button class="reg ${estado.regiao===r?'on':''}" data-r="${r}">${r}<small>${String(qtd).padStart(2,'0')}</small></button>`;
  }).join('');
  $('#regioes').scrollTop = scroll;
  $('#tipos').innerHTML = Object.entries(TIPOS).map(([k,t])=>
    `<button class="chip ${estado.tipo===k?'on':''}" style="background:${t.cor}" data-t="${k}">${icone(k)}${t.nome}</button>`).join('');
}

/* ---------- Cartões ---------- */
function cartao(p){
  const badges = p.tipos.map(t=>`<span class="badge" style="background:${TIPOS[t].cor}">${TIPOS[t].letra}</span>`).join('');
  const tags = p.tipos.map(t=>`<span class="tag" style="background:${TIPOS[t].cor}">${icone(t)}${TIPOS[t].nome}</span>`).join('');
  const foto = p.img ? `<img src="${p.img}" alt="${p.nome}" loading="lazy" decoding="async">` : '';
  return `<article class="card" data-id="${p.id}" tabindex="0" title="Ver detalhes de ${p.nome}">
    <div class="bar"><span>N°.${pad(p.id)}</span><span class="badges">${badges}</span></div>
    <h3>${p.nome}</h3>
    <div class="photo" data-foto="${p.id}">${foto}</div>
    <div class="tags">${tags}</div>
    <button class="pokebola ${capturados.has(p.id)?'capturado':''}" data-cap="${p.id}" aria-pressed="${capturados.has(p.id)}" title="${capturados.has(p.id)?'Capturado':'Marcar como capturado'}">${POKEBOLA}</button>
  </article>`;
}

function render(){
  let lista = pokemons.filter(p=>
    (estado.regiao==='Todas' || p.regiao===estado.regiao) &&
    (!estado.tipo || p.tipos.includes(estado.tipo)) &&
    (!estado.busca || p.nome.toLowerCase().includes(estado.busca) || String(p.id).includes(estado.busca.replace(/\D/g,'')||'§')));
  lista.sort((a,b)=> estado.ordem==='nome' ? a.nome.localeCompare(b.nome) : estado.ordem==='desc' ? b.id-a.id : a.id-b.id);
  const ocupado = Object.keys(carregando).length > 0;
  $('#grid').innerHTML = lista.length ? lista.map(cartao).join('')
    : ocupado ? '<div class="vazio">Carregando Pokémon…</div>'
    : erroCarga ? '<div class="vazio">Não foi possível carregar os dados da PokéAPI.<br><button id="tentar">Tentar novamente</button></div>'
    : '<div class="vazio">Nenhum Pokémon encontrado. Ajuste os filtros.</div>';
  $('#grid').classList.toggle('list', estado.lista);
  $('#eyebrow').textContent = `Arquivo nacional // ${estado.regiao==='Todas' ? 'Todas as regiões' : estado.regiao}`;
  montarFiltros();
}

/* ---------- Eventos ---------- */
$('#regioes').addEventListener('click',e=>{const b=e.target.closest('[data-r]'); if(b){estado.regiao=b.dataset.r; render(); carregar(estado.regiao);}});
$('#tipos').addEventListener('click',e=>{const b=e.target.closest('[data-t]'); if(b){estado.tipo = estado.tipo===b.dataset.t ? null : b.dataset.t; render();}});
$('#busca').addEventListener('input',e=>{estado.busca=e.target.value.trim().toLowerCase(); render();});
$('#ordem').addEventListener('change',e=>{estado.ordem=e.target.value; render();});
$('#visao').addEventListener('click',()=>{estado.lista=!estado.lista; render();});

/* ---------- PokéAPI ----------
   Busca nome, número, tipos e imagem de cada Pokémon e adapta ao formato do app.
   Os dados ficam em cache no navegador (localStorage) para não repetir requisições. */
const API = 'https://pokeapi.co/api/v2/pokemon/';
const carregados = new Set();   // números já carregados
const carregando = {};          // regiões em carregamento
let erroCarga = null;

const lerCache = id => { try { return JSON.parse(localStorage.getItem('kyoudex:'+id)); } catch { return null; } };
const gravarCache = p => { try { localStorage.setItem('kyoudex:'+p.id, JSON.stringify(p)); } catch {} };

async function buscarPokemon(id){
  const cache = lerCache(id); if(cache) return cache;
  const r = await fetch(API+id);
  if(!r.ok) throw new Error('HTTP '+r.status);
  const d = await r.json();
  const p = {
    id: d.id,
    nome: formatarNome(d.name),
    regiao: regiaoDoId(d.id),
    tipos: [...d.types].sort((a,b)=>a.slot-b.slot).map(t=>TIPOS_API[t.type.name]).filter(Boolean),
    img: d.sprites.other?.['official-artwork']?.front_default || d.sprites.front_default
  };
  gravarCache(p);
  return p;
}

function carregarFaixa(regiao){
  if(carregando[regiao]) return carregando[regiao];
  const [ini,fim] = FAIXAS[regiao];
  const ids = [];
  for(let i=ini;i<=fim;i++) if(!carregados.has(i)) ids.push(i);
  carregando[regiao] = (async () => {
    for(let i=0;i<ids.length;i+=10){            // lotes de 10 requisições
      const lote = await Promise.all(ids.slice(i,i+10).map(buscarPokemon));
      lote.forEach(p => { carregados.add(p.id); pokemons.push(p); });
      render();                                  // mostra os cartões conforme chegam
    }
  })().finally(() => { delete carregando[regiao]; });
  return carregando[regiao];
}

async function carregar(regiao){
  erroCarga = null;
  try {
    for(const r of (regiao==='Todas' ? REGIOES : [regiao])) await carregarFaixa(r);
  } catch(e){ erroCarga = e; console.error('PokéAPI:', e); }
  render();
}

$('#grid').addEventListener('keydown',e=>{ const c = e.target.closest('.card'); if(c && e.target===c && e.key==='Enter') location.href = 'Detalhes.html?id=' + c.dataset.id; });
$('#grid').addEventListener('click',e=>{
  if(e.target.id==='tentar') return carregar(estado.regiao);
  const b = e.target.closest('[data-cap]');
  if(!b){ const c = e.target.closest('.card'); if(c) location.href = 'Detalhes.html?id=' + c.dataset.id; return; }
  const id = Number(b.dataset.cap);
  const agora = !capturados.has(id);
  agora ? capturados.add(id) : capturados.delete(id);
  salvarCapturas();
  b.classList.toggle('capturado', agora);
  if(agora){ b.classList.add('pulo'); setTimeout(()=>b.classList.remove('pulo'), 400); }
  b.setAttribute('aria-pressed', agora);
  b.title = agora ? 'Capturado' : 'Marcar como capturado';
  atualizarContador();
});

atualizarContador();
render();
carregar(estado.regiao);