// ---------------------------------------------------------------------------
// Campanha Ingleza — logica da aplicacao
// Cobre as DUAS mecanicas da mesma reuniao: VRJ/Varejo (positivacao) e AS
// (faturamento), mais um modo "Geral" combinado (visao dos fornecedores).
// Dados ficam em data.json: { periodo, varejo: {...}, as: {...} }
// ---------------------------------------------------------------------------

let DATA = { periodo: "", varejo: null, as: null };
let modoAtivo = "varejo"; // "varejo" | "as" | "geral"

const FAIXA_HEX = { f85: "#F2A93B", f90: "#12B896", f95: "#3B5BA5", f100: "#123A5E", f110: "#E3273B" };

const CAMPANHAS = {
  varejo: {
    chave: "varejo",
    nome: "Varejo",
    tag: "VRJ",
    metricaLabel: "Positivação",
    metricaLabelPlural: "positivações",
    isMoeda: false,
    equipes: ["Washignton", "Rodrigo", "Sueli"],
    teamColor: { Washignton: "#1E7145", Rodrigo: "#B8620A", Sueli: "#A33B3B" },
    faixas: [
      { min: 110, valor: 400, label: "110%", css: "f110" },
      { min: 100, valor: 250, label: "100%", css: "f100" },
      { min: 90,  valor: 150, label: "90%",  css: "f90" },
      { min: 85,  valor: 100, label: "85%",  css: "f85" },
    ],
    gatilhoMin: 85,
    gatilhoSupervisor: 100,
    premioSupervisor: 500,
    regrasTitulo: "Regras — VRJ (Varejo)",
    regras: [
      { ico: "📅", titulo: "Período Oficial:", texto: "Válido estritamente para faturamentos e positivações registradas entre 01/07/2026 e 31/07/2026." },
      { ico: "✓", titulo: "Regra de Elegibilidade:", texto: "A premiação do vendedor VRJ só é liberada se ele atingir 100% da sua meta individual de positivação estabelecida." },
      { ico: "📈", titulo: "Gatilho de Equipe:", texto: "A faixa de premiação individual (R$100, R$150, R$250 ou R$400) é determinada pelo percentual total de positivação alcançado pela empresa toda (meta de 2.416 positivações — VJ + AS)." },
      { ico: "🛡", titulo: "Auditoria e Conformidade:", texto: "Cadastros inconsistentes ou devoluções de mercadoria dentro do mês de apuração anulam a positivação do respectivo cliente." },
      { ico: "✓", titulo: "Gatilho de Positivação (85%):", texto: "Para habilitar a premiação dos vendedores VRJ, a equipe precisa atingir pelo menos 85% do objetivo geral de positivação." },
    ],
    liderancaTexto: "Nossos supervisores VRJ desempenham papel fundamental no direcionamento, acompanhamento, motivação e suporte tático do time de varejo durante esta grande jornada. Para reconhecer esse esforço de coordenação, quando a equipe consolidada atingir <b>100% do volume previsto de positivação</b>:",
    liderancaBox: "🏆 Prêmio de R$ 500,00 para cada um dos 3 Supervisores VRJ!",
    gateLabel: "Atingimento da equipe geral — Varejo",
  },
  as: {
    chave: "as",
    nome: "AS",
    tag: "AS",
    metricaLabel: "Faturamento",
    metricaLabelPlural: "faturamento",
    isMoeda: true,
    equipes: ["Alessandro", "Anderson", "Arildo"],
    teamColor: { Alessandro: "#2C6FA8", Anderson: "#7A4FA3", Arildo: "#8B5E34" },
    faixas: [
      { min: 110, valor: 500, label: "110%", nome: "Ouro",   css: "f110" },
      { min: 100, valor: 400, label: "100%", nome: "Prata",  css: "f100" },
      { min: 95,  valor: 250, label: "95%",  nome: "Bronze", css: "f95" },
    ],
    gatilhoMin: 95,
    gatilhoSupervisor: 100,
    premioSupervisor: 500,
    regrasTitulo: "Regras — AS",
    regras: [
      { ico: "📅", titulo: "Período Oficial:", texto: "Válido estritamente para faturamentos registrados entre 01/07/2026 e 31/07/2026." },
      { ico: "✓", titulo: "Regra de Elegibilidade:", texto: "A premiação do vendedor AS só é liberada se ele atingir 100% da sua meta individual de faturamento estabelecida." },
      { ico: "📈", titulo: "Gatilho de Equipe:", texto: "A faixa de premiação individual (R$250, R$400 ou R$500) é determinada pelo percentual total de faturamento alcançado pela empresa toda (meta de R$ 1.900.000,00 — VJ + AS)." },
      { ico: "✓", titulo: "Gatilho de Venda (95%):", texto: "Para habilitar a premiação dos vendedores AS, a equipe precisa atingir pelo menos 95% do objetivo geral de faturamento da marca." },
      { ico: "🛡", titulo: "Auditoria e Conformidade:", texto: "Devoluções de mercadoria dentro do mês de apuração são descontadas do faturamento apurado; bonificações (brindes/amostras) não entram na conta." },
    ],
    liderancaTexto: "Nossos supervisores AS desempenham papel fundamental no direcionamento, acompanhamento, motivação e suporte tático do time durante esta grande jornada. Para reconhecer esse esforço de coordenação, quando a equipe consolidada atingir <b>100% do faturamento previsto</b>:",
    liderancaBox: "🏆 Prêmio de R$ 500,00 para cada um dos 3 Supervisores AS!",
    gateLabel: "Atingimento da equipe geral — AS",
  },
};

