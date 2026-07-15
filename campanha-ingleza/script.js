// ---------------------------------------------------------------------------
// Campanha Ingleza — logica da aplicacao
// Cobre as DUAS mecanicas da mesma reuniao: VRJ/Varejo (positivacao) e AS
// (faturamento). Dados ficam em data.json: { periodo, varejo: {...}, as: {...} }
// ---------------------------------------------------------------------------

let DATA = { periodo: "", varejo: null, as: null };
let modoAtivo = "varejo";

const FAIXA_HEX = { f85: "#F2A93B", f90: "#12B896", f95: "#3B5BA5", f100: "#123A5E", f110: "#E3273B" };

const MODOS = {
  varejo: {
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
    regrasTitulo: "Regras da Campanha — VRJ (Varejo)",
    regras: [
      { ico: "📅", titulo: "Período Oficial:", texto: "Válido estritamente para faturamentos e positivações registradas entre 01/07/2026 e 31/07/2026." },
      { ico: "✓", titulo: "Regra de Elegibilidade:", texto: "A premiação do vendedor VRJ só é liberada se ele atingir 100% da sua meta individual de positivação estabelecida." },
      { ico: "📈", titulo: "Gatilho de Equipe:", texto: "A faixa de premiação individual (R$100, R$150, R$250 ou R$400) é determinada pelo percentual total de positivação consolidada alcançado pela equipe geral (meta base de 1.535,84 — Washignton + Rodrigo + Sueli)." },
      { ico: "🛡", titulo: "Auditoria e Conformidade:", texto: "Cadastros inconsistentes ou devoluções de mercadoria dentro do mês de apuração anulam a positivação do respectivo cliente." },
      { ico: "✓", titulo: "Gatilho de Positivação (85%):", texto: "Para habilitar a premiação dos vendedores VRJ, a equipe precisa atingir pelo menos 85% do objetivo geral de positivação." },
    ],
    liderancaTexto: "Nossos supervisores VRJ desempenham papel fundamental no direcionamento, acompanhamento, motivação e suporte tático do time de varejo durante esta grande jornada. Para reconhecer esse esforço de coordenação, quando a equipe consolidada atingir <b>100% do volume previsto de positivação</b>:",
    liderancaBox: "🏆 Prêmio de R$ 500,00 para cada um dos 3 Supervisores VRJ!",
    gateLabel: "Atingimento da equipe geral — Varejo",
  },
  as: {
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
    regrasTitulo: "Regras da Campanha — AS",
    regras: [
      { ico: "📅", titulo: "Período Oficial:", texto: "Válido estritamente para faturamentos registrados entre 01/07/2026 e 31/07/2026." },
      { ico: "✓", titulo: "Regra de Elegibilidade:", texto: "A premiação do vendedor AS só é liberada se ele atingir 100% da sua meta individual de faturamento estabelecida." },
      { ico: "📈", titulo: "Gatilho de Equipe:", texto: "A faixa de premiação individual (R$250, R$400 ou R$500) é determinada pelo percentual total de faturamento consolidado alcançado pela equipe geral (meta base de R$ 1.900.000,00 — Alessandro + Anderson + Arildo)." },
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

function modo() { return MODOS[modoAtivo]; }
function dados() { return DATA[modoAtivo]; }

function pctColor(pct) {
  if (pct >= 100) return "#1E7145";
  if (pct >= 60) return "#B8860B";
  return "#A33B3B";
}
function fmt0(n) { return Math.round(n).toLocaleString("pt-BR"); }
function fmtMoney(n) { return "R$ " + Math.round(n).toLocaleString("pt-BR"); }
function fmtValor(n) { return modo().isMoeda ? fmtMoney(n) : fmt0(n); }

function faixaAtiva(pctEquipe) {
  return modo().faixas.find(f => pctEquipe >= f.min) || null;
}
function premioPessoa(p, pctEquipe) {
  const m = modo();
  if (p.isSupervisor) {
    return pctEquipe >= m.gatilhoSupervisor ? m.premioSupervisor : 0;
  }
  if (p.pct < 100) return 0;
  const faixa = faixaAtiva(pctEquipe);
  return faixa ? faixa.valor : 0;
}

/* ================= ALTERNADOR VAREJO / AS ================= */
function renderModoSwitch() {
  document.getElementById("modoSwitch").innerHTML = Object.keys(MODOS).map(k => {
    const m = MODOS[k];
    return `
      <div class="modo-btn ${modoAtivo === k ? "active" : ""}" onclick="setModo('${k}')">
        <div class="mn">${m.nome}</div>
        <div class="md">${m.tag} · ${m.metricaLabel}</div>
      </div>
    `;
  }).join("");
}
function setModo(key) {
  modoAtivo = key;
  equipeFiltro = "Todas";
  busca = "";
  document.getElementById("buscaInput").value = "";
  renderModoSwitch();
  renderGateCard();
  renderTeamChips();
  renderBoard();
  renderLegend();
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

/* ================= GATE / FAIXA DA EQUIPE ================= */
function renderGateCard() {
  const m = modo();
  const d = dados();
  const pct = d.pctGeral;
  const faixa = faixaAtiva(pct);
  const maxEscala = Math.max(...m.faixas.map(f => f.min)) + 10;
  const pctBarra = Math.min(pct, maxEscala);

  const marcadores = m.faixas.map(f => f.min).sort((a, b) => a - b).map(min => {
    const ativo = pct >= min;
    return `<div class="gate-marker ${ativo ? "active" : ""}" style="left:${(min / maxEscala * 100)}%"><div class="dot"></div></div>`;
  }).join("");

  const faixasAsc = m.faixas.slice().sort((a, b) => a.min - b.min);
  const gradiente = faixasAsc.map(f => FAIXA_HEX[f.css]).join(",");

  const faixasHTML = m.faixas.slice().reverse().map(f => `
    <div class="gate-faixa ${f.css} ${faixa && faixa.min === f.min ? "ativa" : ""}" style="${m.faixas.length === 3 ? "grid-column:span 1;" : ""}">
      ${f.nome ? `<span class="fn">${f.nome}</span>` : ""}
      <div class="fp">${f.label}</div>
      <div class="fv">${fmtMoney(f.valor)}</div>
    </div>
  `).join("");

  const statusHTML = pct < m.gatilhoMin
    ? `<div class="gate-status abaixo">Abaixo de ${m.gatilhoMin}% — nenhum prêmio liberado ainda</div>`
    : `<div class="gate-status acima">Faixa liberada: ${fmtMoney(faixa.valor)} por vendedor (que bateu a própria meta)</div>`;

  document.getElementById("gateCard").innerHTML = `
    <div class="gate-head">
      <div class="gate-title">${m.gateLabel}</div>
      <div class="gate-pct num" style="color:${pctColor(pct)}">${pct}%</div>
    </div>
    <div class="gate-nums">${fmtValor(d.valorGeral)} / ${fmtValor(d.metaGeral)} ${m.metricaLabelPlural} (${m.equipes.join(" + ")})</div>
    <div class="gate-track">
      ${marcadores}
      <div class="gate-fill" style="width:${(pctBarra / maxEscala * 100)}%;background:linear-gradient(90deg,${gradiente})"></div>
    </div>
    <div class="gate-faixas" style="grid-template-columns:repeat(${m.faixas.length},1fr)">${faixasHTML}</div>
    ${statusHTML}
  `;
}

/* ================= SECAO REGRAS ================= */
function renderRegras() {
  const m = modo();
  document.getElementById("regrasTitulo").textContent = m.regrasTitulo;
  document.getElementById("regrasLista").innerHTML = m.regras.map(r => `
    <div class="regra">
      <div class="ico">${r.ico}</div>
      <div class="txt"><b>${r.titulo}</b> ${r.texto}</div>
    </div>
  `).join("");
  document.getElementById("liderancaTexto").innerHTML = m.liderancaTexto;
  document.getElementById("liderancaBox").textContent = m.liderancaBox;
}

/* ================= SECAO PLACAR ================= */
function renderTeamChips() {
  const m = modo();
  const chips = [{ key: "Todas", label: "Todas" }, ...m.equipes.map(e => ({ key: e, label: e }))];
  document.getElementById("teamChips").innerHTML = chips.map(c => `
    <div class="chip ${equipeFiltro === c.key ? "active" : ""}" onclick="setEquipe('${c.key}')">${c.label}</div>
  `).join("");
}
function setEquipe(eq) { equipeFiltro = eq; renderTeamChips(); renderBoard(); }
function getLinhas() {
  let rows = dados().pessoas.filter(r => !r.isSupervisor);
  if (equipeFiltro !== "Todas") rows = rows.filter(r => r.equipe === equipeFiltro);
  if (busca.trim()) {
    const q = busca.trim().toLowerCase();
    rows = rows.filter(r => r.nome.toLowerCase().includes(q) || String(r.setor).includes(q));
  }
  rows = [...rows].sort((a, b) => b.pct - a.pct);
  return rows;
}
function toggleRow(setor) { const el = document.getElementById("vrow-" + setor); if (el) el.classList.toggle("open"); }
function vendorRowHTML(r, pos) {
  const m = modo();
  const badgeClass = pos === 1 ? "gold" : pos === 2 ? "silver" : pos === 3 ? "bronze" : "";
  const pctVal = r.pct;
  const mainNum = fmt0(pctVal) + "%";
  const track = `<div class="vtrack"><div class="vfill" style="width:${Math.min(pctVal,100)}%;background:${pctColor(pctVal)}"></div></div>`;
  const premio = premioPessoa(r, dados().pctGeral);
  const detail = `
    <div><div class="k">Meta</div><div class="v">${fmtValor(r.meta)}</div></div>
    <div><div class="k">${m.metricaLabel}</div><div class="v">${fmtValor(r.valor)}</div></div>
    <div class="premio-full">
      <div class="k">Prêmio (bateu meta? ${r.bateuIndividual ? "sim" : "não"} · faixa da equipe: ${dados().pctGeral}%)</div>
      <div class="v" style="color:${premio > 0 ? "var(--teal)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
    </div>
  `;
  return `
    <div class="vrow" id="vrow-${r.setor}" onclick="toggleRow(${r.setor})">
      <div class="vrow-top">
        <div class="pos-badge ${badgeClass}">${pos}</div>
        <div class="vname">
          <div class="n">${r.nome}</div>
          <div class="t" style="color:${m.teamColor[r.equipe]}">${r.equipe} · Setor ${r.setor}</div>
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
  document.getElementById("countLabel").textContent = `${rows.length} de ${dados().pessoas.filter(r=>!r.isSupervisor).length}`;
  document.getElementById("sortLabel").textContent = `Ordenado por % da meta individual (${modo().metricaLabel})`;
}
function renderLegend() {
  const m = modo();
  document.getElementById("legendText").innerHTML = m.isMoeda
    ? "Toque em um vendedor para ver a meta individual, o faturamento apurado e o prêmio calculado. Inclui notas FATURADO e A FATURAR; devoluções são descontadas e bonificações não entram na conta."
    : "Toque em um vendedor para ver a meta individual, a positivação e o prêmio calculado. Conta clientes distintos (faturado + a faturar); clientes com devolução no período não contam.";
}
function exportCSV() {
  const m = modo();
  const headers = ["Setor", "Vendedor", "Equipe", "Meta", m.metricaLabel, "%", "Bateu meta", "Prêmio (R$)"];
  const lines = [headers.join(";")];
  dados().pessoas.forEach(r => {
    const premio = premioPessoa(r, dados().pctGeral);
    lines.push([r.setor, r.nome, r.equipe, Math.round(r.meta), r.valor, r.pct + "%", r.bateuIndividual ? "Sim" : "Não", premio.toFixed(2)].join(";"));
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
function getPremiosRows() {
  const rows = dados().pessoas.map(r => ({ r, premio: premioPessoa(r, dados().pctGeral) }));
  rows.sort((a, b) => b.premio - a.premio || a.r.nome.localeCompare(b.r.nome));
  return rows;
}
function premioRowHTML(item, pos) {
  const m = modo();
  const { r, premio } = item;
  const marcaIndividual = r.isSupervisor
    ? `<span class="premio-ind ${dados().pctGeral >= m.gatilhoSupervisor ? "ok" : "no"}">Equipe geral ≥ ${m.gatilhoSupervisor}%: ${dados().pctGeral >= m.gatilhoSupervisor ? "Sim" : "Não"}</span>`
    : `<span class="premio-ind ${r.bateuIndividual ? "ok" : "no"}">Meta individual: ${r.bateuIndividual ? "Bateu" : "Não bateu"} (${r.pct}%)</span>`;
  return `
    <div class="vrow ${r.isSupervisor ? "sup" : ""}" style="cursor:default;">
      <div class="vrow-top">
        <div class="pos-badge">${pos}</div>
        <div class="vname">
          <div class="n">${r.nome}${r.isSupervisor ? " (equipe)" : ""}</div>
          <div class="t" style="color:${m.teamColor[r.equipe]}">${r.equipe}${r.isSupervisor ? "" : " · Setor " + r.setor}</div>
        </div>
        <div class="vpct num" style="color:${premio > 0 ? "var(--teal)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
      </div>
      <div class="premio-marks">${marcaIndividual}</div>
    </div>
  `;
}
function renderPremiosBoard() {
  const m = modo();
  const rows = getPremiosRows();
  document.getElementById("premiosBoard").innerHTML = rows.map((item, i) => premioRowHTML(item, i + 1)).join("");
  document.getElementById("premiosCount").textContent = `${rows.length} participantes`;
  const totalGeral = rows.reduce((s, x) => s + x.premio, 0);
  const totalVendedores = rows.filter(x => !x.r.isSupervisor && x.premio > 0).length;
  const faixa = faixaAtiva(dados().pctGeral);
  document.getElementById("premiosTotal").innerHTML = `
    <div>Faixa atual da equipe<b>${faixa ? fmtMoney(faixa.valor) + " / vendedor" : `Nenhuma (< ${m.gatilhoMin}%)`}</b></div>
    <div>Ganhadores<b>${totalVendedores} de ${dados().pessoas.filter(r=>!r.isSupervisor).length} vendedores</b></div>
    <div>Total a pagar<b>${fmtMoney(totalGeral)}</b></div>
  `;
  document.getElementById("premiosLegenda").innerHTML =
    `A faixa de prêmio (${m.faixas.slice().reverse().map(f => fmtMoney(f.valor)).join(" / ")} por vendedor) depende do atingimento da ` +
    `<b>equipe geral ${m.tag}</b>. Só recebe quem bateu 100% da própria meta individual. Abaixo de ${m.gatilhoMin}% de atingimento geral, ` +
    `ninguém recebe. Supervisores ganham R$500 fixo quando a equipe geral atingir ${m.gatilhoSupervisor}%.`;
}
function exportPremiosCSV() {
  const rows = getPremiosRows();
  const headers = ["Posição", "Setor", "Nome", "Tipo", "Equipe", "% Meta Individual", "Bateu", "Prêmio (R$)"];
  const lines = [headers.join(";")];
  rows.forEach((item, i) => {
    const { r, premio } = item;
    lines.push([i + 1, r.setor, r.nome, r.isSupervisor ? "Supervisor" : "Vendedor", r.equipe, r.pct + "%", r.bateuIndividual ? "Sim" : "Não", premio.toFixed(2)].join(";"));
  });
  downloadCSV(lines, `premios_${modoAtivo}_ingleza.csv`);
}

/* ================= INICIALIZACAO ================= */
fetch("data.json")
  .then(r => r.json())
  .then(data => {
    DATA = data;
    document.getElementById("periodoLabel").textContent = "Período: " + DATA.periodo;
    document.getElementById("buscaInput").addEventListener("input", e => { busca = e.target.value; renderBoard(); });

    renderModoSwitch();
    renderSecNav();
    renderGateCard();
    renderTeamChips();
    renderBoard();
    renderLegend();
    renderRegras();
    renderPremiosBoard();
  });
