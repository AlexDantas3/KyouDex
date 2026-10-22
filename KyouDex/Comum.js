/* Dados compartilhados entre as telas (Início e Detalhes) */
const FAIXAS = { // faixa de números da Pokédex nacional por região
  Kanto:[1,151], Johto:[152,251], Hoenn:[252,386], Sinnoh:[387,493], Unova:[494,649],
  Kalos:[650,721], Alola:[722,809], Galar:[810,898], Hissui:[899,905], Paldea:[906,1025]
};
const REGIOES = Object.keys(FAIXAS);
const regiaoDoId = id => REGIOES.find(r => id >= FAIXAS[r][0] && id <= FAIXAS[r][1]);

const TIPOS = {
  inseto:  {nome:'Inseto',   letra:'I',  cor:'#91a119'},
  grama:   {nome:'Grama',    letra:'G',  cor:'var(--grama)'},
  fada:    {nome:'Fada',     letra:'Fa', cor:'#ee6ab8'},
  normal:  {nome:'Normal',   letra:'N',  cor:'#9a9d9a'},
  dragao:  {nome:'Dragão',   letra:'D',  cor:'#5060e1'},
  psiquico:{nome:'Psíquico', letra:'Ps', cor:'#ef4179'},
  fantasma:{nome:'Fantasma', letra:'Fs', cor:'#704170'},
  terra:   {nome:'Terra',    letra:'T',  cor:'#915121'},
  aco:     {nome:'Aço',      letra:'Ac', cor:'#5f9db5'},
  fogo:    {nome:'Fogo',     letra:'F',  cor:'var(--fogo)'},
  voador:  {nome:'Voador',   letra:'Vo', cor:'#6fa8e8'},
  gelo:    {nome:'Gelo',     letra:'Ge', cor:'#3bc4e8'},
  eletrico:{nome:'Elétrico', letra:'E',  cor:'var(--eletrico)'},
  pedra:   {nome:'Pedra',    letra:'Pe', cor:'#a8a070'},
  sombrio: {nome:'Sombrio',  letra:'S',  cor:'#50413f'},
  agua:    {nome:'Água',     letra:'A',  cor:'var(--agua)'},
  lutador: {nome:'Lutador',  letra:'L',  cor:'#c2452d'},
  veneno:  {nome:'Venenoso', letra:'V',  cor:'var(--veneno)'}
};

/* Ícone de cada tipagem: arquivos <tipo>.png.
   PASTA_ICONES = '' -> mesma pasta do HTML. Se mover os PNGs para uma subpasta, use ex.: 'icons/' */
const PASTA_ICONES = '';
const icone = k => `<img class="ico" src="${PASTA_ICONES}${k}.png" alt="" width="12" height="12">`;

const TIPOS_API = { // nome do tipo na API (inglês) -> chave usada no app
  bug:'inseto', grass:'grama', fairy:'fada', normal:'normal', dragon:'dragao', psychic:'psiquico',
  ghost:'fantasma', ground:'terra', steel:'aco', fire:'fogo', flying:'voador', ice:'gelo',
  electric:'eletrico', rock:'pedra', dark:'sombrio', water:'agua', fighting:'lutador', poison:'veneno'
};

const formatarNome = n => n.split('-').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ');

/* Capturas: mesma chave e mesmo ícone nas duas telas */
/* Perfis (contas locais): cada usuário tem suas próprias capturas e favoritos.
   Sem login ("Visitante") usa as chaves antigas. Entrar ou sair recarrega a página. */
const SESSAO = (() => { try { return localStorage.getItem('kyoudex:sessao'); } catch { return null; } })();
const chaveUsuario = (base, sessao = SESSAO) => sessao ? `kyoudex:u:${encodeURIComponent(sessao)}:${base}` : `kyoudex:${base}`;
const CHAVE_CAPTURAS = chaveUsuario('capturados');
const POKEBOLA = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="base" cx="12" cy="12" r="10.5"/><path class="topo" d="M1.5 12a10.5 10.5 0 0 1 21 0z"/><path class="linha" d="M1.5 12h21"/><circle class="botao" cx="12" cy="12" r="3.3"/></svg>`;

/* Favoritos: mesma chave e mesmo ícone nas duas telas */
const CHAVE_FAVORITOS = chaveUsuario('favoritos');
const CORACAO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z" stroke-linejoin="round"/></svg>`;