let busca = "";
let equipeFiltro = "Todas";
let secaoAtiva = "placar";

function modo() { return CAMPANHAS[modoAtivo]; }
function dados() { return DATA[modoAtivo]; }
function isGeral() { return modoAtivo === "geral"; }

function pctColor(pct) {
  if (pct >= 100) return "#1E7145";
  if (pct >= 60) return "#B8860B";
  return "#A33B3B";
}
function fmt0(n) { return Math.round(n).toLocaleString("pt-BR"); }
function fmtMoney(n) { return "R$ " + Math.round(n).toLocaleString("pt-BR"); }
function fmtValorCamp(n, camp) { return camp.isMoeda ? fmtMoney(n) : fmt0(n); }
function fmtValor(n) { return fmtValorCamp(n, modo()); }

function faixaAtivaCamp(pctEquipe, camp) {
  return camp.faixas.find(f => pctEquipe >= f.min) || null;
}
function faixaAtiva(pctEquipe) { return faixaAtivaCamp(pctEquipe, modo()); }

function premioPessoaCamp(p, pctEquipe, camp) {
  if (p.isSupervisor) {
    return pctEquipe >= camp.gatilhoSupervisor ? camp.premioSupervisor : 0;
  }
  if (p.pct < 100) return 0;
  const faixa = faixaAtivaCamp(pctEquipe, camp);
  return faixa ? faixa.valor : 0;
}
function premioPessoa(p, pctEquipe) { return premioPessoaCamp(p, pctEquipe, modo()); }

/* ================= ALTERNADOR VAREJO / AS / GERAL ================= */
function renderModoSwitch() {
  const opcoes = [
    { key: "varejo", nome: "Varejo", desc: "VRJ · Positivação" },
    { key: "as", nome: "AS", desc: "AS · Faturamento" },
    { key: "geral", nome: "Geral", desc: "Visão combinada" },
  ];
  document.getElementById("modoSwitch").innerHTML = opcoes.map(o => `
    <div class="modo-btn ${modoAtivo === o.key ? "active" : ""}" onclick="setModo('${o.key}')">
      <div class="mn">${o.nome}</div>
      <div class="md">${o.desc}</div>
    </div>
  `).join("");
}
function setModo(key) {
  modoAtivo = key;
  equipeFiltro = "Todas";
  busca = "";
  document.getElementById("buscaInput").value = "";
  renderModoSwitch();
  renderGateCard();
  renderFilialSection();
  renderEquipeBoard();
  renderTeamChips();
  renderBoard();
  renderLegend();
  renderLegenda();
  renderRegras();
  renderPremiosBoard();
}

/* ================= NAV DE SECOES ================= */
function renderSecNav() {
  const secs = [
    { key: "placar", label: "Placar" },
    { key: "regras", label: "Regras" },
    { key: "premios", label: "Prêmios" },
  ];
  document.getElementById("secNav").innerHTML = secs.map(s => `
    <div class="item ${secaoAtiva === s.key ? "active" : ""}" onclick="setSecao('${s.key}')">${s.label}</div>
  `).join("");
}
function setSecao(key) {
  secaoAtiva = key;
  renderSecNav();
  ["placar", "regras", "premios"].forEach(k => {
    document.getElementById("sec-" + k).classList.toggle("active", k === key);
  });
}

