/* Tela de detalhes — lê ?id=<número ou nome> da URL e busca os dados na PokéAPI.
   Depende do Comum.js (TIPOS, TIPOS_API, FAIXAS, regiaoDoId, icone, formatarNome). */
const $ = s => document.querySelector(s);
const API = 'https://pokeapi.co/api/v2/';
const ROTULOS = {hp:'HP', attack:'Ataque', defense:'Defesa', 'special-attack':'Sp. Atq', 'special-defense':'Sp. Def', speed:'Veloc.'};
const pad = (n, l = 3) => String(n).padStart(l, '0');
const dec = n => n.toFixed(1).replace('.', ',');
const TOTAL = 1025;

let atual = null, audio = null, shiny = false;

async function json(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

const limpar = t => (t || '').replace(/[\n\f\u00ad]/g, ' ').replace(/\s+/g, ' ').trim();
function salvar(p){
  try {
    const s = JSON.stringify(p);
    localStorage.setItem('kyoudex:det:' + p.id, s);
    localStorage.setItem('kyoudex:det:' + p.nome.toLowerCase().replace(/ /g, '-'), s);
  } catch {}
}

/* ---------- Tradução (inglês -> português) ----------
   A PokéAPI quase não tem textos em português. Usa o português da API quando existe e,
   senão, traduz automaticamente pelo serviço gratuito MyMemory. O resultado fica em cache. */
async function traduzirTexto(txt){
  const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(txt) + '&langpair=en|pt-BR');
  const d = await r.json();
  if(Number(d.responseStatus) !== 200 || !d.responseData?.translatedText) throw new Error('tradução indisponível');
  return new DOMParser().parseFromString(d.responseData.translatedText, 'text/html').documentElement.textContent.trim();
}
async function traduzir(p){
  const [t, g] = await Promise.allSettled([
    p.texto && !p.textoPt ? traduzirTexto(p.texto) : Promise.reject(),
    p.genus && !p.genusPt ? traduzirTexto(p.genus.replace(/\s*Pokémon$/i, '')) : Promise.reject()
  ]);
  if(t.status === 'fulfilled') p.textoPt = t.value; else console.warn('Tradução do texto falhou');
  if(g.status === 'fulfilled') p.genusPt = 'Pokémon ' + g.value.charAt(0).toUpperCase() + g.value.slice(1);
  if(p.textoPt || p.genusPt) salvar(p);
  if(atual === p) mostrarTextos(p);
}
function mostrarTextos(p){
  $('#genus').textContent = p.genusPt || p.genus || ' ';
  $('#descricao').textContent = p.textoPt || p.texto || 'Sem descrição disponível.';
}

/* ---------- Dados ---------- */
async function buscar(q){
  q = String(q).toLowerCase();
  const chave = 'kyoudex:det:' + q;
  try { const c = JSON.parse(localStorage.getItem(chave)); if(c) return c; } catch {}

  const d = await json(API + 'pokemon/' + encodeURIComponent(q));
  const e = await json(d.species.url);
  const art = d.sprites.other?.['official-artwork'] || {};
  const en = lista => lista.find(x => x.language.name === 'en');
  const pt = lista => lista.find(x => ['pt-BR', 'pt'].includes(x.language.name));
  const p = {
    id: d.id,
    nome: formatarNome(d.name),
    tipos: [...d.types].sort((a, b) => a.slot - b.slot).map(t => TIPOS_API[t.type.name]).filter(Boolean),
    altura: d.height / 10,
    peso: d.weight / 10,
    genero: e.gender_rate === -1 ? 'Sem gênero' : e.gender_rate === 0 ? 'M' : e.gender_rate === 8 ? 'F' : 'M / F',
    genus: en(e.genera)?.genus || '',
    texto: limpar(en(e.flavor_text_entries)?.flavor_text),
    textoPt: limpar(pt(e.flavor_text_entries)?.flavor_text) || null,
    genusPt: pt(e.genera)?.genus || null,
    stats: d.stats.map(s => ({n: ROTULOS[s.stat.name] || s.stat.name, v: s.base_stat})),
    img: art.front_default || d.sprites.front_default,
    imgShiny: art.front_shiny || d.sprites.front_shiny,
    som: d.cries?.latest || d.cries?.legacy || null
  };
  try { localStorage.setItem(chave, JSON.stringify(p)); } catch {}
  salvar(p);
  return p;
}

