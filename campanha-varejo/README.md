# Placar Campanha Varejo

Projeto separado em arquivos, do jeito que um editor de código (VS Code, etc.)
espera — sem tudo amontoado num HTML só.

## Estrutura

```
placar-campanha-varejo/
├── index.html      → estrutura da página (HTML puro)
├── style.css        → todo o CSS (tema, cores, layout, responsivo)
├── script.js         → toda a lógica (JavaScript puro, sem framework)
└── data.json          → os dados dos 29 vendedores + 3 supervisores
```

## Como rodar localmente

`script.js` carrega `data.json` via `fetch()`, e por segurança do navegador
isso **não funciona** abrindo o `index.html` direto (`file://`) — precisa de
um servidor local. Duas formas fáceis:

**Opção A — VS Code:**
Instale a extensão **"Live Server"**, clique com o botão direito em
`index.html` → **"Open with Live Server"**.

**Opção B — Terminal (Python já vem em qualquer máquina com Python instalado):**
```bash
cd placar-campanha-varejo
python3 -m http.server 8000
```
Depois abra `http://localhost:8000` no navegador.

## Onde editar cada coisa

- **Mudar cores/layout/fontes** → `style.css` (variáveis CSS no topo, em `:root`)
- **Mudar textos, adicionar seção, mudar comportamento** → `script.js`
- **Atualizar os números da campanha** (nova rodada de relatórios) → `data.json`,
  mantendo a mesma estrutura de objeto por vendedor:
  ```json
  {
    "setor": 245,
    "nome": "Jorge dos Santos",
    "isSupervisor": false,
    "equipe": "Washignton",
    "metaCarteira": 107,
    "industrias": {
      "PANASONIC": { "metaAtual": 59, "metaNova": 77, "faturado": 16, "naoFaturado": 22, "projetado": 36, "valorFaturado": 12345.6, "valorAFaturar": 7890.1, "pct": 47 },
      "INGLEZA": { ... },
      "AB MAURI": { ... }
    },
    "totalGeral": { "totalPositivado": 100, "totalValorFaturado": 0, "totalValorAFaturar": 0, "totalValorGeral": 0 },
    "representatividade": { "PANASONIC": 4.47, "INGLEZA": 3.81, "AB MAURI": 3.35 }
  }
  ```
- **Estrutura das 5 seções** (Placar / Buscar / Ranking / Financeiro /
  Relatórios) → blocos `<div class="section" id="sec-...">` em `index.html`

## Sem build step

Não tem `npm install`, `webpack`, `vite`, nada disso. É HTML/CSS/JS puro,
funciona em qualquer navegador moderno. A única dependência externa é a
fonte do Google Fonts (Oswald + Inter), carregada via `<link>` no
`index.html` — se precisar rodar 100% offline, baixe as fontes e troque
esse link por arquivos locais.

## Publicar depois de editar

Depois de editar, se quiser voltar a ter tudo num arquivo único (por
exemplo, para publicar como artifact no Claude ou subir num serviço que só
aceita 1 arquivo), é só pedir para o Claude "juntar de novo num HTML só".
