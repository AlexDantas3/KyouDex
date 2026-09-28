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
const CHAVE_CAPTURAS = 'kyoudex:capturados';
const POKEBOLA = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="base" cx="12" cy="12" r="10.5"/><path class="topo" d="M1.5 12a10.5 10.5 0 0 1 21 0z"/><path class="linha" d="M1.5 12h21"/><circle class="botao" cx="12" cy="12" r="3.3"/></svg>`;