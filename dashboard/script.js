// Painel de Receita — Port Alder
// Lê a constante DADOS (definida em dados.js), aplica os filtros e atualiza
// ao mesmo tempo KPIs, gráficos e tabela. Todos os indicadores são calculados
// a partir de SOMAS (razão de somas), como no setor hoteleiro e nos notebooks.

// ---------- Constantes ----------
const ORDEM_TIER = ["luxury", "upscale", "boutique", "midscale", "economy"];
const CORES_TIER = {
  luxury: "#2a78d6",
  upscale: "#eb6834",
  boutique: "#1baf7a",
  midscale: "#eda100",
  economy: "#e87ba4",
};
const COR_BOM = "#2a78d6";
const COR_NEUTRO = "#b5b3ab";
const COR_RUIM = "#e34948";
const COR_CINZA_LINHA = "#898781";
const NOMES_MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const COR_SENTIMENTO = { positive: COR_BOM, mixed: COR_NEUTRO, negative: COR_RUIM };
const ROTULO_ACAO = { raise: "Aumentar", hold: "Manter", lower: "Reduzir" };
const NOME_CENARIO = {
  delight: "Estadia superou expectativas",
  location: "Localização e acesso",
  breakfast: "Café da manhã e comida",
  service_recovery: "Problema bem resolvido",
  room_condition: "Conservação do quarto",
  noise: "Barulho e sono",
  checkin_wait: "Fila no check-in",
  billing: "Cobranças",
  wifi: "Wi-fi",
  cleanliness: "Limpeza",
  group_trip: "Grupo ou família",
};

const formatoInteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const formatoDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatoDuasCasas = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoUSD = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const hoteisPorId = Object.fromEntries(DADOS.hoteis.map((h) => [h.id, h]));

const filtro = { ano: "todos", tier: "todos", hotel: "todos" };
const graficos = {};

// ---------- Funções de apoio ----------
const somar = (linhas, campo) => linhas.reduce((total, linha) => total + linha[campo], 0);

function formatarMilhoes(valor) {
  if (valor >= 1e6) return `${formatoDecimal.format(valor / 1e6)} mi`;
  return formatoInteiro.format(valor);
}

/** IDs dos hotéis que passam nos filtros de tier e hotel. */
function hoteisSelecionados() {
  return DADOS.hoteis
    .filter((h) => filtro.tier === "todos" || h.tier === filtro.tier)
    .filter((h) => filtro.hotel === "todos" || h.id === filtro.hotel)
    .map((h) => h.id);
}

/** Filtra qualquer tabela que tenha os campos h (hotel) e a (ano). */
function filtrar(linhas, ids) {
  return linhas.filter((l) => ids.includes(l.h) && (filtro.ano === "todos" || l.a === Number(filtro.ano)));
}

/** Indicadores de desempenho a partir das somas mensais. */
function indicadores(linhas) {
  const disp = somar(linhas, "disp");
  const vend = somar(linhas, "vend");
  const recQuartos = somar(linhas, "rec_q");
  const csVend = somar(linhas, "cs_vend");
  const ocupacao = vend / disp;
  const adr = recQuartos / vend;
  const revpar = recQuartos / disp;
  const csOcupacao = csVend / disp;
  const csAdr = somar(linhas, "cs_rec_q") / csVend;
  const csRevpar = somar(linhas, "cs_rec") / disp;
  return {
    receita: recQuartos + somar(linhas, "rec_x"),
    ocupacao,
    adr,
    revpar,
    rgi: (revpar / csRevpar) * 100,
    ari: (adr / csAdr) * 100,
    mpi: (ocupacao / csOcupacao) * 100,
  };
}