/* ================= GATE / FAIXA DA EQUIPE (Varejo / AS) ================= */
function gateCardHTML(camp, d) {
  const pct = d.pctGeral;
  const faixa = faixaAtivaCamp(pct, camp);
  const maxEscala = Math.max(...camp.faixas.map(f => f.min)) + 10;
  const pctBarra = Math.min(pct, maxEscala);

  const marcadores = camp.faixas.map(f => f.min).sort((a, b) => a - b).map(min => {
    const ativo = pct >= min;
    return `<div class="gate-marker ${ativo ? "active" : ""}" style="left:${(min / maxEscala * 100)}%"><div class="dot"></div></div>`;
  }).join("");

  const faixasAsc = camp.faixas.slice().sort((a, b) => a.min - b.min);
  const gradiente = faixasAsc.map(f => FAIXA_HEX[f.css]).join(",");

  const faixasHTML = camp.faixas.slice().reverse().map(f => `
    <div class="gate-faixa ${f.css} ${faixa && faixa.min === f.min ? "ativa" : ""}">
      ${f.nome ? `<span class="fn">${f.nome}</span>` : ""}
      <div class="fp">${f.label}</div>
      <div class="fv">${fmtMoney(f.valor)}</div>
    </div>
  `).join("");

  const statusHTML = pct < camp.gatilhoMin
    ? `<div class="gate-status abaixo">Abaixo de ${camp.gatilhoMin}% — nenhum prêmio liberado ainda</div>`
    : `<div class="gate-status acima">Faixa liberada: ${fmtMoney(faixa.valor)} por vendedor (que bateu a própria meta)</div>`;

  return `
    <div class="gate-head">
      <div class="gate-title">${camp.gateLabel}</div>
      <div class="gate-pct num" style="color:${pctColor(pct)}">${pct}%</div>
    </div>
    <div class="gate-nums">${fmtValorCamp(d.valorGeral, camp)} / ${fmtValorCamp(d.metaGeral, camp)} ${camp.metricaLabelPlural} (Empresa toda — VJ + AS)</div>
    <div class="gate-track">
      ${marcadores}
      <div class="gate-fill" style="width:${(pctBarra / maxEscala * 100)}%;background:linear-gradient(90deg,${gradiente})"></div>
    </div>
    <div class="gate-faixas" style="grid-template-columns:repeat(${camp.faixas.length},1fr)">${faixasHTML}</div>
    ${statusHTML}
  `;
}
function gateMiniHTML(camp, d) {
  const pct = d.pctGeral;
  const faixa = faixaAtivaCamp(pct, camp);
  const statusTxt = pct < camp.gatilhoMin ? `Abaixo de ${camp.gatilhoMin}%` : `Liberado: ${fmtMoney(faixa.valor)}/vendedor`;
  const statusColor = pct < camp.gatilhoMin ? "var(--faixa110)" : "var(--teal)";
  const statusBg = pct < camp.gatilhoMin ? "var(--faixa110-bg)" : "var(--teal-soft)";
  return `
    <div class="geral-mini">
      <div class="gm-head">
        <div class="gm-nome">${camp.nome === camp.tag ? camp.nome : `${camp.nome} (${camp.tag})`}</div>
        <div class="gm-pct num" style="color:${pctColor(pct)}">${pct}%</div>
      </div>
      <div class="gm-nums">${fmtValorCamp(d.valorGeral, camp)} / ${fmtValorCamp(d.metaGeral, camp)} ${camp.metricaLabelPlural}</div>
      <div class="gm-track"><div class="gm-fill" style="width:${Math.min(pct,100)}%;background:${pctColor(pct)}"></div></div>
      <div class="gm-status" style="background:${statusBg};color:${statusColor}">${statusTxt}</div>
    </div>
  `;
}
function renderGateCard() {
  if (isGeral()) {
    const totalPremiosVarejo = getPremiosRowsCamp(CAMPANHAS.varejo, DATA.varejo).reduce((s,x)=>s+x.premio,0);
    const totalPremiosAs = getPremiosRowsCamp(CAMPANHAS.as, DATA.as).reduce((s,x)=>s+x.premio,0);
    document.getElementById("gateCard").outerHTML = `
      <div class="geral-resumo" id="gateCard-wrap">
        ${gateMiniHTML(CAMPANHAS.varejo, DATA.varejo)}
        ${gateMiniHTML(CAMPANHAS.as, DATA.as)}
      </div>
      <div class="card gate-card" id="gateCard" style="display:none"></div>
      <div class="geral-strip">
        <div>Total combinado a pagar<b>${fmtMoney(totalPremiosVarejo + totalPremiosAs)}</b></div>
        <div>Varejo<b>${fmtMoney(totalPremiosVarejo)}</b></div>
        <div>AS<b>${fmtMoney(totalPremiosAs)}</b></div>
      </div>
    `;
    return;
  }
  const gc = document.getElementById("gateCard");
  gc.style.display = "";
  gc.innerHTML = gateCardHTML(modo(), dados());
  const wrap = document.getElementById("gateCard-wrap");
  if (wrap) { wrap.remove(); }
  const strip = gc.parentElement.querySelector(".geral-strip");
  if (strip) strip.remove();
}

