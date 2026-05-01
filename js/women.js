/* ================================================================
   GRAM-BONDHON — Women Empowerment Dashboard JS
   ================================================================ */

'use strict';

/* ── Navbar scroll + mobile drawer ─────────────────────────────── */
(function initNav() {
  const navbar   = document.getElementById('navbar');
  const drawer   = document.getElementById('mobileDrawer');
  const overlay  = document.getElementById('drawerOverlay');
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
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  window.closeDrawer = closeDrawer;
})();

/* ── KPI counter animation ──────────────────────────────────────── */
(function initCounters() {
  const targets = [
    { id: 'kpiWomen',    end: 1240,  prefix: '',  suffix: '' },
    { id: 'kpiTraining', end: 892,   prefix: '',  suffix: '' },
    { id: 'kpiProducts', end: 3480,  prefix: '',  suffix: '' },
  ];

  function animateCount(el, end, prefix, suffix) {
    const duration = 1800;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.round(eased * end).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      targets.forEach(t => {
        const el = document.getElementById(t.id);
        if (el) animateCount(el, t.end, t.prefix, t.suffix);
      });
      observer.disconnect();
    });
  }, { threshold: 0.3 });

  const kpis = document.querySelector('.women-kpis');
  if (kpis) observer.observe(kpis);
})();

/* ── Skills list ────────────────────────────────────────────────── */
(function initSkills() {
  const skills = [
    { name: 'Nakshi Kantha Stitching', icon: 'sewing',       pct: 88, enrolled: 320 },
    { name: 'Jute & Basket Weaving',   icon: 'all_inclusive',pct: 75, enrolled: 198 },
    { name: 'Organic Paddy Farming',   icon: 'agriculture',  pct: 70, enrolled: 215 },
    { name: 'Bio-Floc Fish Farming',   icon: 'water',        pct: 56, enrolled: 88  },
    { name: 'Poultry & Livestock',     icon: 'cruelty_free', pct: 67, enrolled: 174 },
    { name: 'Digital Marketplace',     icon: 'devices',      pct: 52, enrolled: 180 },
    { name: 'Financial Literacy',      icon: 'account_balance', pct: 81, enrolled: 412 },
  ];

  const container = document.getElementById('skillList');
  if (!container) return;

  skills.forEach(s => {
    container.insertAdjacentHTML('beforeend', `
      <div class="skill-item">
        <div class="skill-top">
          <span class="skill-name">
            <span class="material-icons">${s.icon}</span>${s.name}
          </span>
          <span class="skill-pct">${s.pct}%</span>
        </div>
        <div class="skill-bar-wrap">
          <div class="skill-bar-fill" data-pct="${s.pct}" style="width:0"></div>
        </div>
        <div class="skill-enrolled">${s.enrolled} women enrolled</div>
      </div>
    `);
  });

  // Animate bars on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      container.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
      observer.disconnect();
    });
  }, { threshold: 0.2 });
  observer.observe(container);
})();

/* ── Regional distribution ──────────────────────────────────────── */
const REGIONS = [
  { name: 'Rajshahi',    count: 285, color: '#9d4a8a' },
  { name: 'Mymensingh',  count: 240, color: '#c976b5' },
  { name: 'Tangail',     count: 195, color: '#e83e8c' },
  { name: 'Bogra',       count: 178, color: '#7c3d6e' },
  { name: 'Sylhet',      count: 142, color: '#a855f7' },
  { name: 'Dhaka',       count: 120, color: '#d946ef' },
  { name: 'Others',      count:  80, color: '#e879f9' },
];

(function initRegionList() {
  const container = document.getElementById('regionList');
  if (!container) return;

  const max = Math.max(...REGIONS.map(r => r.count));
  REGIONS.forEach(r => {
    const pct = Math.round(r.count / 1240 * 100);
    const barW = Math.round(r.count / max * 100);
    container.insertAdjacentHTML('beforeend', `
      <div class="region-item">
        <div class="region-top">
          <span class="region-name">
            <span class="region-dot" style="background:${r.color}"></span>${r.name}
          </span>
          <span class="region-count">${r.count} women</span>
        </div>
        <div class="region-bar-wrap">
          <div class="region-bar-fill" data-w="${barW}" style="width:0; background:${r.color}"></div>
        </div>
        <div class="region-pct">${pct}% of total</div>
      </div>
    `);
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      container.querySelectorAll('.region-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.w + '%';
      });
      observer.disconnect();
    });
  }, { threshold: 0.2 });
  observer.observe(container);
})();