/** Resumo das avaliações: total, nota média e % de 1–2 estrelas. */
function resumoAvaliacoes(linhas) {
  const porNota = [1, 2, 3, 4, 5].map((n) => somar(linhas, `n${n}`));
  const total = porNota.reduce((a, b) => a + b, 0);
  const somaNotas = porNota.reduce((acc, qtd, i) => acc + qtd * (i + 1), 0);
  return {
    total,
    media: total ? somaNotas / total : null,
    pctRuins: total ? (porNota[0] + porNota[1]) / total : null,
  };
}

// ---------- Filtros ----------
function preencherFiltros() {
  const seletorTier = document.getElementById("filtro-tier");
  const seletorHotel = document.getElementById("filtro-hotel");

  ORDEM_TIER.forEach((tier) => seletorTier.add(new Option(tier, tier)));

  // Hotéis agrupados por tier (optgroup) para facilitar a escolha
  ORDEM_TIER.forEach((tier) => {
    const grupo = document.createElement("optgroup");
    grupo.label = tier;
    DADOS.hoteis.filter((h) => h.tier === tier).forEach((h) => grupo.appendChild(new Option(h.nome, h.id)));
    seletorHotel.appendChild(grupo);
  });

  const ligar = (id, chave) =>
    document.getElementById(id).addEventListener("change", (evento) => {
      filtro[chave] = evento.target.value;
      atualizarPainel();
    });
  ligar("filtro-ano", "ano");
  ligar("filtro-tier", "tier");
  ligar("filtro-hotel", "hotel");

  const limpar = () => {
    Object.assign(filtro, { ano: "todos", tier: "todos", hotel: "todos" });
    ["filtro-ano", "filtro-tier", "filtro-hotel"].forEach((id) => (document.getElementById(id).value = "todos"));
    atualizarPainel();
  };
  document.getElementById("limpar").addEventListener("click", limpar);
  document.getElementById("limpar-vazio").addEventListener("click", limpar);
}

// ---------- KPIs ----------
function atualizarKPIs(ind, avaliacoes) {
  document.getElementById("kpi-receita").textContent = `US$ ${formatarMilhoes(ind.receita)}`;
  document.getElementById("kpi-ocupacao").textContent = `${formatoDecimal.format(ind.ocupacao * 100)}%`;
  document.getElementById("kpi-adr").textContent = formatoUSD.format(ind.adr);
  document.getElementById("kpi-revpar").textContent = formatoUSD.format(ind.revpar);

  const elementoRgi = document.getElementById("kpi-rgi");
  elementoRgi.textContent = formatoDecimal.format(ind.rgi);
  elementoRgi.classList.toggle("abaixo", ind.rgi < 99.5);
  elementoRgi.classList.toggle("acima", ind.rgi > 100.5);
  let textoRgi = "na paridade com os concorrentes";
  if (ind.rgi < 99.5) textoRgi = `▼ ${formatoDecimal.format(100 - ind.rgi)}% abaixo dos concorrentes`;
  if (ind.rgi > 100.5) textoRgi = `▲ ${formatoDecimal.format(ind.rgi - 100)}% acima dos concorrentes`;
  document.getElementById("kpi-rgi-nota").textContent = textoRgi;

  document.getElementById("kpi-nota").textContent =
    avaliacoes.media === null ? "–" : `${formatoDuasCasas.format(avaliacoes.media)} ★`;
  document.getElementById("kpi-nota-sub").textContent =
    avaliacoes.total === 0
      ? "sem avaliações"
      : `${formatoDecimal.format(avaliacoes.pctRuins * 100)}% com 1–2 ★ · ${formatoInteiro.format(avaliacoes.total)} avaliações`;
}