/* ================= SECAO REGRAS ================= */
function regrasCardHTML(camp) {
  return `
    <div class="card">
      <h2>${camp.regrasTitulo}</h2>
      ${camp.regras.map(r => `
        <div class="regra">
          <div class="ico">${r.ico}</div>
          <div class="txt"><b>${r.titulo}</b> ${r.texto}</div>
        </div>
      `).join("")}
    </div>
    <div class="card">
      <h2>Recompensa de Liderança — ${camp.tag}</h2>
      <div class="txt" style="font-size:13px;color:var(--ink-soft);line-height:1.6;">${camp.liderancaTexto}</div>
      <div class="lideranca-box">${camp.liderancaBox}</div>
    </div>
  `;
}
function renderRegras() {
  const el = document.getElementById("regrasContainer");
  if (isGeral()) {
    el.innerHTML = regrasCardHTML(CAMPANHAS.varejo) + regrasCardHTML(CAMPANHAS.as);
  } else {
    el.innerHTML = regrasCardHTML(modo());
  }
}

/* ================= LEGENDA ================= */
function renderLegenda() {
  const itens = [
    { cor: "#1E7145", texto: "<b>Verde</b> — bateu a meta individual (≥100%)." },
    { cor: "#B8860B", texto: "<b>Amarelo/dourado</b> — entre 60% e 99% da meta." },
    { cor: "#A33B3B", texto: "<b>Vermelho</b> — abaixo de 60% da meta." },
  ];
  if (!isGeral()) {
    itens.push({ cor: FAIXA_HEX[modo().faixas[0].css], texto: `<b>Faixa destacada</b> na barra da equipe — bônus atualmente liberado (ver aba Regras).` });
  } else {
    itens.push({ cor: FAIXA_HEX.f95, texto: `<b>Etiquetas VRJ / AS</b> na lista indicam de qual campanha é cada vendedor.` });
  }
  document.getElementById("legendaCard").innerHTML = `
    <h2>Legenda</h2>
    ${itens.map(i => `<div class="legenda-item"><span class="legenda-dot" style="background:${i.cor}"></span><span>${i.texto}</span></div>`).join("")}
  `;
}

/* ================= SECAO PLACAR ================= */
function renderTeamChips() {
  let chips;
  if (isGeral()) {
    chips = [{ key: "Todas", label: "Todas" }, { key: "varejo", label: "Varejo" }, { key: "as", label: "AS" }];
  } else {
    chips = [{ key: "Todas", label: "Todas" }, ...modo().equipes.map(e => ({ key: e, label: e }))];
  }
  document.getElementById("teamChips").innerHTML = chips.map(c => `
    <div class="chip ${equipeFiltro === c.key ? "active" : ""}" onclick="setEquipe('${c.key}')">${c.label}</div>
  `).join("");
}
function setEquipe(eq) { equipeFiltro = eq; renderTeamChips(); renderBoard(); }

function getLinhas() {
  let rows;
  if (isGeral()) {
    rows = [
      ...DATA.varejo.pessoas.filter(r => !r.isSupervisor).map(r => ({ ...r, _campanha: "varejo" })),
      ...DATA.as.pessoas.filter(r => !r.isSupervisor).map(r => ({ ...r, _campanha: "as" })),
    ];
    if (equipeFiltro !== "Todas") rows = rows.filter(r => r._campanha === equipeFiltro);
  } else {
    rows = dados().pessoas.filter(r => !r.isSupervisor).map(r => ({ ...r, _campanha: modoAtivo }));
    if (equipeFiltro !== "Todas") rows = rows.filter(r => r.equipe === equipeFiltro);
  }
  if (busca.trim()) {
    const q = busca.trim().toLowerCase();
    rows = rows.filter(r => r.nome.toLowerCase().includes(q) || String(r.setor).includes(q));
  }
  rows = [...rows].sort((a, b) => b.pct - a.pct);
  return rows;
}
function toggleRow(setor, campChave) { const el = document.getElementById(`vrow-${campChave}-${setor}`); if (el) el.classList.toggle("open"); }

