/* ================================================================
   GRAM-BONDHON — AI Market Analysis Engine
   ML Algorithms: Polynomial Regression, EMA, Seasonal Decomposition
   ================================================================ */

'use strict';

// ── Crop base data ──────────────────────────────────────────────
const CROP_DATA = {
  paddy: {
    label: 'Paddy (Rice)',
    basePrice: 1840,
    unit: '৳/40kg',
    seasonBoost: [1.0, 1.05, 1.12, 1.18, 1.10, 0.95, 0.88, 0.82, 0.90, 1.02, 1.08, 1.05],
    volatility: 0.06,
    demand: [82, 74, 68, 85, 91, 78, 65],
    riskFactors: { weather: 22, supply: 14, demand: 10, logistics: 8 },
    trend: 0.004,
  },
  poultry: {
    label: 'Poultry',
    basePrice: 185,
    unit: '৳/kg',
    seasonBoost: [1.10, 1.05, 0.98, 0.92, 0.95, 1.08, 1.15, 1.12, 1.05, 1.0, 1.02, 1.08],
    volatility: 0.09,
    demand: [65, 72, 80, 68, 55, 74, 88],
    riskFactors: { weather: 10, supply: 28, demand: 18, logistics: 12 },
    trend: 0.003,
  },
  fish: {
    label: 'Fish (Hilsa)',
    basePrice: 1200,
    unit: '৳/kg',
    seasonBoost: [0.70, 0.75, 0.80, 0.85, 1.20, 1.50, 1.60, 1.40, 1.10, 0.90, 0.80, 0.72],
    volatility: 0.14,
    demand: [90, 85, 78, 72, 88, 95, 82],
    riskFactors: { weather: 35, supply: 20, demand: 8, logistics: 15 },
    trend: 0.006,
  },
  vegetable: {
    label: 'Vegetables',
    basePrice: 42,
    unit: '৳/kg',
    seasonBoost: [1.20, 1.15, 1.00, 0.85, 0.80, 0.88, 0.95, 1.05, 1.15, 1.25, 1.30, 1.22],
    volatility: 0.18,
    demand: [75, 80, 88, 76, 65, 70, 78],
    riskFactors: { weather: 40, supply: 22, demand: 12, logistics: 18 },
    trend: 0.002,
  },
  jute: {
    label: 'Jute',
    basePrice: 3200,
    unit: '৳/maund',
    seasonBoost: [0.88, 0.90, 0.92, 0.95, 1.00, 1.10, 1.20, 1.18, 1.12, 1.05, 0.98, 0.92],
    volatility: 0.08,
    demand: [60, 65, 72, 78, 85, 88, 80],
    riskFactors: { weather: 18, supply: 30, demand: 20, logistics: 10 },
    trend: 0.001,
  },
};

const REGION_LABELS = ['Mymensingh', 'Bogra', 'Sylhet', 'Rajshahi', 'Tangail', 'Dhaka', 'Chattogram'];

// ── Seeded pseudo-random (reproducible results per crop+region) ─
function seededRand(seed) {
  let s = seed % 2147483647;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Generate 12 months of historical price data ─────────────────
function generateHistory(crop, seed) {
  const rand = seededRand(seed);
  const data = crop;
  const now = new Date(2026, 4, 1); // May 2026
  const prices = [];
  const labels = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mo = d.getMonth();
    const seasonal = data.seasonBoost[mo];
    const noise = 1 + (rand() - 0.5) * data.volatility * 2;
    const trendFactor = 1 + data.trend * (12 - i);
    const price = Math.round(data.basePrice * seasonal * noise * trendFactor);
    prices.push(price);
    labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
  }
  return { prices, labels };
}