// ---------- Gráficos ----------
// Plugin próprio: desenha as linhas de paridade (100) e o nome de cada hotel no mapa
const pluginPosicionamento = {
  id: "posicionamento",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    ctx.save();
    ctx.strokeStyle = COR_CINZA_LINHA;
    ctx.lineWidth = 1;
    const x100 = scales.x.getPixelForValue(100);
    const y100 = scales.y.getPixelForValue(100);
    ctx.beginPath();
    ctx.moveTo(x100, chartArea.top);
    ctx.lineTo(x100, chartArea.bottom);
    ctx.moveTo(chartArea.left, y100);
    ctx.lineTo(chartArea.right, y100);
    ctx.stroke();
    ctx.fillStyle = COR_CINZA_LINHA;
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("BARATO E CHEIO", chartArea.left + 6, chartArea.top + 4);
    ctx.textAlign = "right";
    ctx.fillText("CARO E CHEIO", chartArea.right - 6, chartArea.top + 4);
    ctx.textBaseline = "bottom";
    ctx.fillText("CARO E VAZIO", chartArea.right - 6, chartArea.bottom - 4);
    ctx.textAlign = "left";
    ctx.fillText("BARATO E VAZIO", chartArea.left + 6, chartArea.bottom - 4);
    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    // Escreve o nome ao lado de cada ponto. Se o nome colidir com outro já escrito
    // (ou sair do gráfico), tenta o lado esquerdo; se ainda colidir, omite
    // (o nome continua disponível no tooltip).
    const { ctx, chartArea } = chart;
    const ocupados = [];
    const colide = (r) =>
      r.x < chartArea.left || r.x + r.w > chartArea.right ||
      ocupados.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
    ctx.save();
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillStyle = "#3a3936";
    ctx.textBaseline = "middle";
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((ponto, j) => {
        const nome = dataset.data[j].nome;
        const w = ctx.measureText(nome).width;
        const opcoes = [{ x: ponto.x + 9, y: ponto.y - 7, w, h: 14 }, { x: ponto.x - 9 - w, y: ponto.y - 7, w, h: 14 }];
        const livre = opcoes.find((r) => !colide(r));
        if (livre) {
          ocupados.push(livre);
          ctx.fillText(nome, livre.x, ponto.y);
        }
      });
    });
    ctx.restore();
  },
};

function iniciarGraficos() {
  Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  Chart.defaults.color = "#52514e";
  Chart.defaults.borderColor = "#e1e0d9";
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.locale = "pt-BR";

  graficos.revpar = new Chart(document.getElementById("grafico-revpar"), {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatoUSD.format(c.parsed.y)}` } },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "RevPAR (USD)" } },
        x: { grid: { display: false } },
      },
    },
  });

  graficos.posicao = new Chart(document.getElementById("grafico-posicao"), {
    type: "scatter",
    data: { datasets: [] },
    plugins: [pluginPosicionamento],
    options: {
      layout: { padding: { right: 12 } },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (c) => {
              const p = c.raw;
              return `${p.nome} — preço ${formatoDecimal.format(p.x)}, ocupação ${formatoDecimal.format(p.y)}, RGI ${formatoDecimal.format(p.rgi)}`;
            },
          },
        },
      },
      scales: {
        x: { title: { display: true, text: "ARI: índice de preço (100 = paridade)" } },
        y: { title: { display: true, text: "MPI: índice de ocupação" } },
      },
    },
  });

  graficos.decisoes = new Chart(document.getElementById("grafico-decisoes"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (c) => `${c.dataset.label}: ${formatoDecimal.format(c.parsed.x)}% (${c.dataset.contagens[c.dataIndex]} semanas)`,
          },
        },
      },
      scales: {
        x: { stacked: true, max: 100, ticks: { callback: (v) => `${v}%` } },
        y: { stacked: true, grid: { display: false } },
      },
    },
  });

  graficos.cenarios = new Chart(document.getElementById("grafico-cenarios"), {
    type: "bar",
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${formatoInteiro.format(c.parsed.x)} avaliações · nota média ${formatoDuasCasas.format(c.dataset.notas[c.dataIndex])}`,
          },
        },
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: "Avaliações" } },
        y: { grid: { display: false } },
      },
    },
  });
}