/* ---------- Animações dos botões ---------- */
// Reinicia uma animação de classe (mesmo se o usuário clicar várias vezes rápido)
function animar(el, classe, ms){
  el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe);
  clearTimeout(el._anim); el._anim = setTimeout(() => el.classList.remove(classe), ms);
}
// Coração: cresce e solta pequenas faíscas para cima, como o botão de curtir do YouTube
function animarFavorito(btn){
  if(document.documentElement.dataset.animacoes === 'off') return;
  btn.querySelector('.burst')?.remove();
  const b = document.createElement('span');
  b.className = 'burst'; b.setAttribute('aria-hidden', 'true');
  b.innerHTML = [-80, -53, -27, 0, 27, 53, 80].map(a => `<i style="--r:${a}deg"></i>`).join('');
  btn.appendChild(b);
  animar(btn, 'pop', 650);
  setTimeout(() => b.remove(), 650);
}

/* ---------- Configurações: menu lateral com tema e cor da Pokédex ----------
   Tema (claro/escuro) e cor ficam salvos no navegador; o <head> das páginas aplica os
   valores antes de desenhar a tela, para não piscar. */
(() => {
  const raiz = document.documentElement;
  const PADRAO = '#e3243f';
  const CORES = [
    ['Vermelho (padrão)', PADRAO], ['Laranja', '#e8590c'], ['Azul', '#2f6fdd'],
    ['Verde', '#1f9d55'], ['Roxo', '#7c3aed'], ['Rosa', '#d6336c']
  ];
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  function hexParaHsl(hex){
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    let h = 0, s = 0;
    if(d){
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return [h, s * 100, l * 100];
  }
  function hslParaHex(h, s, l){
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const lum = hex => { // luminância relativa (WCAG)
    const [r, g, b] = [1, 3, 5].map(i => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * r + .7152 * g + .0722 * b;
  };
  // Gera as três variações usadas no site. Cores muito claras são escurecidas até o texto branco ficar legível.
  function paleta(hex){
    const [h, s, l0] = hexParaHsl(hex);
    let l = clamp(l0, 24, 60), a = hslParaHex(h, s, l);
    while(lum(a) > .3 && l > 24){ l -= 2; a = hslParaHex(h, s, l); }
    return {a, b: hslParaHex(h, s, l * .68), c: hslParaHex(h, s, Math.min(l + 9, 62))};
  }

  function aplicarCor(hex){
    hex = hex.toLowerCase();
    if(hex === PADRAO){
      ['--red', '--red-dark', '--red-soft'].forEach(v => raiz.style.removeProperty(v));
      try { localStorage.removeItem('kyoudex:cor'); localStorage.removeItem('kyoudex:cor-vars'); } catch {}
    } else {
      const p = paleta(hex);
      raiz.style.setProperty('--red', p.a); raiz.style.setProperty('--red-dark', p.b); raiz.style.setProperty('--red-soft', p.c);
      try { localStorage.setItem('kyoudex:cor', hex); localStorage.setItem('kyoudex:cor-vars', JSON.stringify(p)); } catch {}
    }
  }
  const corSalva = () => { try { return localStorage.getItem('kyoudex:cor') || PADRAO; } catch { return PADRAO; } };
  function aplicarTema(t){
    raiz.dataset.tema = t;
    try { localStorage.setItem('kyoudex:tema', t); } catch {}
  }

  const botao = document.getElementById('config');
  if(!botao) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="cfg-fundo" id="cfgFundo"></div>
    <aside class="cfg" id="cfg" role="dialog" aria-modal="true" aria-labelledby="cfgTitulo">
      <div class="cfg-topo"><h2 id="cfgTitulo">Configurações</h2><button type="button" class="cfg-fechar" id="cfgFechar" aria-label="Fechar configurações">×</button></div>
      <section>
        <h3>Tema</h3>
        <div class="cfg-opcoes" role="radiogroup" aria-label="Tema">
          <button type="button" role="radio" data-tema="light">Claro</button>
          <button type="button" role="radio" data-tema="dark">Escuro</button>
        </div>
      </section>
      <section>
        <h3>Animações</h3>
        <div class="cfg-opcoes" role="radiogroup" aria-label="Animações">
          <button type="button" role="radio" data-anim="on">Ligadas</button>
          <button type="button" role="radio" data-anim="off">Desligadas</button>
        </div>
        <p class="cfg-nota">Por padrão, segue a configuração de movimento do seu sistema. Se as animações do sistema estiverem desativadas, elas começam desligadas aqui.</p>
      </section>
      <section>
        <h3>Cor da sua Pokédex</h3>
        <div class="cfg-cores" id="cfgCores">${CORES.map(([n, c]) => `<button type="button" data-cor="${c}" style="background:${c}" aria-label="${n}" title="${n}"></button>`).join('')}</div>
        <label class="cfg-picker"><input type="color" id="cfgCor" aria-label="Escolher outra cor"><span id="cfgHex"></span></label>
        <p class="cfg-nota">Escolha qualquer cor para substituir o vermelho. Tons muito claros ou escuros são ajustados para manter o texto legível.</p>
        <button type="button" class="cfg-reset" id="cfgReset">Restaurar cor padrão</button>
      </section>
    </aside>`);

  const $ = s => document.querySelector(s);
  const painel = $('#cfg'), fundo = $('#cfgFundo');

  function atualizarUI(){
    document.querySelectorAll('.cfg-opcoes [data-tema]').forEach(b => b.setAttribute('aria-checked', b.dataset.tema === raiz.dataset.tema));
    document.querySelectorAll('.cfg-opcoes [data-anim]').forEach(b => b.setAttribute('aria-checked', b.dataset.anim === (raiz.dataset.animacoes || 'on')));
    const cor = corSalva();
    $('#cfgCor').value = cor; $('#cfgHex').textContent = cor.toUpperCase();
    document.querySelectorAll('#cfgCores [data-cor]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cor === cor));
  }
  function abrir(){
    atualizarUI();
    painel.classList.add('aberto'); fundo.classList.add('aberto');
    botao.setAttribute('aria-expanded', 'true');
    $('#cfgFechar').focus();
  }
  function fechar(){
    painel.classList.remove('aberto'); fundo.classList.remove('aberto');
    botao.setAttribute('aria-expanded', 'false');
    botao.focus();
  }

  botao.addEventListener('click', () => painel.classList.contains('aberto') ? fechar() : abrir());
  $('#cfgFechar').addEventListener('click', fechar);
  fundo.addEventListener('click', fechar);
  document.addEventListener('keydown', e => {
    if(!painel.classList.contains('aberto')) return;
    if(e.key === 'Escape'){ fechar(); return; }
    if(e.key === 'Tab'){ // mantém o foco dentro do menu
      const itens = [...painel.querySelectorAll('button, input')];
      const p = itens[0], u = itens[itens.length - 1];
      if(e.shiftKey && document.activeElement === p){ e.preventDefault(); u.focus(); }
      else if(!e.shiftKey && document.activeElement === u){ e.preventDefault(); p.focus(); }
    }
  });

  painel.addEventListener('click', e => {
    const t = e.target.closest('button[data-tema]'); // 'button': o <html> também tem data-tema
    if(t){ aplicarTema(t.dataset.tema); atualizarUI(); return; }
    const a = e.target.closest('button[data-anim]');
    if(a){
      raiz.dataset.animacoes = a.dataset.anim;
      try { localStorage.setItem('kyoudex:animacoes', a.dataset.anim); } catch {}
      atualizarUI();
    }
  });
  $('#cfgCores').addEventListener('click', e => {
    const b = e.target.closest('[data-cor]'); if(!b) return;
    aplicarCor(b.dataset.cor); atualizarUI();
  });
  $('#cfgCor').addEventListener('input', e => { aplicarCor(e.target.value); $('#cfgHex').textContent = e.target.value.toUpperCase();
    document.querySelectorAll('#cfgCores [data-cor]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cor === e.target.value)); });
  $('#cfgReset').addEventListener('click', () => { aplicarCor(PADRAO); atualizarUI(); });
})();

/* ---------- Conta: entrar / sair (botão de energia no rodapé) ---------- */
(() => {
  const btn = document.getElementById('conta'); if(!btn) return;
  const $ = s => document.querySelector(s);
  const ler = () => { try { return JSON.parse(localStorage.getItem('kyoudex:usuarios')) || {}; } catch { return {}; } };
  const usuarios = ler();
  const atual = SESSAO && usuarios[SESSAO] ? usuarios[SESSAO] : null;

  async function hash(txt){
    txt = 'kyoudex:' + txt;
    if(window.crypto?.subtle){
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for(const ch of txt) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; // alternativa simples
    return 'x' + h;
  }

  $('#usuarioNome').textContent = atual ? 'Treinador: ' + atual.nome : 'Visitante';
  btn.classList.toggle('on', !!atual);
  btn.title = atual ? 'Conta de ' + atual.nome + ' — clique para sair' : 'Entrar';

  const nomes = Object.values(usuarios).map(u => u.nome);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="mod-fundo" id="modFundo"></div>
    <div class="mod" id="mod" role="dialog" aria-modal="true" aria-labelledby="modTitulo">
      ${atual ? `
        <h2 id="modTitulo">Sua conta</h2>
        <p class="mod-txt">Você está logado como <b></b>. As capturas e os favoritos ficam salvos neste perfil.</p>
        <div class="mod-acoes"><button type="button" class="mod-sec" id="modFechar">Fechar</button><button type="button" class="mod-pri" id="modSair">Sair</button></div>
      ` : `
        <h2 id="modTitulo">Entrar</h2>
        <form id="modForm" autocomplete="off">
          ${nomes.length ? `<div class="mod-perfis" id="modPerfis" aria-label="Perfis neste aparelho">${nomes.map(n => `<button type="button" data-n="${n.replace(/"/g, '&quot;')}"></button>`).join('')}</div>` : ''}
          <label>Nome<input id="uNome" type="text" maxlength="20" required></label>
          <label>Senha<input id="uSenha" type="password" minlength="4" required></label>
          <p class="mod-erro" id="uErro" role="alert"></p>
          <p class="mod-dica">Se o nome ainda não existir, um novo perfil será criado com essa senha. Os perfis ficam salvos só neste navegador.</p>
          <div class="mod-acoes"><button type="button" class="mod-sec" id="modFechar">Cancelar</button><button type="submit" class="mod-pri">Entrar / criar</button></div>
        </form>
      `}
    </div>`);
  const fundo = $('#modFundo'), mod = $('#mod');
  if(atual) mod.querySelector('b').textContent = atual.nome;
  mod.querySelectorAll('#modPerfis button').forEach(b => b.textContent = b.dataset.n);

  const abrir = () => { fundo.classList.add('aberto'); mod.classList.add('aberto'); ($('#uNome') || $('#modSair')).focus(); };
  const fechar = () => { fundo.classList.remove('aberto'); mod.classList.remove('aberto'); btn.focus(); };
  btn.addEventListener('click', abrir);
  fundo.addEventListener('click', fechar);
  $('#modFechar').addEventListener('click', fechar);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && mod.classList.contains('aberto')) fechar(); });

  $('#modSair')?.addEventListener('click', () => {
    try { localStorage.removeItem('kyoudex:sessao'); } catch {}
    location.reload();
  });
  $('#modPerfis')?.addEventListener('click', e => {
    const b = e.target.closest('[data-n]'); if(!b) return;
    $('#uNome').value = b.dataset.n; $('#uSenha').focus();
  });
  $('#modForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const erro = t => { $('#uErro').textContent = t; };
    const nome = $('#uNome').value.trim().replace(/\s+/g, ' '), senha = $('#uSenha').value;
    if(nome.length < 2) return erro('Use um nome com pelo menos 2 letras.');
    if(senha.length < 4) return erro('A senha precisa ter pelo menos 4 caracteres.');
    const chave = nome.toLowerCase(), us = ler(), h = await hash(chave + ':' + senha);
    if(us[chave]){
      if(us[chave].hash !== h) return erro('Senha incorreta para este perfil.');
    } else {
      try {
        if(!Object.keys(us).length){ // primeiro perfil: aproveita o progresso feito como visitante
          ['capturados', 'favoritos'].forEach(b => {
            const antigo = localStorage.getItem(chaveUsuario(b, null));
            if(antigo && !localStorage.getItem(chaveUsuario(b, chave))) localStorage.setItem(chaveUsuario(b, chave), antigo);
          });
        }
        us[chave] = {nome, hash: h};
        localStorage.setItem('kyoudex:usuarios', JSON.stringify(us));
      } catch { return erro('Não foi possível salvar o perfil neste navegador.'); }
    }
    try { localStorage.setItem('kyoudex:sessao', chave); } catch { return erro('Não foi possível iniciar a sessão.'); }
    location.reload();
  });
})();