/* ================= TOTAL GERAL POR EQUIPE ================= */
function getEquipeLinhas() {
  if (isGeral()) {
    return [
      ...DATA.varejo.pessoas.filter(r => r.isSupervisor).map(r => ({ ...r, _campanha: "varejo" })),
      ...DATA.as.pessoas.filter(r => r.isSupervisor).map(r => ({ ...r, _campanha: "as" })),
    ];
  }
  return dados().pessoas.filter(r => r.isSupervisor).map(r => ({ ...r, _campanha: modoAtivo }));
}
function metricaTableHTML(titulo, bloco, isMoeda) {
  const fmt = n => isMoeda ? fmtMoney(n) : fmt0(n);
  return `
    <div class="k" style="text-align:left;margin-bottom:4px;">${titulo} <span style="color:${pctColor(bloco.pct)}">(${bloco.pct}%)</span></div>
    <table class="vtable">
      <thead><tr><th>Meta</th><th>Faturado</th><th>A Faturar</th><th>Projetado</th></tr></thead>
      <tbody><tr>
        <td>${fmt(bloco.meta)}</td>
        <td>${fmt(bloco.faturado)}</td>
        <td>${fmt(bloco.aFaturar)}</td>
        <td>${fmt(bloco.projetado)}</td>
      </tr></tbody>
    </table>
  `;
}
function equipeRowHTML(r) {
  const camp = CAMPANHAS[r._campanha];
  const pctVal = r.pct;
  const track = `<div class="vtrack"><div class="vfill" style="width:${Math.min(pctVal,100)}%;background:${pctColor(pctVal)}"></div></div>`;
  const premio = premioPessoaCamp(r, DATA[r._campanha].pctGeral, camp);
  const campBadge = isGeral() ? `<span class="campanha-badge ${r._campanha}">${camp.tag}</span>` : "";
  const cruzado = isGeral()
    ? `<div class="cruzado-linha">Faturamento: <b>${fmtMoney(r.faturamento.projetado)}</b> (${r.faturamento.pct}%) · Positivação: <b>${fmt0(r.positivacao.projetado)}</b> (${r.positivacao.pct}%)</div>`
    : "";
  const detailTabelas = isGeral()
    ? metricaTableHTML("Positivação", r.positivacao, false) + metricaTableHTML("Faturamento", r.faturamento, true)
    : metricaTableHTML(camp.metricaLabel, camp.chave === "varejo" ? r.positivacao : r.faturamento, camp.isMoeda);
  const detail = `
    ${detailTabelas}
    <div class="premio-full">
      <div class="k">Prêmio de liderança (equipe geral ${camp.tag} ≥ ${camp.gatilhoSupervisor}%? ${DATA[r._campanha].pctGeral >= camp.gatilhoSupervisor ? "sim" : "não"})</div>
      <div class="v" style="color:${premio > 0 ? "var(--teal)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
    </div>
  `;
  return `
    <div class="vrow sup equipe-row" id="vrow-${r._campanha}-${r.setor}" onclick="toggleRow(${r.setor},'${r._campanha}')">
      <div class="vrow-top">
        <div class="equipe-flag" style="background:${camp.teamColor[r.equipe]}"></div>
        <div class="vname">
          <div class="n">${campBadge}Equipe ${r.equipe}</div>
          <div class="t" style="color:${camp.teamColor[r.equipe]}">${camp.tag} · ${r.nome}</div>
          ${cruzado}
        </div>
        <div class="vpct num" style="color:${pctColor(pctVal)}">${fmt0(pctVal)}%</div>
        <div class="chevron">▾</div>
      </div>
      ${track}
      <div class="vdetail">${detail}</div>
    </div>
  `;
}
function renderEquipeBoard() {
  document.getElementById("equipeBoard").innerHTML = getEquipeLinhas().map(r => equipeRowHTML(r)).join("");
}

