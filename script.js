// ---------------------------------------------------------------------------
// Placar Campanha Varejo — logica da aplicacao
// Dados dos vendedores ficam em data.json (carregado no fetch abaixo)
// ---------------------------------------------------------------------------

let DATA = []; // carregado de data.json via fetch()

const INDUSTRIAS = ["PANASONIC", "INGLEZA", "AB MAURI"];
const IND_LABEL = { PANASONIC: "Panasonic", INGLEZA: "Ingleza", "AB MAURI": "AB Mauri" };
const EQUIPES = ["Washignton", "Rodrigo", "Sueli"];
const TEAM_COLOR = { Washignton: "#1E7145", Rodrigo: "#B8620A", Sueli: "#A33B3B" };
const PERIODO = "01/07 – 13/07/2026 (mês em andamento)";
document.getElementById("periodoLabel").textContent = PERIODO;

const PREMIO_POR_INDUSTRIA = 100;
const PREMIO_VENDEDOR_3_INDUSTRIAS = 500;
const PREMIO_SUPERVISOR_3_INDUSTRIAS = 300;

/* Regra: vendedor ganha R$100 por indústria batida (meta >= 100%); batendo as 3, o
   prêmio sobe para R$500. Supervisor só ganha (R$300) se a equipe bater as 3. */
function calcPremio(pessoa) {
  const industriasBatidas = INDUSTRIAS.filter(ind => pessoa.industrias[ind].pct >= 100);
  const qtd = industriasBatidas.length;
  const valor = pessoa.isSupervisor
    ? (qtd === 3 ? PREMIO_SUPERVISOR_3_INDUSTRIAS : 0)
    : (qtd === 3 ? PREMIO_VENDEDOR_3_INDUSTRIAS : qtd * PREMIO_POR_INDUSTRIA);
  return { industriasBatidas, qtd, valor };
}

let abaAtiva = "PANASONIC";
let busca = "";
let equipeFiltro = "Todas";
let rankAba = "PANASONIC";
let secaoAtiva = "placar";

function pctColor(pct) {
  if (pct >= 100) return "#1E7145";
  if (pct >= 60) return "#B8860B";
  return "#A33B3B";
}
function fmt0(n) { return Math.round(n).toLocaleString("pt-BR"); }
function fmtMoney(n) { return "R$ " + Math.round(n).toLocaleString("pt-BR"); }

/* ================= NAV DE SECOES ================= */
function renderSecNav() {
  const secs = [
    { key: "placar", label: "Placar" },
    { key: "buscar", label: "Buscar" },
    { key: "ranking", label: "Ranking" },
    { key: "financeiro", label: "Financeiro" },
    { key: "relatorios", label: "Relat." },
    { key: "premios", label: "Prêmios" },
  ];
  document.getElementById("secNav").innerHTML = secs.map(s => `
    <div class="item ${secaoAtiva === s.key ? "active" : ""}" onclick="setSecao('${s.key}')">${s.label}</div>
  `).join("");
}
function setSecao(key) {
  secaoAtiva = key;
  renderSecNav();
  ["placar", "buscar", "ranking", "financeiro", "relatorios", "premios"].forEach(k => {
    document.getElementById("sec-" + k).classList.toggle("active", k === key);
  });
}