function atualizarGraficoRevpar(mensal) {
  // Agrupa por ano-mês, somando as linhas de todos os hotéis selecionados
  const porMes = new Map();
  mensal.forEach((l) => {
    const chave = l.a * 100 + l.m;
    if (!porMes.has(chave)) porMes.set(chave, []);
    porMes.get(chave).push(l);
  });
  const chaves = [...porMes.keys()].sort((a, b) => a - b);
  const rotulos = chaves.map((k) => `${NOMES_MES[(k % 100) - 1]}/${String(Math.floor(k / 100)).slice(2)}`);
  const hotel = chaves.map((k) => somar(porMes.get(k), "rec_q") / somar(porMes.get(k), "disp"));
  const concorrentes = chaves.map((k) => somar(porMes.get(k), "cs_rec") / somar(porMes.get(k), "disp"));

  graficos.revpar.data.labels = rotulos;
  graficos.revpar.data.datasets = [
    { label: "Selecionados", data: hotel, borderColor: COR_BOM, backgroundColor: COR_BOM, borderWidth: 2, pointRadius: 2, tension: 0.25 },
    { label: "Concorrentes (comp set)", data: concorrentes, borderColor: COR_CINZA_LINHA, backgroundColor: COR_CINZA_LINHA, borderWidth: 2, borderDash: [6, 4], pointRadius: 0, tension: 0.25 },
  ];
  graficos.revpar.update();
}

function atualizarGraficoPosicao(mensal, ids) {
  const pontos = ids.map((id) => {
    const ind = indicadores(mensal.filter((l) => l.h === id));
    return { x: ind.ari, y: ind.mpi, rgi: ind.rgi, nome: hoteisPorId[id].nome, tier: hoteisPorId[id].tier };
  });
  graficos.posicao.data.datasets = ORDEM_TIER.filter((t) => pontos.some((p) => p.tier === t)).map((tier) => ({
    label: tier,
    data: pontos.filter((p) => p.tier === tier),
    backgroundColor: CORES_TIER[tier],
    borderColor: "#ffffff",
    borderWidth: 1.5,
    pointRadius: 7,
    pointHoverRadius: 9,
  }));
  // Eixos sempre incluem a linha 100 e deixam espaço para os nomes à direita
  const xs = pontos.map((p) => p.x).concat(100);
  const ys = pontos.map((p) => p.y).concat(100);
  const escalas = graficos.posicao.options.scales;
  escalas.x.min = Math.floor(Math.min(...xs) - 5);
  escalas.x.max = Math.ceil(Math.max(...xs) + 15);
  escalas.y.min = Math.floor(Math.min(...ys) - 1.5);
  escalas.y.max = Math.ceil(Math.max(...ys) + 1.5);
  graficos.posicao.update();
}

function atualizarGraficoDecisoes(decisoes) {
  const acoes = ["raise", "hold", "lower"];
  const resultados = [
    { chave: "better", rotulo: "Melhor", cor: COR_BOM },
    { chave: "in line", rotulo: "Igual (±1,5%)", cor: COR_NEUTRO },
    { chave: "worse", rotulo: "Pior", cor: COR_RUIM },
  ];
  const contar = (acao, res) => somar(decisoes.filter((d) => d.acao === acao && d.res === res), "n");
  const totais = acoes.map((a) => somar(decisoes.filter((d) => d.acao === a), "n"));

  graficos.decisoes.data.labels = acoes.map((a, i) => `${ROTULO_ACAO[a]} (n=${totais[i]})`);
  graficos.decisoes.data.datasets = resultados.map((r) => {
    const contagens = acoes.map((a) => contar(a, r.chave));
    return {
      label: r.rotulo,
      data: contagens.map((n, i) => (totais[i] ? (n / totais[i]) * 100 : 0)),
      contagens,
      backgroundColor: r.cor,
      borderColor: "#ffffff",
      borderWidth: 1,
    };
  });
  graficos.decisoes.update();
}

