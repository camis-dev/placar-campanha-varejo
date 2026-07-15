// ---------------------------------------------------------------------------
// Campanha VJ Ingleza — logica da aplicacao
// Dados ficam em data.json (carregado no fetch abaixo)
// ---------------------------------------------------------------------------

let DATA = { periodo: "", metaEquipeGeral: 0, positivacaoEquipeGeral: 0, pctEquipeGeral: 0, pessoas: [] };

const EQUIPES = ["Washignton", "Rodrigo", "Sueli"];
const TEAM_COLOR = { Washignton: "#1E7145", Rodrigo: "#B8620A", Sueli: "#A33B3B" };

// Escala de premios: a faixa ativa e a de maior "min" que a equipe geral atingiu.
// Abaixo de 85% (gatilho de positivacao), ninguem recebe.
const FAIXAS = [
  { min: 110, valor: 400, label: "110%", css: "f110" },
  { min: 100, valor: 250, label: "100%", css: "f100" },
  { min: 90,  valor: 150, label: "90%",  css: "f90" },
  { min: 85,  valor: 100, label: "85%",  css: "f85" },
];
const PREMIO_SUPERVISOR = 500;      // pago quando a equipe geral atinge 100%
const GATILHO_SUPERVISOR = 100;

let busca = "";
let equipeFiltro = "Todas";
let secaoAtiva = "placar";

function pctColor(pct) {
  if (pct >= 100) return "#1E7145";
  if (pct >= 60) return "#B8860B";
  return "#A33B3B";
}
function fmt0(n) { return Math.round(n).toLocaleString("pt-BR"); }
function fmtMoney(n) { return "R$ " + Math.round(n).toLocaleString("pt-BR"); }

function faixaAtiva(pctEquipe) {
  return FAIXAS.find(f => pctEquipe >= f.min) || null;
}
function premioPessoa(p, pctEquipe) {
  if (p.isSupervisor) {
    return pctEquipe >= GATILHO_SUPERVISOR ? PREMIO_SUPERVISOR : 0;
  }
  if (p.pct < 100) return 0;
  const faixa = faixaAtiva(pctEquipe);
  return faixa ? faixa.valor : 0;
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
  const pct = DATA.pctEquipeGeral;
  const faixa = faixaAtiva(pct);
  const maxEscala = 120;
  const pctBarra = Math.min(pct, maxEscala);

  const marcadores = [85, 90, 100, 110].map(m => {
    const ativo = pct >= m;
    return `<div class="gate-marker ${ativo ? "active" : ""}" style="left:${(m/maxEscala*100)}%"><div class="dot"></div></div>`;
  }).join("");

  const faixasHTML = FAIXAS.slice().reverse().map(f => `
    <div class="gate-faixa ${f.css} ${faixa && faixa.min === f.min ? "ativa" : ""}">
      <div class="fp">${f.label}</div>
      <div class="fv">${fmtMoney(f.valor)}</div>
    </div>
  `).join("");

  const statusHTML = pct < 85
    ? `<div class="gate-status abaixo">Abaixo de 85% — nenhum prêmio liberado ainda</div>`
    : `<div class="gate-status acima">Faixa liberada: ${fmtMoney(faixa.valor)} por vendedor (que bateu a própria meta)</div>`;

  document.getElementById("gateCard").innerHTML = `
    <div class="gate-head">
      <div class="gate-title">Atingimento da equipe geral</div>
      <div class="gate-pct num" style="color:${pctColor(pct)}">${pct}%</div>
    </div>
    <div class="gate-nums">${fmt0(DATA.positivacaoEquipeGeral)} / ${fmt0(DATA.metaEquipeGeral)} positivações (Washignton + Rodrigo + Sueli)</div>
    <div class="gate-track">
      ${marcadores}
      <div class="gate-fill" style="width:${(pctBarra/maxEscala*100)}%"></div>
    </div>
    <div class="gate-faixas">${faixasHTML}</div>
    ${statusHTML}
  `;
}