/* ── Active Women Members ───────────────────────────────────────── */
(function initMembers() {
  const members = [
    { name: 'Fatema Begum',   skill: 'Nakshi Kantha',   district: 'Rajshahi',   before: 2200, after: 9500  },
    { name: 'Roksana Khatun', skill: 'Basket Weaving',  district: 'Tangail',    before: 1800, after: 7800  },
    { name: 'Amena Akter',    skill: 'Embroidery',      district: 'Mymensingh', before: 1500, after: 6200  },
    { name: 'Sumaiya Parvin', skill: 'Organic Farming', district: 'Bogra',      before: 2800, after: 11200 },
    { name: 'Nasrin Sultana', skill: 'Fish Farming',    district: 'Sylhet',     before: 2100, after: 8900  },
    { name: 'Parveen Nahar',  skill: 'Kantha Craft',    district: 'Rajshahi',   before: 1900, after: 7400  },
    { name: 'Monira Islam',   skill: 'Poultry Farming', district: 'Bogra',      before: 2400, after: 9100  },
    { name: 'Shilpi Rani',    skill: 'Fin. Literacy',   district: 'Dhaka',      before: 3000, after: 8600  },
  ];

  const grid = document.getElementById('memberGrid');
  if (!grid) return;

  members.forEach(m => {
    const initials = m.name.split(' ').map(w => w[0]).join('');
    const growth = Math.round((m.after - m.before) / m.before * 100);
    grid.insertAdjacentHTML('beforeend', `
      <div class="member-card">
        <div class="member-avatar">${initials}</div>
        <div class="member-name">${m.name}</div>
        <span class="member-skill">${m.skill}</span>
        <div class="member-location">
          <span class="material-icons">location_on</span>${m.district}
        </div>
        <div class="member-income">
          ৳ ${m.before.toLocaleString()} → <strong>৳ ${m.after.toLocaleString()}</strong>
          <br><strong>+${growth}% income growth</strong>
        </div>
      </div>
    `);
  });
})();

/* ── Chart: Income Growth Line ──────────────────────────────────── */
(function initIncomeChart() {
  const ctx = document.getElementById('incomeChart');
  if (!ctx) return;

  const labels = ['Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26'];
  const before = [2690, 2690, 2690, 2690, 2690, 2690, 2690, 2690, 2690, 2690, 2690, 2690];
  const after  = [2900, 3500, 4100, 4800, 5400, 6000, 6500, 7000, 7400, 7900, 8200, 8450];
  const target = [null,  null,  null,  null,  null,  null,  null,  null,  null,  null,  null, 8450, 9000, 10200, 12000, 14000];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Before Gram-Bondhon',
          data: before,
          borderColor: '#9ca3af',
          borderDash: [5, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
        {
          label: 'After Gram-Bondhon',
          data: after,
          borderColor: '#9d4a8a',
          backgroundColor: 'rgba(157,74,138,.1)',
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#9d4a8a',
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ৳${c.parsed.y?.toLocaleString() ?? '-'}` } },
      },
      scales: {
        y: {
          ticks: { callback: v => '৳' + v.toLocaleString(), font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,.05)' },
        },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  });
})();

/* ── Chart: Enrolments Bar ──────────────────────────────────────── */
(function initEnrolChart() {
  const ctx = document.getElementById('enrolChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jun 25','Jul 25','Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26'],
      datasets: [{
        label: 'New Enrolments',
        data: [42, 58, 74, 88, 96, 105, 118, 132, 88, 110, 140, 189],
        backgroundColor: 'rgba(157,74,138,.75)',
        borderRadius: 6,
        borderWidth: 0,
        hoverBackgroundColor: 'rgba(157,74,138,1)',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.parsed.y} women joined` } },
      },
      scales: {
        y: { ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,.05)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } },
      },
    },
  });
})();

/* ── Chart: Region Doughnut ─────────────────────────────────────── */
(function initRegionChart() {
  const ctx = document.getElementById('regionChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: REGIONS.map(r => r.name),
      datasets: [{
        data: REGIONS.map(r => r.count),
        backgroundColor: REGIONS.map(r => r.color),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed} women` } },
      },
    },
  });
})();

/* ── Chart: Sector Investment Donut ─────────────────────────────── */
(function initSectorChart() {
  const ctx = document.getElementById('sectorChart');
  if (!ctx) return;

  const sectors = [
    { label: 'Handicrafts & Weaving', value: 38, color: '#9d4a8a' },
    { label: 'Organic Farming',        value: 26, color: '#22c55e' },
    { label: 'Fish Farming',           value: 16, color: '#3b82f6' },
    { label: 'Poultry & Livestock',    value: 12, color: '#f59e0b' },
    { label: 'Digital & Training',     value:  8, color: '#e83e8c' },
  ];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sectors.map(s => s.label),
      datasets: [{
        data: sectors.map(s => s.value),
        backgroundColor: sectors.map(s => s.color),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 10, padding: 8 } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}%` } },
      },
    },
  });
})();