function atualizarGraficoCenarios(cenariosQtd) {
  const resumo = DADOS.cenarios
    .map((c) => {
      const linhas = cenariosQtd.filter((l) => l.c === c.id);
      const n = somar(linhas, "n");
      return { nome: NOME_CENARIO[c.id] || c.nome, sentimento: c.sentimento, n, nota: n ? somar(linhas, "soma") / n : 0 };
    })
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);

  graficos.cenarios.data.labels = resumo.map((c) => c.nome);
  graficos.cenarios.data.datasets = [{
    data: resumo.map((c) => c.n),
    notas: resumo.map((c) => c.nota),
    backgroundColor: resumo.map((c) => COR_SENTIMENTO[c.sentimento]),
    borderRadius: 3,
  }];
  graficos.cenarios.update();
}

// ---------- Tabela ----------
function atualizarTabela(mensal, avaliacoes, ids) {
  const linhas = ids
    .map((id) => ({
      hotel: hoteisPorId[id],
      ind: indicadores(mensal.filter((l) => l.h === id)),
      av: resumoAvaliacoes(avaliacoes.filter((l) => l.h === id)),
    }))
    .sort((a, b) => a.ind.rgi - b.ind.rgi);

  const corpo = document.querySelector("#tabela tbody");
  corpo.innerHTML = "";
  linhas.forEach(({ hotel, ind, av }) => {
    const tr = document.createElement("tr");
    const celulas = [
      [hotel.nome, ""],
      [hotel.tier, "tier"],
      [formatoDuasCasas.format(ind.receita / 1e6), "num"],
      [`${formatoDecimal.format(ind.ocupacao * 100)}%`, "num"],
      [formatoUSD.format(ind.adr), "num"],
      [formatoUSD.format(ind.revpar), "num"],
      [`${ind.rgi < 100 ? "⚠ " : ""}${formatoDecimal.format(ind.rgi)}`, ind.rgi < 100 ? "num alerta" : "num"],
      [av.media === null ? "–" : formatoDuasCasas.format(av.media), "num"],
      [av.pctRuins === null ? "–" : `${formatoDecimal.format(av.pctRuins * 100)}%`, "num"],
    ];
    celulas.forEach(([texto, classe]) => {
      const td = document.createElement("td");
      if (classe === "tier") {
        const etiqueta = document.createElement("span");
        etiqueta.className = "tier-tag";
        etiqueta.style.setProperty("--cor-tier", CORES_TIER[texto]);
        etiqueta.textContent = texto;
        td.appendChild(etiqueta);
      } else {
        td.textContent = texto;
        if (classe) td.className = classe;
      }
      tr.appendChild(td);
    });
    corpo.appendChild(tr);
  });
}

// ---------- Atualização geral ----------
function atualizarPainel() {
  const ids = hoteisSelecionados();
  const mensal = filtrar(DADOS.mensal, ids);
  const semDados = mensal.length === 0;

  document.getElementById("vazio").hidden = !semDados;
  document.getElementById("conteudo").hidden = semDados;

  const textoAno = filtro.ano === "todos" ? "2027 e 2028" : filtro.ano;
  document.getElementById("resumo-filtro").textContent = semDados
    ? ""
    : `Mostrando ${ids.length} ${ids.length === 1 ? "hotel" : "hotéis"} · ${textoAno}`;
  if (semDados) return;

  const avaliacoes = filtrar(DADOS.avaliacoes, ids);
  atualizarKPIs(indicadores(mensal), resumoAvaliacoes(avaliacoes));
  atualizarGraficoRevpar(mensal);
  atualizarGraficoPosicao(mensal, ids);
  atualizarGraficoDecisoes(filtrar(DADOS.decisoes, ids));
  atualizarGraficoCenarios(filtrar(DADOS.cenariosQtd, ids));
  atualizarTabela(mensal, avaliacoes, ids);
}

// ---------- Início ----------
document.getElementById("gerado-em").textContent = `Dados gerados em ${DADOS.geradoEm.split("-").reverse().join("/")}.`;
preencherFiltros();
iniciarGraficos();
atualizarPainel();