/* ================= SECAO PLACAR ================= */
function renderTeamChips() {
  const chips = [{ key: "Todas", label: "Todas" }, ...EQUIPES.map(e => ({ key: e, label: e }))];
  document.getElementById("teamChips").innerHTML = chips.map(c => `
    <div class="chip ${equipeFiltro === c.key ? "active" : ""}" onclick="setEquipe('${c.key}')">${c.label}</div>
  `).join("");
}
function setEquipe(eq) { equipeFiltro = eq; renderTeamChips(); renderBoard(); }
function getLinhas() {
  let rows = DATA.pessoas.filter(r => !r.isSupervisor);
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
  const badgeClass = pos === 1 ? "gold" : pos === 2 ? "silver" : pos === 3 ? "bronze" : "";
  const pctVal = r.pct;
  const mainNum = fmt0(pctVal) + "%";
  const track = `<div class="vtrack"><div class="vfill" style="width:${Math.min(pctVal,100)}%;background:${pctColor(pctVal)}"></div></div>`;
  const premio = premioPessoa(r, DATA.pctEquipeGeral);
  const detail = `
    <div><div class="k">Meta</div><div class="v">${fmt0(r.metaIndividual)}</div></div>
    <div><div class="k">Positivação</div><div class="v">${fmt0(r.positivacao)}</div></div>
    <div class="premio-full">
      <div class="k">Prêmio (bateu meta? ${r.bateuIndividual ? "sim" : "não"} · faixa da equipe: ${DATA.pctEquipeGeral}%)</div>
      <div class="v" style="color:${premio > 0 ? "var(--green)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
    </div>
  `;
  return `
    <div class="vrow" id="vrow-${r.setor}" onclick="toggleRow(${r.setor})">
      <div class="vrow-top">
        <div class="pos-badge ${badgeClass}">${pos}</div>
        <div class="vname">
          <div class="n">${r.nome}</div>
          <div class="t" style="color:${TEAM_COLOR[r.equipe]}">${r.equipe} · Setor ${r.setor}</div>
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
  document.getElementById("countLabel").textContent = `${rows.length} de ${DATA.pessoas.filter(r=>!r.isSupervisor).length}`;
}
function renderLegend() {
  document.getElementById("legendText").innerHTML =
    "Toque em um vendedor para ver a meta individual, a positivação e o prêmio calculado. " +
    "A meta individual é fixa para a campanha; a positivação conta clientes distintos (faturado + a faturar) no período.";
}
function exportCSV() {
  const headers = ["Setor", "Vendedor", "Equipe", "Meta", "Positivação", "%", "Bateu meta", "Prêmio (R$)"];
  const lines = [headers.join(";")];
  DATA.pessoas.forEach(r => {
    const premio = premioPessoa(r, DATA.pctEquipeGeral);
    lines.push([r.setor, r.nome, r.equipe, Math.round(r.metaIndividual), r.positivacao, r.pct + "%", r.bateuIndividual ? "Sim" : "Não", premio.toFixed(2)].join(";"));
  });
  downloadCSV(lines, "placar_vj_ingleza.csv");
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
  const rows = DATA.pessoas.map(r => ({ r, premio: premioPessoa(r, DATA.pctEquipeGeral) }));
  rows.sort((a, b) => b.premio - a.premio || a.r.nome.localeCompare(b.r.nome));
  return rows;
}
function premioRowHTML(item, pos) {
  const { r, premio } = item;
  const marcaIndividual = r.isSupervisor
    ? `<span class="premio-ind ${DATA.pctEquipeGeral >= GATILHO_SUPERVISOR ? "ok" : "no"}">Equipe geral ≥ 100%: ${DATA.pctEquipeGeral >= GATILHO_SUPERVISOR ? "Sim" : "Não"}</span>`
    : `<span class="premio-ind ${r.bateuIndividual ? "ok" : "no"}">Meta individual: ${r.bateuIndividual ? "Bateu" : "Não bateu"} (${r.pct}%)</span>`;
  return `
    <div class="vrow ${r.isSupervisor ? "sup" : ""}" style="cursor:default;">
      <div class="vrow-top">
        <div class="pos-badge">${pos}</div>
        <div class="vname">
          <div class="n">${r.nome}${r.isSupervisor ? " (equipe)" : ""}</div>
          <div class="t" style="color:${TEAM_COLOR[r.equipe]}">${r.equipe}${r.isSupervisor ? "" : " · Setor " + r.setor}</div>
        </div>
        <div class="vpct num" style="color:${premio > 0 ? "var(--green)" : "var(--ink-soft)"}">${fmtMoney(premio)}</div>
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
  const faixa = faixaAtiva(DATA.pctEquipeGeral);
  document.getElementById("premiosTotal").innerHTML = `
    <div>Faixa atual da equipe<b>${faixa ? fmtMoney(faixa.valor) + " / vendedor" : "Nenhuma (< 85%)"}</b></div>
    <div>Ganhadores<b>${totalVendedores} de ${DATA.pessoas.filter(r=>!r.isSupervisor).length} vendedores</b></div>
    <div>Total a pagar<b>${fmtMoney(totalGeral)}</b></div>
  `;
}
function exportPremiosCSV() {
  const rows = getPremiosRows();
  const headers = ["Posição", "Setor", "Nome", "Tipo", "Equipe", "% Meta Individual", "Bateu", "Prêmio (R$)"];
  const lines = [headers.join(";")];
  rows.forEach((item, i) => {
    const { r, premio } = item;
    lines.push([i + 1, r.setor, r.nome, r.isSupervisor ? "Supervisor" : "Vendedor", r.equipe, r.pct + "%", r.bateuIndividual ? "Sim" : "Não", premio.toFixed(2)].join(";"));
  });
  downloadCSV(lines, "premios_vj_ingleza.csv");
}

/* ================= INICIALIZACAO ================= */
fetch("data.json")
  .then(r => r.json())
  .then(data => {
    DATA = data;
    document.getElementById("periodoLabel").textContent = "Período: " + DATA.periodo;
    document.getElementById("buscaInput").addEventListener("input", e => { busca = e.target.value; renderBoard(); });

    renderSecNav();
    renderGateCard();
    renderTeamChips();
    renderBoard();
    renderLegend();
    renderPremiosBoard();
  });