/* ---------- Tela ---------- */
function aplicar(p){
  atual = p; shiny = false; pararAudio();
  document.title = 'KyouDex — ' + p.nome;
  document.documentElement.style.setProperty('--cor', TIPOS[p.tipos[0]]?.cor || 'var(--grama)');

  const reg = regiaoDoId(p.id);
  const [ini, fim] = reg ? FAIXAS[reg] : [0, 0];
  $('#num').textContent = 'N° ' + pad(p.id);
  $('#trilha').textContent = 'Dex / Pokémon / ' + (reg || '—');
  $('#regNome').textContent = reg || '—';
  $('#regFaixa').textContent = reg ? `${pad(ini)}–${pad(fim)}` : '—';
  $('#pos').textContent = reg ? `${pad(p.id - ini + 1)}/${pad(fim - ini + 1)}` : '—';

  const foto = $('#foto'); foto.src = p.img || ''; foto.alt = p.nome;
  $('#centro').classList.remove('carregando');
  $('#nome').textContent = p.nome;
  $('#tags').innerHTML = p.tipos.map(t => `<span class="tag" style="background:${TIPOS[t].cor}">${icone(t)}${TIPOS[t].nome}</span>`).join('');
  $('#altura').textContent = dec(p.altura) + ' m';
  $('#peso').textContent = dec(p.peso) + ' kg';
  $('#genero').textContent = p.genero;

  const total = p.stats.reduce((s, x) => s + x.v, 0);
  $('#total').textContent = total + ' pts';
  $('#barras').innerHTML = p.stats.map(s =>
    `<div class="stat"><span>${s.n}</span><div class="trilho"><i style="width:${Math.min(100, s.v / 180 * 100)}%"></i></div><b>${s.v}</b></div>`).join('');

  $('#protoTitulo').textContent = 'Protocolo #' + pad(p.id);
  mostrarTextos(p);
  if(p.texto && !p.textoPt){ $('#descricao').textContent = 'Traduzindo…'; traduzir(p); }
  else if(p.genus && !p.genusPt) traduzir(p);
  $('#protoRodape').textContent = p.tipos.map(t => TIPOS[t].nome).join(' / ') + (reg ? ' • ' + reg : '');

  $('#shinyTxt').textContent = 'Shiny';
  $('#shiny').setAttribute('aria-pressed', 'false');
  $('#shiny').disabled = !p.imgShiny;
  $('#statusAudio').textContent = p.som ? 'Aguardando' : 'Áudio indisponível';

  mostrarCaptura(capturas().has(p.id));
  const fav = favoritos();
  $('#fav').setAttribute('aria-pressed', fav.has(p.id));
}

/* ---------- Som ---------- */
function pararAudio(){
  if(audio){ audio.pause(); audio = null; }
  $('#onda').classList.remove('tocando');
}
function tocar(){
  if(!atual?.som){ $('#statusAudio').textContent = 'Áudio indisponível'; return; }
  pararAudio();
  audio = new Audio(atual.som);
  audio.volume = .5;
  audio.onended = () => { $('#onda').classList.remove('tocando'); $('#statusAudio').textContent = 'Concluído'; };
  audio.play().then(() => {
    $('#onda').classList.add('tocando');
    $('#statusAudio').textContent = 'Reproduzindo…';
  }).catch(() => { $('#statusAudio').textContent = 'Áudio indisponível'; });
}

/* ---------- Shiny ---------- */
function alternarShiny(){
  if(!atual?.imgShiny) return;
  shiny = !shiny;
  $('#foto').src = shiny ? atual.imgShiny : atual.img;
  $('#shiny').setAttribute('aria-pressed', shiny);
  $('#shinyTxt').textContent = shiny ? 'Normal' : 'Shiny';
}