// ── Polynomial Regression (degree 2) ────────────────────────────
function polyRegress(y) {
  const n = y.length;
  const x = y.map((_, i) => i);

  // Build normal equations for ax^2 + bx + c
  let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i]; sx2 += x[i] ** 2; sx3 += x[i] ** 3; sx4 += x[i] ** 4;
    sy += y[i]; sxy += x[i] * y[i]; sx2y += x[i] ** 2 * y[i];
  }

  // Solve 3x3 system via Gaussian elimination
  const A = [
    [n, sx, sx2, sy],
    [sx, sx2, sx3, sxy],
    [sx2, sx3, sx4, sx2y],
  ];
  for (let p = 0; p < 3; p++) {
    for (let r = p + 1; r < 3; r++) {
      const f = A[r][p] / A[p][p];
      for (let c = 0; c <= 3; c++) A[r][c] -= f * A[p][c];
    }
  }
  const coef = [0, 0, 0];
  for (let r = 2; r >= 0; r--) {
    coef[r] = A[r][3];
    for (let c = r + 1; c < 3; c++) coef[r] -= A[r][c] * coef[c];
    coef[r] /= A[r][r];
  }

  const predict = (xi) => coef[0] + coef[1] * xi + coef[2] * xi ** 2;

  // R² score
  const mean = sy / n;
  const ssTot = y.reduce((s, v) => s + (v - mean) ** 2, 0);
  const ssRes = y.reduce((s, v, i) => s + (v - predict(i)) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  return { predict, coef, r2 };
}

// ── Exponential Moving Average ───────────────────────────────────
function ema(data, period) {
  const k = 2 / (period + 1);
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

// ── RMSE ────────────────────────────────────────────────────────
function rmse(actual, predicted) {
  const n = actual.length;
  const sum = actual.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  return Math.sqrt(sum / n);
}

// ── MAE ─────────────────────────────────────────────────────────
function mae(actual, predicted) {
  const n = actual.length;
  return actual.reduce((s, v, i) => s + Math.abs(v - predicted[i]), 0) / n;
}

// ── Chart instances ─────────────────────────────────────────────
let priceChartInst = null;
let demandChartInst = null;
let maChartInst = null;
let radarChartInst = null;

function destroyChart(inst) {
  if (inst) { try { inst.destroy(); } catch (_) {} }
  return null;
}

(function initMarketNav() {
  const navbar = document.getElementById('navbar');
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const hamburger = document.getElementById('hamburger');
  const drawerClose = document.getElementById('drawerClose');

  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 60) {
        navbar.style.background = 'rgba(200, 221, 216, 0.97)';
        navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,.12)';
      } else {
        navbar.style.background = '#c8ddd8';
        navbar.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!drawer || !overlay || !hamburger || !drawerClose) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  window.closeDrawer = closeDrawer;
})();

// ── Main render function ─────────────────────────────────────────
function runAnalysis() {
  const cropKey = document.getElementById('cropSelect').value;
  const regionKey = document.getElementById('regionSelect').value;
  const horizon = parseInt(document.getElementById('horizonSelect').value);
  const crop = CROP_DATA[cropKey];

  const regionIdx = ['mymensingh','bogra','sylhet','rajshahi','tangail'].indexOf(regionKey);
  const seed = (cropKey.charCodeAt(0) * 31 + regionIdx * 17) || 42;

  showLoader(() => render(crop, seed, horizon));
}

