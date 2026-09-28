<p align="center">
  <img width="1184" height="224" alt="logo-kyoudex" src="https://github.com/user-attachments/assets/1d041559-47db-4e41-ab9a-6385c7d29e4f" />

</p>

<p align="center">
  Uma Pokédex interativa feita com HTML, CSS e JavaScript puros, alimentada pela <a href="https://pokeapi.co/">PokéAPI</a>.
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black">
  <img alt="PokéAPI" src="https://img.shields.io/badge/API-Pok%C3%A9API-EF5350">
</p>

---

## Sobre o projeto

O **KyouDex** é uma Pokédex web em duas telas: uma **lista** com todos os Pokémon, filtros e captura, e uma tela de **detalhes** com status base, tipagem, som, versão shiny e mais. Não usa frameworks nem etapa de build: basta abrir os arquivos no navegador.

> Screenshots:
> <img width="1297" height="688" alt="tela-inicial" src="https://github.com/user-attachments/assets/3e4dc718-cabc-411f-a678-c2842d4c2ad6" />

> <img width="1295" height="688" alt="tela-detalhes" src="https://github.com/user-attachments/assets/d541b8b1-0f5e-4ceb-9828-95e0222ca8bd" />



## Funcionalidades

### Tela inicial (`KyouDex.html`)

- **Lista de Pokémon** em cartões com número da Pokédex, nome, imagem oficial e tipagens, carregados da PokéAPI.
- **Filtro por região**: Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Hissui e Paldea, numa lista com rolagem sem barra visível.
- **Filtro por tipagem** com as 18 tipagens, cada uma com ícone e cor próprios.
- **Busca** por nome ou número.
- **Ordenação** por número (crescente ou decrescente) ou por nome (A–Z).
- **Alternância de visualização** entre grade e lista.
- **Captura**: cada cartão tem uma Pokébola que fica cinza (não capturado) ou colorida (capturado). O contador **Capturados** soma os Pokémon marcados.

### Tela de detalhes (`Detalhes.html`)

- Imagem em destaque, número, posição na região e tipagens com ícone.
- **Status base** (HP, Ataque, Defesa, Sp. Atq, Sp. Def e Velocidade) em barras, com o total.
- **Altura, peso e gênero**.
- **Som**: reproduz o grito do Pokémon.
- **Shiny**: alterna a imagem central entre a versão normal e a shiny.
- **Protocolo**: descrição da Pokédex e categoria em português (traduzidas automaticamente quando a API não fornece o texto).
- **Captura** com a mesma Pokébola da lista, sincronizada entre as duas telas.
- **Favoritar** e **copiar o link** do Pokémon.
- **Navegação**: botões anterior e próximo, cruz direcional (±1 e ±10), teclas ← → do teclado, busca rápida por nome ou número e **Scan** (Pokémon aleatório da região).

### Geral

- Cabeçalho, rodapé e identidade visual compartilhados pelas duas telas.
- **Cache local** dos dados no navegador para evitar requisições repetidas.
- Layout responsivo e navegação por teclado nos elementos interativos.

## Tecnologias

| Camada | Uso |
| --- | --- |
| HTML5 | Estrutura das duas telas |
| CSS3 | Layout com Grid e Flexbox, variáveis CSS e animações |
| JavaScript (ES6+) | Renderização, filtros, integração com a API e estado |
| [PokéAPI](https://pokeapi.co/) | Nome, número, tipos, status, imagens e sons |
| [MyMemory](https://mymemory.translated.net/) | Tradução automática dos textos para português |
| `localStorage` | Cache dos dados, capturas e favoritos |

## Estrutura do projeto

```
KyouDex/
├── KyouDex.html      # Tela inicial (lista)
├── Detalhes.html     # Tela de detalhes
├── Syles.css         # Estilos da tela inicial e partes compartilhadas
├── Detalhes.css      # Estilos da tela de detalhes
├── Comum.js          # Dados compartilhados (tipos, regiões, ícones, capturas)
├── Script.js         # Lógica da tela inicial
├── Detalhes.js       # Lógica da tela de detalhes
├── logo-kyoudex.png  # Logo
└── *.png             # Ícones das 18 tipagens (inseto.png, grama.png, ...)
```

## Como executar

1. Baixe ou clone o repositório e mantenha todos os arquivos **na mesma pasta**.
2. Abra o `KyouDex.html` no navegador.

Para um resultado mais fiel ao de um site publicado, sirva a pasta com um servidor local:

```bash
# com Python
python -m http.server 8000
# depois acesse http://localhost:8000/KyouDex.html
```

Também funciona com a extensão **Live Server** do VS Code. É necessária conexão com a internet, já que os dados e as imagens vêm da PokéAPI.

## Como funciona

- **Carregamento por região**: ao abrir, a página carrega só Kanto. Ao escolher outra região, os Pokémon dela são buscados na hora, em lotes de 10 requisições, e os cartões aparecem conforme chegam. A opção **Todas** carrega as 1025 espécies.
- **Faixas da Pokédex nacional**: a região de cada Pokémon é definida pelo número (por exemplo, Kanto vai de 1 a 151).
- **Tipos**: os nomes de tipos da API (em inglês) são convertidos para as chaves usadas no app (`grass` vira `grama`).
- **Cache**: cada Pokémon consultado é salvo no `localStorage`, então as visitas seguintes são quase instantâneas.
- **Detalhes**: a tela lê o parâmetro da URL (`Detalhes.html?id=25` ou `?id=pikachu`) e busca os dados do Pokémon e da espécie.

## Configuração

Se você mover os ícones de tipagem para uma subpasta, ajuste a constante no `Comum.js`:

```js
const PASTA_ICONES = 'icons/'; // padrão: '' (mesma pasta do HTML)
```

## Limitações conhecidas

- A busca por nome na tela inicial só encontra Pokémon das regiões já carregadas.
- A tradução dos textos é automática e pode ter frases imperfeitas. O serviço gratuito tem limite diário de uso.
- Algumas formas alternativas exibem os nomes técnicos da API (por exemplo, "Deoxys Normal").
- Capturas, favoritos e cache ficam salvos apenas no navegador em uso.

## Próximos passos

- [ ] Traduzir os textos e salvá-los no projeto, sem depender de um serviço externo
- [ ] Filtro por tipagem e busca em todas as regiões, mesmo sem carregá-las
- [ ] Evoluções e movimentos na tela de detalhes
- [ ] Exportar e importar a lista de capturados

## Créditos e aviso legal

- Dados, imagens e sons fornecidos pela [PokéAPI](https://pokeapi.co/).
- Este é um projeto de fãs, sem fins lucrativos. Pokémon e todos os nomes relacionados são marcas registradas de Nintendo, Game Freak e The Pokémon Company. Este projeto não é afiliado a elas.

## Autor

**Alex Dantas** · [GitHub](https://github.com/AlexDantas3)