/* ---------- Captura (mesmas capturas da tela Início) ---------- */
const capturas = () => { try { return new Set(JSON.parse(localStorage.getItem(CHAVE_CAPTURAS)) || []); } catch { return new Set(); } };
function mostrarCaptura(on){
  const b = $('#cap');
  b.classList.toggle('capturado', on);
  b.setAttribute('aria-pressed', on);
  b.title = on ? 'Capturado' : 'Marcar como capturado';
}
function alternarCaptura(){
  if(!atual) return;
  const c = capturas(), agora = !c.has(atual.id);
  agora ? c.add(atual.id) : c.delete(atual.id);
  try { localStorage.setItem(CHAVE_CAPTURAS, JSON.stringify([...c])); } catch {}
  mostrarCaptura(agora);
  if(agora){ $('#cap').classList.add('pulo'); setTimeout(() => $('#cap').classList.remove('pulo'), 400); }
}
$('#cap').innerHTML = POKEBOLA;
$('#cap').onclick = alternarCaptura;

/* ---------- Favoritos e compartilhar ---------- */
const favoritos = () => { try { return new Set(JSON.parse(localStorage.getItem('kyoudex:favoritos')) || []); } catch { return new Set(); } };
function alternarFavorito(){
  if(!atual) return;
  const f = favoritos();
  f.has(atual.id) ? f.delete(atual.id) : f.add(atual.id);
  try { localStorage.setItem('kyoudex:favoritos', JSON.stringify([...f])); } catch {}
  $('#fav').setAttribute('aria-pressed', f.has(atual.id));
}
async function compartilhar(){
  const t = $('#trilha'), antes = t.textContent;
  try { await navigator.clipboard.writeText(location.href); t.textContent = 'Link copiado'; }
  catch { t.textContent = 'Não foi possível copiar'; }
  setTimeout(() => t.textContent = antes, 1500);
}

/* ---------- Navegação ---------- */
const ir = id => { location.href = 'Detalhes.html?id=' + id; };
const mover = passo => { if(atual) ir(((atual.id - 1 + passo) % TOTAL + TOTAL) % TOTAL + 1); };

$('#prev').onclick = $('#left').onclick = () => mover(-1);
$('#next').onclick = $('#right').onclick = () => mover(1);
$('#up').onclick = () => mover(10);
$('#down').onclick = () => mover(-10);
$('#som').onclick = tocar;
$('#shiny').onclick = alternarShiny;
$('#fav').onclick = alternarFavorito;
$('#share').onclick = compartilhar;
$('#scan').onclick = () => {
  const reg = atual && regiaoDoId(atual.id);
  const [a, b] = reg ? FAIXAS[reg] : [1, TOTAL];
  ir(a + Math.floor(Math.random() * (b - a + 1)));
};
document.addEventListener('keydown', e => {
  if(e.target.matches('input')) return;
  if(e.key === 'ArrowLeft') mover(-1);
  if(e.key === 'ArrowRight') mover(1);
});

$('#formBusca').addEventListener('submit', async e => {
  e.preventDefault();
  const q = $('#q').value.trim().toLowerCase();
  if(!q) return;
  $('#erroBusca').hidden = true;
  try { const p = await buscar(q); ir(p.id); }
  catch { $('#erroBusca').hidden = false; }
});

/* ---------- Onda sonora (decorativa) ---------- */
$('#barrasOnda').innerHTML = Array.from({length: 17}, (_, i) =>
  `<i style="--h:${8 + Math.round(Math.abs(Math.sin(i * 1.3)) * 40)}px;--i:${i}"></i>`).join('');

/* ---------- Início ---------- */
(async () => {
  const q = new URLSearchParams(location.search).get('id') || '1';
  $('#centro').classList.add('carregando');
  try { aplicar(await buscar(q)); }
  catch(e){
    console.error('PokéAPI:', e);
    $('#nome').textContent = 'Pokémon não encontrado';
    $('#genus').textContent = 'Verifique o número ou a conexão e tente de novo.';
  }
})();