function render(crop, seed, horizon) {
  const { prices, labels } = generateHistory(crop, seed);
  const n = prices.length;
  const reg = polyRegress(prices);

  // Fitted values
  const fitted = prices.map((_, i) => Math.round(reg.predict(i)));

  // Forecast: extend by horizon/7 weeks
  const weeks = Math.ceil(horizon / 7);
  const forecastPrices = [];
  const forecastLabels = [];
  const now = new Date(2026, 4, 1);
  for (let w = 1; w <= weeks; w++) {
    const xi = n - 1 + w * (30 / weeks / 2.5);
    const mo = new Date(now.getFullYear(), now.getMonth() + Math.floor(w * horizon / weeks / 30), 1).getMonth();
    const seasonal = crop.seasonBoost[mo];
    const base = reg.predict(xi);
    forecastPrices.push(Math.round(base * seasonal));
    const futureDate = new Date(now.getFullYear(), now.getMonth(), 1 + w * 7);
    forecastLabels.push(futureDate.toLocaleString('default', { month: 'short', day: 'numeric' }));
  }

  // EMA
  const ema7 = ema(prices, 7);
  const ema30 = ema(prices, 12);

  // Metrics
  const r2 = reg.r2;
  const rmseVal = rmse(prices, fitted);
  const maeVal = mae(prices, fitted);
  const mape = prices.reduce((s, v, i) => s + Math.abs((v - fitted[i]) / v), 0) / n * 100;

  // Render all
  renderPriceChart(prices, labels, fitted, forecastPrices, forecastLabels, crop);
  renderDemandChart(crop);
  renderMAChart(prices, labels, ema7, ema30);
  renderRadarChart(r2, rmseVal, maeVal, mape, crop);
  renderAIDecisions(prices, forecastPrices, crop, ema7, ema30);
  renderForecastTable(forecastPrices, forecastLabels, prices[n - 1]);
  renderRiskItems(crop);
  renderSeasonGrid(crop);
  renderMLMetrics(r2, rmseVal, maeVal, mape);
  updateStats(prices, forecastPrices, crop);
}

// ── Price Chart ─────────────────────────────────────────────────
function renderPriceChart(prices, labels, fitted, forecast, fcLabels, crop) {
  priceChartInst = destroyChart(priceChartInst);
  const ctx = document.getElementById('priceChart').getContext('2d');

  const allLabels = [...labels, ...fcLabels];
  const histData = [...prices, ...Array(fcLabels.length).fill(null)];
  const fittedData = [...fitted, ...Array(fcLabels.length).fill(null)];
  const fcData = [...Array(labels.length - 1).fill(null), prices[prices.length - 1], ...forecast];

  priceChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: [
        {
          label: 'Actual Price',
          data: histData,
          borderColor: '#2d7860',
          backgroundColor: 'rgba(45,120,96,.08)',
          borderWidth: 2,
          pointRadius: 3,
          fill: true,
          tension: 0.35,
        },
        {
          label: 'ML Regression Fit',
          data: fittedData,
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderDash: [4, 3],
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
        {
          label: 'AI Forecast',
          data: fcData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,.07)',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 3,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ৳${ctx.parsed.y?.toLocaleString() ?? '-'}`,
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: (v) => '৳' + v.toLocaleString(), font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,.05)' },
        },
        x: { ticks: { font: { size: 10 }, maxTicksLimit: 12 }, grid: { display: false } },
      },
    },
  });
}

// ── Demand Chart ────────────────────────────────────────────────
function renderDemandChart(crop) {
  demandChartInst = destroyChart(demandChartInst);
  const ctx = document.getElementById('demandChart').getContext('2d');
  const colors = crop.demand.map(v =>
    v >= 80 ? 'rgba(34,197,94,.7)' : v >= 65 ? 'rgba(245,158,11,.7)' : 'rgba(239,68,68,.7)'
  );
  demandChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: REGION_LABELS,
      datasets: [{
        label: 'Demand Index',
        data: crop.demand,
        backgroundColor: colors,
        borderRadius: 6,
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => ` Demand: ${c.parsed.y}/100` } },
      },
      scales: {
        y: { min: 0, max: 100, ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  });
}