/* ================= GERAL POR FILIAL (VJ + AS) ================= */
function filialCardHTML(nome, d) {
  const pctFat = d.faturamento.meta > 0 ? Math.round(d.faturamento.realizado / d.faturamento.meta * 100) : 0;
  const pctPos = d.positivacao.meta > 0 ? Math.round(d.positivacao.realizado / d.positivacao.meta * 100) : 0;
  return `
    <div class="filial-card">
      <div class="filial-nome">${nome}</div>
      <div class="filial-stat">
        <span class="fk">Faturamento</span>
        <span class="fv">${fmtMoney(d.faturamento.realizado)}</span>
        <span class="fm">de ${fmtMoney(d.faturamento.meta)} (${pctFat}%)</span>
      </div>
      <div class="filial-stat">
        <span class="fk">Positivação</span>
        <span class="fv">${fmt0(d.positivacao.realizado)}</span>
        <span class="fm">de ${fmt0(d.positivacao.meta)} (${pctPos}%)</span>
      </div>
    </div>
  `;
}
function renderFilialSection() {
  const el = document.getElementById("filialSection");
  if (!isGeral() || !DATA.resumoGeral) { el.innerHTML = ""; return; }
  const rg = DATA.resumoGeral;
  el.innerHTML = `
    <div class="sort-row"><span class="sort-label">Geral por filial (VJ + AS)</span></div>
    <div class="filial-grid">
      ${filialCardHTML("Filial VJ", rg.filialVarejo)}
      ${filialCardHTML("Filial AS", rg.filialAs)}
      ${filialCardHTML("Geral (VJ+AS)", rg.geral)}
    </div>
  `;
}
function vendorRowHTML(r, pos) {
  const camp = CAMPANHAS[r._campanha];
  const badgeClass = pos === 1 ? "gold" : pos === 2 ? "silver" : pos === 3 ? "bronze" : "";
  const pctVal = r.pct;
  const mainNum = fmt0(pctVal) + "%";
  const track = `<div class="vtrack"><div class="vfill" style="width:${Math.min(pctVal,100)}%;background:${pctColor(pctVal)}"></div></div>`;
  const premio = premioPessoaCamp(r, DATA[r._campanha].pctGeral, camp);
  const campBadge = isGeral() ? `<span class="campanha-badge ${r._campanha}">${camp.tag}</span>` : "";
  const detail = `
    <table class="vtable">
      <thead><tr><th>Meta</th><th>Faturado</th><th>A Faturar</th><th>Projetado</th></tr></thead>
      <tbody><tr>
        <td>${fmtValorCamp(r.meta, camp)}</td>
        <td>${fmtValorCamp(r.faturado, camp)}</td>
        <td>${fmtValorCamp(r.aFaturar, camp)}</td>
        <td>${fmtValorCamp(r.projetado, camp)}</td>
      </tr></tbody>
    </table>
    <div class="premio-full">
      <div class="k">Prêmio (bateu meta? ${r.bateuIndividual ? "sim" : "não"} · faixa da equipe ${camp.tag}: ${DATA[r._campanha].pctGeral}%)</div>
      <div class="v" style="color:${premio > 0 ? "var(--teal)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
    </div>
  `;
  return `
    <div class="vrow" id="vrow-${r._campanha}-${r.setor}" onclick="toggleRow(${r.setor},'${r._campanha}')">
      <div class="vrow-top">
        <div class="pos-badge ${badgeClass}">${pos}</div>
        <div class="vname">
          <div class="n">${campBadge}${r.nome}</div>
          <div class="t" style="color:${camp.teamColor[r.equipe]}">${r.equipe} · Setor ${r.setor}</div>
        </div>
        <div class="vpct num" style="color:${pctColor(pctVal)}">${mainNum}</div>
        <div class="chevron">▾</div>
      </div>
      ${track}
      <div class="vdetail">${detail}</div>
    </div>
  `;
}
function renderBoard() {
  const rows = getLinhas();
  const board = document.getElementById("board");
  board.innerHTML = rows.length === 0
    ? `<div class="empty">Nenhum vendedor encontrado com esse filtro.</div>`
    : rows.map((r, i) => vendorRowHTML(r, i + 1)).join("");
  const total = isGeral()
    ? DATA.varejo.pessoas.filter(r=>!r.isSupervisor).length + DATA.as.pessoas.filter(r=>!r.isSupervisor).length
    : dados().pessoas.filter(r=>!r.isSupervisor).length;
  document.getElementById("countLabel").textContent = `${rows.length} de ${total}`;
  document.getElementById("sortLabel").textContent = isGeral()
    ? "Ordenado por % da meta individual (Varejo + AS)"
    : `Ordenado por % da meta individual (${modo().metricaLabel})`;
}
function renderLegend() {
  if (isGeral()) {
    document.getElementById("legendText").innerHTML =
      "Visão combinada para acompanhamento geral. Toque em um vendedor para ver a tabela de Meta, Faturado, A Faturar e Projetado, com o prêmio calculado pela mecânica da campanha dele (Varejo ou AS).";
    return;
  }
  const m = modo();
  document.getElementById("legendText").innerHTML = m.isMoeda
    ? "Toque em um vendedor para ver a tabela com meta, faturado, a faturar e projetado, além do prêmio calculado. Inclui notas FATURADO e A FATURAR; devoluções são descontadas e bonificações não entram na conta."
    : "Toque em um vendedor para ver a tabela com meta, faturado, a faturar e projetado (positivações), além do prêmio calculado. Clientes com devolução no período não contam.";
}
function exportCSV() {
  const rows = getLinhas();
  const headers = ["Campanha", "Setor", "Vendedor", "Equipe", "Meta", "Faturado", "A Faturar", "Projetado", "%", "Bateu meta", "Prêmio (R$)"];
  const lines = [headers.join(";")];
  rows.forEach(r => {
    const camp = CAMPANHAS[r._campanha];
    const premio = premioPessoaCamp(r, DATA[r._campanha].pctGeral, camp);
    lines.push([camp.tag, r.setor, r.nome, r.equipe, r.meta, r.faturado, r.aFaturar, r.projetado, r.pct + "%", r.bateuIndividual ? "Sim" : "Não", premio.toFixed(2)].join(";"));
  });
  downloadCSV(lines, `placar_${modoAtivo}_ingleza.csv`);
}
function downloadCSV(lines, filename) {
  const csv = "﻿" + lines.join("\n");
  const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ================= SECAO PREMIOS ================= */
function getPremiosRowsCamp(camp, d) {
  const rows = d.pessoas.map(r => ({ r: { ...r, _campanha: camp.chave }, premio: premioPessoaCamp(r, d.pctGeral, camp) }));
  rows.sort((a, b) => b.premio - a.premio || a.r.nome.localeCompare(b.r.nome));
  return rows;
}
function getPremiosRows() {
  if (isGeral()) {
    let rows = [...getPremiosRowsCamp(CAMPANHAS.varejo, DATA.varejo), ...getPremiosRowsCamp(CAMPANHAS.as, DATA.as)];
    if (equipeFiltro !== "Todas") rows = rows.filter(x => x.r._campanha === equipeFiltro);
    rows.sort((a, b) => b.premio - a.premio || a.r.nome.localeCompare(b.r.nome));
    return rows;
  }
  return getPremiosRowsCamp(modo(), dados());
}
function premioRowHTML(item, pos) {
  const camp = CAMPANHAS[item.r._campanha];
  const { r, premio } = item;
  const campBadge = isGeral() ? `<span class="campanha-badge ${r._campanha}">${camp.tag}</span>` : "";
  const marcaIndividual = r.isSupervisor
    ? `<span class="premio-ind ${DATA[r._campanha].pctGeral >= camp.gatilhoSupervisor ? "ok" : "no"}">Equipe geral ≥ ${camp.gatilhoSupervisor}%: ${DATA[r._campanha].pctGeral >= camp.gatilhoSupervisor ? "Sim" : "Não"}</span>`
    : `<span class="premio-ind ${r.bateuIndividual ? "ok" : "no"}">Meta individual: ${r.bateuIndividual ? "Bateu" : "Não bateu"} (${r.pct}%)</span>`;
  return `
    <div class="vrow ${r.isSupervisor ? "sup" : ""}" style="cursor:default;">
      <div class="vrow-top">
        <div class="pos-badge">${pos}</div>
        <div class="vname">
          <div class="n">${campBadge}${r.nome}${r.isSupervisor ? " (equipe)" : ""}</div>
          <div class="t" style="color:${camp.teamColor[r.equipe]}">${r.equipe}${r.isSupervisor ? "" : " · Setor " + r.setor}</div>
        </div>
        <div class="vpct num" style="color:${premio > 0 ? "var(--teal)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
      </div>
      <div class="premio-marks">${marcaIndividual}</div>
    </div>
  `;
}
function renderPremiosBoard() {
  const rows = getPremiosRows();
  document.getElementById("premiosBoard").innerHTML = rows.map((item, i) => premioRowHTML(item, i + 1)).join("");
  document.getElementById("premiosCount").textContent = `${rows.length} participantes`;
  const totalGeral = rows.reduce((s, x) => s + x.premio, 0);
  const totalVendedores = rows.filter(x => !x.r.isSupervisor && x.premio > 0).length;
  const totalVendedoresBase = isGeral()
    ? DATA.varejo.pessoas.filter(r=>!r.isSupervisor).length + DATA.as.pessoas.filter(r=>!r.isSupervisor).length
    : dados().pessoas.filter(r=>!r.isSupervisor).length;

  if (isGeral()) {
    document.getElementById("premiosTotal").innerHTML = `
      <div>Ganhadores<b>${totalVendedores} de ${totalVendedoresBase} vendedores</b></div>
      <div>Total combinado a pagar<b>${fmtMoney(totalGeral)}</b></div>
    `;
    document.getElementById("premiosLegenda").innerHTML =
      "Lista combinada de Varejo (VRJ) e AS, cada um com a faixa de prêmio calculada pela mecânica da própria campanha. Veja a aba Regras para os detalhes de cada uma.";
  } else {
    const m = modo();
    const faixa = faixaAtiva(dados().pctGeral);
    document.getElementById("premiosTotal").innerHTML = `
      <div>Faixa atual da equipe<b>${faixa ? fmtMoney(faixa.valor) + " / vendedor" : `Nenhuma (< ${m.gatilhoMin}%)`}</b></div>
      <div>Ganhadores<b>${totalVendedores} de ${totalVendedoresBase} vendedores</b></div>
      <div>Total a pagar<b>${fmtMoney(totalGeral)}</b></div>
    `;
    document.getElementById("premiosLegenda").innerHTML =
      `A faixa de prêmio (${m.faixas.slice().reverse().map(f => fmtMoney(f.valor)).join(" / ")} por vendedor) depende do atingimento da ` +
      `<b>equipe geral ${m.tag}</b>. Só recebe quem bateu 100% da própria meta individual. Abaixo de ${m.gatilhoMin}% de atingimento geral, ` +
      `ninguém recebe. Supervisores ganham R$500 fixo quando a equipe geral atingir ${m.gatilhoSupervisor}%.`;
  }
}
function exportPremiosCSV() {
  const rows = getPremiosRows();
  const headers = ["Campanha", "Posição", "Setor", "Nome", "Tipo", "Equipe", "% Meta Individual", "Bateu", "Prêmio (R$)"];
  const lines = [headers.join(";")];
  rows.forEach((item, i) => {
    const { r, premio } = item;
    const camp = CAMPANHAS[r._campanha];
    lines.push([camp.tag, i + 1, r.setor, r.nome, r.isSupervisor ? "Supervisor" : "Vendedor", r.equipe, r.pct + "%", r.bateuIndividual ? "Sim" : "Não", premio.toFixed(2)].join(";"));
  });
  downloadCSV(lines, `premios_${modoAtivo}_ingleza.csv`);
}

/* ================= INICIALIZACAO ================= */
fetch("data.json")
  .then(r => r.json())
  .then(data => {
    DATA = data;
    // A régua/gauge de cada campanha passa a mostrar a meta e o realizado da
    // EMPRESA TODA (VJ+AS+demais), não mais o escopo próprio de cada campanha
    // (1.462 positivações só de Washignton+Rodrigo+Sueli, ou R$1.272.933 só
    // de Alessandro+Anderson+Arildo) — pedido explícito do usuário: "Meta
    // 2.416" e "atingimento da filial como toda AS + VJ" nos dois lados,
    // somando meta E realizado. Sobrescreve metaGeral/valorGeral/pctGeral
    // aqui, na fonte, pra que todo o resto (faixas de prêmio, gatilho de
    // supervisor, cards do modo Geral, export CSV) automaticamente use o
    // número certo sem precisar duplicar essa lógica em cada função.
    if (DATA.resumoGeral) {
      DATA.varejo.metaGeral = DATA.resumoGeral.geral.positivacao.meta;
      DATA.varejo.valorGeral = DATA.resumoGeral.geral.positivacao.realizado;
      DATA.varejo.pctGeral = Math.round(DATA.varejo.valorGeral / DATA.varejo.metaGeral * 1000) / 10;
      DATA.as.metaGeral = DATA.resumoGeral.geral.faturamento.meta;
      DATA.as.valorGeral = DATA.resumoGeral.geral.faturamento.realizado;
      DATA.as.pctGeral = Math.round(DATA.as.valorGeral / DATA.as.metaGeral * 1000) / 10;
    }
    document.getElementById("periodoLabel").textContent = "Período: " + DATA.periodo;
    document.getElementById("buscaInput").addEventListener("input", e => { busca = e.target.value; renderBoard(); });

    renderModoSwitch();
    renderSecNav();
    renderGateCard();
    renderFilialSection();
    renderEquipeBoard();
    renderTeamChips();
    renderBoard();
    renderLegend();
    renderLegenda();
    renderRegras();
    renderPremiosBoard();
  });