/* ================= SECAO PLACAR ================= */
function renderTabs() {
  const tabs = [
    { key: "PANASONIC", label: "Panasonic" },
    { key: "INGLEZA", label: "Ingleza" },
    { key: "AB MAURI", label: "AB Mauri" },
  ];
  document.getElementById("tabsContainer").innerHTML = tabs.map(t => `
    <div class="tab ${abaAtiva === t.key ? "active" : ""}" onclick="setAba('${t.key}')">
      ${t.label}${t.sub ? `<small>${t.sub}</small>` : ""}
    </div>
  `).join("");
}
function setAba(key) {
  abaAtiva = key;
  renderTabs(); renderScoreboard(); renderBoard();
}
function renderScoreboard() {
  const supervisores = DATA.filter(r => r.isSupervisor);
  document.getElementById("scoreboard").innerHTML = supervisores.map(sup => {
    const d = sup.industrias[abaAtiva];
    const real = d.projetado, meta = d.metaNova, pct = d.pct;
    const p = calcPremio(sup);
    return `
      <div class="score-row">
        <div class="score-flag" style="background:${TEAM_COLOR[sup.equipe]}"></div>
        <div class="score-info">
          <div class="score-team">Equipe ${sup.nome}</div>
          <div class="score-nums"><b class="num">${fmt0(real)}</b> / ${fmt0(meta)} meta · Fat. ${d.faturado} · A Fat. ${d.naoFaturado}</div>
          <div class="score-premio">Prêmio da equipe (3 indústrias): <b style="color:${p.valor > 0 ? "var(--green)" : "var(--ink-soft)"}">${fmtMoney(p.valor)}</b></div>
          <div class="score-track"><div class="score-fill" style="width:${Math.min(pct,100)}%;background:${pctColor(pct)}"></div></div>
        </div>
        <div class="score-pct num" style="color:${pctColor(pct)}">${fmt0(pct)}%</div>
      </div>
    `;
  }).join("");
}
function renderTeamChips() {
  const chips = [{ key: "Todas", label: "Todas" }, ...EQUIPES.map(e => ({ key: e, label: e }))];
  document.getElementById("teamChips").innerHTML = chips.map(c => `
    <div class="chip ${equipeFiltro === c.key ? "active" : ""}" onclick="setEquipe('${c.key}')">${c.label}</div>
  `).join("");
}
function setEquipe(eq) { equipeFiltro = eq; renderTeamChips(); renderBoard(); }
function getLinhas() {
  let rows = DATA.filter(r => !r.isSupervisor);
  if (equipeFiltro !== "Todas") rows = rows.filter(r => r.equipe === equipeFiltro);
  if (busca.trim()) {
    const q = busca.trim().toLowerCase();
    rows = rows.filter(r => r.nome.toLowerCase().includes(q) || String(r.setor).includes(q));
  }
  rows = [...rows].sort((a, b) => b.industrias[abaAtiva].pct - a.industrias[abaAtiva].pct);
  return rows;
}
function toggleRow(setor) { const el = document.getElementById("vrow-" + setor); if (el) el.classList.toggle("open"); }
function vendorRowHTML(r, pos, aba) {
  const badgeClass = pos === 1 ? "gold" : pos === 2 ? "silver" : pos === 3 ? "bronze" : "";
  const d = r.industrias[aba];
  const pctVal = d.pct;
  const mainNum = fmt0(pctVal) + "%";
  const track = `<div class="vtrack"><div class="vfill" style="width:${Math.min(pctVal,100)}%;background:${pctColor(pctVal)}"></div></div>`;
  const p = calcPremio(r);
  const detail = `
    <div><div class="k">Meta</div><div class="v">${fmt0(d.metaNova)}</div></div>
    <div><div class="k">Realizado</div><div class="v">${d.projetado}</div></div>
    <div><div class="k">Faturado</div><div class="v">${d.faturado}</div></div>
    <div><div class="k">A Faturar</div><div class="v">${d.naoFaturado}</div></div>
    <div class="premio-full">
      <div class="k">Prêmio (${p.qtd}/3 indústrias batidas)</div>
      <div class="v" style="color:${p.valor > 0 ? "var(--green)" : "var(--ink-soft)"}">${fmtMoney(p.valor)}</div>
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
    : rows.map((r, i) => vendorRowHTML(r, i + 1, abaAtiva)).join("");
  document.getElementById("countLabel").textContent = `${rows.length} de ${DATA.filter(r=>!r.isSupervisor).length}`;
}
function renderLegend() {
  document.getElementById("legendText").innerHTML =
    "Toque em um vendedor para ver Meta, Realizado, Faturado e A Faturar daquela indústria. Meta = Meta Atual × 1,3. " +
    "Valores em R$ ficam na aba <b>Financeiro</b>.";
}
function exportCSV() {
  const headers = ["Setor", "Vendedor", "Equipe"];
  INDUSTRIAS.forEach(ind => headers.push(`${ind} Meta`, `${ind} Realizado`, `${ind} Faturado`, `${ind} A Faturar`, `${ind} %`));
  const lines = [headers.join(";")];
  DATA.forEach(r => {
    const line = [r.setor, r.nome, r.equipe];
    INDUSTRIAS.forEach(ind => {
      const d = r.industrias[ind];
      line.push(Math.round(d.metaNova), d.projetado, d.faturado, d.naoFaturado, Math.round(d.pct) + "%");
    });
    lines.push(line.join(";"));
  });
  downloadCSV(lines, "placar_campanha_varejo.csv");
}
function downloadCSV(lines, filename) {
  const csv = "\uFEFF" + lines.join("\n");
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

/* ================= SECAO BUSCAR ================= */
function renderBuscarSetores() {
  const sel = document.getElementById("buscarSetor");
  sel.innerHTML = DATA.map(r => `<option value="${r.setor}">${r.setor} — ${r.nome}${r.isSupervisor ? " (equipe)" : ""}</option>`).join("");
}
function renderBuscarResultado() {
  const setor = parseInt(document.getElementById("buscarSetor").value);
  const r = DATA.find(x => x.setor === setor);
  if (!r) return;

  const rows = INDUSTRIAS.map(ind => {
    const d = r.industrias[ind];
    const falta = Math.max(d.metaNova - d.projetado, 0);
    const faltaHTML = falta <= 0
      ? `<span class="falta-ok">bateu ✓</span>`
      : `<span class="falta-pend">${fmt0(falta)}</span>`;
    return `
      <tr>
        <td class="ind-name">${IND_LABEL[ind]}</td>
        <td class="big-num">${fmt0(d.metaNova)}</td>
        <td class="big-num">${d.projetado}</td>
        <td>${d.faturado}</td>
        <td>${d.naoFaturado}</td>
        <td>${faltaHTML}</td>
        <td style="color:${pctColor(d.pct)};font-weight:700">${fmt0(d.pct)}%</td>
      </tr>
    `;
  }).join("");

  document.getElementById("resultCard").innerHTML = `
    <div class="result-card">
      <div class="rname">${r.nome}${r.isSupervisor ? " (equipe)" : ""}</div>
      <div class="rteam" style="color:${TEAM_COLOR[r.equipe]}">${r.equipe} · Setor ${r.setor}</div>
      <table class="compare">
        <thead><tr><th>Indústria</th><th>Meta</th><th>Realiz.</th><th>Fat.</th><th>A Fat.</th><th>Falta</th><th>%</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ================= SECAO RANKING ================= */
function renderRankTabs() {
  const tabs = [
    { key: "PANASONIC", label: "Panasonic" },
    { key: "INGLEZA", label: "Ingleza" },
    { key: "AB MAURI", label: "AB Mauri" },
  ];
  document.getElementById("rankTabs").innerHTML = tabs.map(t => `
    <div class="tab ${rankAba === t.key ? "active" : ""}" onclick="setRankAba('${t.key}')">${t.label}</div>
  `).join("");
}
function setRankAba(key) { rankAba = key; renderRankTabs(); renderRankBoard(); }
function renderRankBoard() {
  const vendedores = DATA.filter(r => !r.isSupervisor);
  const rows = [...vendedores].sort((a, b) => b.industrias[rankAba].pct - a.industrias[rankAba].pct);
  document.getElementById("rankBoard").innerHTML = rows.map((r, i) => vendorRowHTML(r, i + 1, rankAba)).join("");
  document.getElementById("rankCount").textContent = `${rows.length} vendedores`;
  document.getElementById("rankLabel").textContent = `Ranking — % atingido (${IND_LABEL[rankAba]})`;
}
function exportRankingCSV() {
  const vendedores = DATA.filter(r => !r.isSupervisor);
  const rows = [...vendedores].sort((a, b) => b.industrias[rankAba].pct - a.industrias[rankAba].pct);
  const headers = ["Posição", "Setor", "Vendedor", "Equipe", "Meta", "Faturado", "A Faturar", "Realizado", "%"];
  const lines = [headers.join(";")];
  rows.forEach((r, i) => {
    const d = r.industrias[rankAba];
    lines.push([i + 1, r.setor, r.nome, r.equipe, Math.round(d.metaNova), d.faturado, d.naoFaturado, d.projetado, Math.round(d.pct) + "%"].join(";"));
  });
  downloadCSV(lines, `ranking_${rankAba.toLowerCase().replace(" ", "_")}.csv`);
}

/* ================= SECAO FINANCEIRO (por industria, sem somar) ================= */
let finAba = "PANASONIC";
function renderFinTabs() {
  const tabs = [
    { key: "PANASONIC", label: "Panasonic" },
    { key: "INGLEZA", label: "Ingleza" },
    { key: "AB MAURI", label: "AB Mauri" },
  ];
  document.getElementById("finTabs").innerHTML = tabs.map(t => `
    <div class="tab ${finAba === t.key ? "active" : ""}" onclick="setFinAba('${t.key}')">${t.label}</div>
  `).join("");
}
function setFinAba(key) { finAba = key; renderFinTabs(); renderFinTable(); }
function renderFinTable() {
  const vendedores = DATA.filter(r => !r.isSupervisor)
    .sort((a,b) => TEAM_ORDER(a.equipe)-TEAM_ORDER(b.equipe) || a.nome.localeCompare(b.nome));
  const rows = vendedores.map(r => {
    const d = r.industrias[finAba];
    return `<tr><td>${r.setor}</td><td class="left">${r.nome}</td><td>${r.equipe}</td><td>${fmtMoney(d.valorFaturado)}</td><td>${fmtMoney(d.valorAFaturar)}</td></tr>`;
  }).join("");
  document.getElementById("finTable").innerHTML = `
    <thead><tr><th>Setor</th><th class="left">Vendedor</th><th>Equipe</th><th>Faturado (R$)</th><th>A Faturar (R$)</th></tr></thead>
    <tbody>${rows}</tbody>
  `;
}
function exportFinanceiroCSV() {
  const vendedores = DATA.filter(r => !r.isSupervisor);
  const headers = ["Setor", "Vendedor", "Equipe", "Valor Faturado (R$)", "Valor A Faturar (R$)"];
  const lines = [headers.join(";")];
  vendedores.forEach(r => {
    const d = r.industrias[finAba];
    lines.push([r.setor, r.nome, r.equipe, d.valorFaturado.toFixed(2), d.valorAFaturar.toFixed(2)].join(";"));
  });
  downloadCSV(lines, `financeiro_${finAba.toLowerCase().replace(" ", "_")}.csv`);
}

/* ================= SECAO RELATORIOS (por fornecedor) ================= */
function renderSupplierButtons() {
  document.getElementById("supplierButtons").innerHTML = INDUSTRIAS.map(ind => `
    <div class="supplier-btn" onclick="showSupplierReport('${ind}')">
      <div>
        <div class="sname">${IND_LABEL[ind]}</div>
        <div class="scount">${DATA.filter(r=>!r.isSupervisor).length} vendedores · ver relatório completo</div>
      </div>
      <div class="sicon">›</div>
    </div>
  `).join("");
}
function showSupplierReport(ind) {
  const vendedores = DATA.filter(r => !r.isSupervisor).sort((a,b) => TEAM_ORDER(a.equipe)-TEAM_ORDER(b.equipe) || a.nome.localeCompare(b.nome));
  const rows = vendedores.map(r => {
    const d = r.industrias[ind];
    return `<tr><td>${r.setor}</td><td class="left">${r.nome}</td><td>${r.equipe}</td><td>${fmt0(d.metaNova)}</td><td>${d.faturado}</td><td>${d.naoFaturado}</td><td>${d.projetado}</td><td style="color:${pctColor(d.pct)};font-weight:700">${fmt0(d.pct)}%</td></tr>`;
  }).join("");
  document.getElementById("supplierReport").innerHTML = `
    <div class="card">
      <h2>Relatório — ${IND_LABEL[ind]}</h2>
      <div class="legend" style="margin:0 0 8px;">Período: ${PERIODO}</div>
      <table class="report">
        <thead><tr><th>Setor</th><th class="left">Vendedor</th><th>Equipe</th><th>Meta</th><th>Faturado</th><th>A Faturar</th><th>Realizado</th><th>%</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="actions no-print" style="margin-top:14px;">
        <button class="btn" onclick="exportSupplierCSV('${ind}')">⬇ Excel (CSV)</button>
        <button class="btn primary" onclick="window.print()">🖶 Enviar / Imprimir</button>
      </div>
    </div>
  `;
}
function TEAM_ORDER(eq) { return { Washignton: 0, Rodrigo: 1, Sueli: 2 }[eq]; }
function exportSupplierCSV(ind) {
  const vendedores = DATA.filter(r => !r.isSupervisor);
  const headers = ["Setor", "Vendedor", "Equipe", "Meta", "Faturado", "Não Faturado", "Realizado", "%"];
  const lines = [headers.join(";")];
  vendedores.forEach(r => {
    const d = r.industrias[ind];
    lines.push([r.setor, r.nome, r.equipe, Math.round(d.metaNova), d.faturado, d.naoFaturado, d.projetado, Math.round(d.pct) + "%"].join(";"));
  });
  downloadCSV(lines, `relatorio_${ind.toLowerCase().replace(" ", "_")}.csv`);
}

/* ================= SECAO PREMIOS ================= */
function getPremiosRows() {
  const rows = DATA.map(r => ({ r, p: calcPremio(r) }));
  rows.sort((a, b) => b.p.valor - a.p.valor || a.r.nome.localeCompare(b.r.nome));
  return rows;
}
function premioRowHTML(item, pos) {
  const { r, p } = item;
  const marks = INDUSTRIAS.map(ind => {
    const bateu = r.industrias[ind].pct >= 100;
    return `<span class="premio-ind ${bateu ? "ok" : "no"}">${IND_LABEL[ind]} ${bateu ? "✓" : "—"}</span>`;
  }).join("");
  return `
    <div class="vrow ${r.isSupervisor ? "sup" : ""}" style="cursor:default;">
      <div class="vrow-top">
        <div class="pos-badge">${pos}</div>
        <div class="vname">
          <div class="n">${r.nome}${r.isSupervisor ? " (equipe)" : ""}</div>
          <div class="t" style="color:${TEAM_COLOR[r.equipe]}">${r.equipe}${r.isSupervisor ? "" : " · Setor " + r.setor}</div>
        </div>
        <div class="vpct num" style="color:${p.valor > 0 ? "var(--green)" : "var(--ink-soft)"}">${fmtMoney(p.valor)}</div>
      </div>
      <div class="premio-marks">${marks}</div>
    </div>
  `;
}
function renderPremiosBoard() {
  const rows = getPremiosRows();
  document.getElementById("premiosBoard").innerHTML = rows.map((item, i) => premioRowHTML(item, i + 1)).join("");
  document.getElementById("premiosCount").textContent = `${rows.length} participantes`;
  const totalGeral = rows.reduce((s, x) => s + x.p.valor, 0);
  const totalVendedores = rows.filter(x => !x.r.isSupervisor && x.p.valor > 0).length;
  document.getElementById("premiosTotal").innerHTML = `
    <div>Ganhadores<b>${totalVendedores} de ${DATA.filter(r=>!r.isSupervisor).length} vendedores</b></div>
    <div>Total a pagar<b>${fmtMoney(totalGeral)}</b></div>
  `;
}
function exportPremiosCSV() {
  const rows = getPremiosRows();
  const headers = ["Posição", "Setor", "Nome", "Tipo", "Equipe", ...INDUSTRIAS.map(i => IND_LABEL[i] + " batida"), "Prêmio (R$)"];
  const lines = [headers.join(";")];
  rows.forEach((item, i) => {
    const { r, p } = item;
    const marks = INDUSTRIAS.map(ind => (r.industrias[ind].pct >= 100 ? "Sim" : "Não"));
    lines.push([i + 1, r.setor, r.nome, r.isSupervisor ? "Supervisor" : "Vendedor", r.equipe, ...marks, p.valor.toFixed(2)].join(";"));
  });
  downloadCSV(lines, "premios_campanha_varejo.csv");
}

/* ================= INICIALIZACAO ================= */
fetch("data.json")
  .then(r => r.json())
  .then(data => {
    DATA = data;
        document.getElementById("buscaInput").addEventListener("input", e => { busca = e.target.value; renderBoard(); });
    document.getElementById("buscarSetor").addEventListener("change", renderBuscarResultado);
    
    renderSecNav();
    renderTabs();
    renderScoreboard();
    renderTeamChips();
    renderBoard();
    renderLegend();
    renderBuscarSetores();
    renderBuscarResultado();
    renderRankTabs();
    renderRankBoard();
    renderFinTabs();
    renderFinTable();
    renderSupplierButtons();
    renderPremiosBoard();
  });