// ── MA Chart ─────────────────────────────────────────────────────
function renderMAChart(prices, labels, ema7, ema30) {
  maChartInst = destroyChart(maChartInst);
  const ctx = document.getElementById('maChart').getContext('2d');
  maChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: 'rgba(100,116,139,.4)',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
        },
        {
          label: 'EMA 7-period',
          data: ema7.map(Math.round),
          borderColor: '#22c55e',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
        {
          label: 'EMA 12-period',
          data: ema30.map(Math.round),
          borderColor: '#ef4444',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } },
        tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ৳${c.parsed.y}` } },
      },
      scales: {
        y: { ticks: { callback: (v) => '৳' + v, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  });
}

// ── Radar Chart ──────────────────────────────────────────────────
function renderRadarChart(r2, rmseVal, maeVal, mape, crop) {
  radarChartInst = destroyChart(radarChartInst);
  const ctx = document.getElementById('radarChart').getContext('2d');

  const accuracy = Math.round(r2 * 100);
  const stability = Math.max(0, Math.round(100 - crop.volatility * 400));
  const confidence = Math.round(Math.max(0, 100 - mape * 2));
  const demandScore = Math.round(crop.demand.reduce((a, b) => a + b, 0) / crop.demand.length);
  const trendScore = Math.round(50 + crop.trend * 5000);

  radarChartInst = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Accuracy', 'Stability', 'Confidence', 'Demand', 'Trend'],
      datasets: [{
        label: 'Model Score',
        data: [accuracy, stability, confidence, demandScore, trendScore],
        backgroundColor: 'rgba(45,120,96,.18)',
        borderColor: '#2d7860',
        borderWidth: 2,
        pointBackgroundColor: '#2d7860',
        pointRadius: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(0,0,0,.08)' },
          pointLabels: { font: { size: 10 }, color: '#374151' },
        },
      },
    },
  });
}

// ── AI Decisions ─────────────────────────────────────────────────
function renderAIDecisions(prices, forecast, crop, ema7, ema30) {
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const e7 = ema7[ema7.length - 1];
  const e30 = ema30[ema30.length - 1];
  const fcAvg = forecast.reduce((a, b) => a + b, 0) / forecast.length;
  const pctChg = ((fcAvg - last) / last) * 100;

  let cropSignal, cropReason;
  if (e7 > e30 && pctChg > 3) {
    cropSignal = 'buy';
    cropReason = `Short-term EMA crossed above long-term EMA (bullish crossover). Forecast shows +${pctChg.toFixed(1)}% price increase. Strong buy signal.`;
  } else if (e7 < e30 && pctChg < -2) {
    cropSignal = 'sell';
    cropReason = `EMA death cross detected. Forecast shows ${pctChg.toFixed(1)}% price decline. Consider exiting positions.`;
  } else {
    cropSignal = 'hold';
    cropReason = `Price momentum is neutral. EMA signals are mixed. Wait for clearer direction before investing.`;
  }

  const demandAvg = crop.demand.reduce((a, b) => a + b, 0) / crop.demand.length;
  let demandSignal, demandReason;
  if (demandAvg >= 78) {
    demandSignal = 'buy';
    demandReason = `Average regional demand index is ${demandAvg.toFixed(0)}/100 — indicating strong market absorption capacity.`;
  } else if (demandAvg >= 65) {
    demandSignal = 'hold';
    demandReason = `Demand index at ${demandAvg.toFixed(0)}/100 is moderate. Monitor regional demand shifts before committing capital.`;
  } else {
    demandSignal = 'sell';
    demandReason = `Demand index at ${demandAvg.toFixed(0)}/100 is low. Oversupply risk present in multiple districts.`;
  }

  const riskTotal = Object.values(crop.riskFactors).reduce((a, b) => a + b, 0);
  let riskSignal, riskReason;
  if (riskTotal < 50) {
    riskSignal = 'buy';
    riskReason = `Composite risk score is ${riskTotal}/100 — low risk environment. Favorable for new investment positions.`;
  } else if (riskTotal < 75) {
    riskSignal = 'hold';
    riskReason = `Risk score ${riskTotal}/100 — moderate risk. Maintain current positions but avoid over-leveraging.`;
  } else {
    riskSignal = 'sell';
    riskReason = `High composite risk score of ${riskTotal}/100. Weather, supply, and logistics risks elevated.`;
  }

  const signals = [
    { type: cropSignal, title: 'Price Momentum Signal', reason: cropReason, conf: Math.round(60 + Math.abs(pctChg) * 2) },
    { type: demandSignal, title: 'Market Demand Signal', reason: demandReason, conf: Math.round(demandAvg * 0.9) },
    { type: riskSignal, title: 'Risk-Adjusted Signal', reason: riskReason, conf: Math.max(20, 100 - riskTotal) },
  ];

  document.getElementById('aiDecisionPanel').innerHTML = signals.map(s => `
    <div class="ai-rec ${s.type}">
      <div class="ai-rec-head">
        <span class="ai-rec-label">${s.type.toUpperCase()}</span>
        <h3>${s.title}</h3>
      </div>
      <p>${s.reason}</p>
      <div class="ai-conf">
        <div class="ai-conf-label">Confidence: ${Math.min(s.conf, 95)}%</div>
        <div class="ai-conf-bar"><div class="ai-conf-fill" style="width:${Math.min(s.conf, 95)}%"></div></div>
      </div>
    </div>
  `).join('');
}

// ── Forecast Table ───────────────────────────────────────────────
function renderForecastTable(forecast, labels, lastPrice) {
  const rows = forecast.map((p, i) => {
    const prev = i === 0 ? lastPrice : forecast[i - 1];
    const chg = ((p - prev) / prev) * 100;
    const lo = Math.round(p * 0.94);
    const hi = Math.round(p * 1.06);
    const cls = chg >= 1 ? 'ft-up' : chg <= -1 ? 'ft-down' : 'ft-neutral';
    const sign = chg >= 0 ? '+' : '';
    const signal = chg >= 2 ? '🟢 Buy' : chg <= -2 ? '🔴 Sell' : '🟡 Hold';
    return `<tr>
      <td>${labels[i]}</td>
      <td>৳${p.toLocaleString()}</td>
      <td>৳${lo.toLocaleString()}</td>
      <td>৳${hi.toLocaleString()}</td>
      <td class="${cls}">${sign}${chg.toFixed(1)}%</td>
      <td>${signal}</td>
    </tr>`;
  });
  document.getElementById('forecastTableBody').innerHTML = rows.join('');
}

// ── Risk Items ───────────────────────────────────────────────────
function renderRiskItems(crop) {
  const factors = [
    { key: 'weather', label: 'Weather / Climate Risk', icon: 'thunderstorm' },
    { key: 'supply', label: 'Supply Chain Risk', icon: 'local_shipping' },
    { key: 'demand', label: 'Demand Volatility', icon: 'trending_down' },
    { key: 'logistics', label: 'Logistics Risk', icon: 'warehouse' },
  ];
  document.getElementById('riskItems').innerHTML = factors.map(f => {
    const val = crop.riskFactors[f.key];
    const cls = val < 15 ? 'risk-low' : val < 25 ? 'risk-mid' : 'risk-high';
    const lbl = val < 15 ? 'Low' : val < 25 ? 'Medium' : 'High';
    return `<div class="risk-item ${cls}">
      <h4>${f.label}</h4>
      <div class="risk-bar-wrap"><div class="risk-bar-fill" style="width:${val}%"></div></div>
      <div class="risk-meta"><span>${lbl} Risk</span><span>${val}/100</span></div>
    </div>`;
  }).join('');
}

// ── Seasonality Grid ─────────────────────────────────────────────
function renderSeasonGrid(crop) {
  const seasons = [
    { label: 'Summer', months: 'Mar–May', icon: 'wb_sunny', cls: 'hot' },
    { label: 'Monsoon', months: 'Jun–Aug', icon: 'water_drop', cls: 'cool' },
    { label: 'Autumn', months: 'Sep–Nov', icon: 'park', cls: 'warm' },
    { label: 'Winter', months: 'Dec–Feb', icon: 'ac_unit', cls: 'cold' },
  ];
  const avgBoosts = [
    (crop.seasonBoost[2] + crop.seasonBoost[3] + crop.seasonBoost[4]) / 3,
    (crop.seasonBoost[5] + crop.seasonBoost[6] + crop.seasonBoost[7]) / 3,
    (crop.seasonBoost[8] + crop.seasonBoost[9] + crop.seasonBoost[10]) / 3,
    (crop.seasonBoost[11] + crop.seasonBoost[0] + crop.seasonBoost[1]) / 3,
  ];
  document.getElementById('seasonGrid').innerHTML = seasons.map((s, i) => {
    const pct = ((avgBoosts[i] - 1) * 100).toFixed(1);
    const trend = avgBoosts[i] >= 1.05 ? '▲ Peak' : avgBoosts[i] <= 0.95 ? '▼ Low' : '→ Normal';
    return `<div class="season-cell ${s.cls}">
      <span class="material-icons">${s.icon}</span>
      <h4>${s.label}</h4>
      <p>${s.months}</p>
      <p style="font-size:.72rem;font-weight:700;margin-top:.3rem">${pct >= 0 ? '+' : ''}${pct}%</p>
      <p style="font-size:.68rem;color:#6b7280">${trend}</p>
    </div>`;
  }).join('');
}

// ── ML Metrics ───────────────────────────────────────────────────
function renderMLMetrics(r2, rmseVal, maeVal, mape) {
  const metrics = [
    { label: 'R² Score', value: r2.toFixed(4), note: r2 > 0.85 ? 'Excellent fit' : r2 > 0.7 ? 'Good fit' : 'Moderate fit' },
    { label: 'RMSE', value: '৳' + Math.round(rmseVal), note: 'Root Mean Sq. Error' },
    { label: 'MAE', value: '৳' + Math.round(maeVal), note: 'Mean Absolute Error' },
    { label: 'MAPE', value: mape.toFixed(2) + '%', note: 'Mean Abs. Pct. Error' },
  ];
  document.getElementById('mlMetrics').innerHTML = metrics.map(m => `
    <div class="ml-info-item">
      <h4>${m.label}</h4>
      <p>${m.value}</p>
      <span style="font-size:.72rem;color:#6b7280">${m.note}</span>
    </div>
  `).join('');
}

// ── Update Stats ─────────────────────────────────────────────────
function updateStats(prices, forecast, crop) {
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  const fcAvg = forecast.reduce((a, b) => a + b, 0) / forecast.length;
  const priceChg = ((last - prev) / prev * 100).toFixed(1);
  const fcChg = ((fcAvg - last) / last * 100).toFixed(1);
  const demandAvg = Math.round(crop.demand.reduce((a, b) => a + b, 0) / crop.demand.length);
  const riskTotal = Object.values(crop.riskFactors).reduce((a, b) => a + b, 0);

  document.getElementById('statPrice').textContent = '৳ ' + last.toLocaleString();
  document.getElementById('statPriceChg').textContent = (priceChg >= 0 ? '+' : '') + priceChg + '%';
  document.getElementById('statForecast').textContent = '৳ ' + Math.round(fcAvg).toLocaleString();
  document.getElementById('statForecastChg').textContent = (fcChg >= 0 ? '+' : '') + fcChg + '%';
  document.getElementById('statDemand').textContent = demandAvg >= 78 ? 'High' : demandAvg >= 65 ? 'Medium' : 'Low';
  document.getElementById('statDemandPct').textContent = demandAvg + '%';
  document.getElementById('statRisk').textContent = riskTotal < 50 ? 'Low' : riskTotal < 75 ? 'Medium' : 'High';
  document.getElementById('statRiskVal').textContent = riskTotal + '/100';
}

// ── Loading animation ─────────────────────────────────────────────
function showLoader(cb) {
  const overlay = document.getElementById('aiLoading');
  const steps = ['step1', 'step2', 'step3', 'step4'];
  overlay.classList.add('show');
  steps.forEach(s => {
    const el = document.getElementById(s);
    el.classList.remove('done');
    el.querySelector('.material-icons').textContent = 'hourglass_empty';
  });

  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length) {
      const el = document.getElementById(steps[i]);
      el.classList.add('done');
      el.querySelector('.material-icons').textContent = 'check_circle';
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        overlay.classList.remove('show');
        cb();
      }, 300);
    }
  }, 350);
}

// ── Init ─────────────────────────────────────────────────────────
document.getElementById('runAiBtn').addEventListener('click', runAnalysis);

// Auto-run on page load
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(runAnalysis, 200);
});
