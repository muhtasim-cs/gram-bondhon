/* ============================================================
   GRAM-BONDHON — INVESTOR DASHBOARD INTERACTIONS
   ============================================================ */

'use strict';

(function initProgressBars() {
  const items = document.querySelectorAll('.track-item');
  let total = 0;

  items.forEach(item => {
    const progress = parseInt(item.dataset.progress, 10) || 0;
    const bar = item.querySelector('.track-bar');
    if (bar) {
      requestAnimationFrame(() => {
        bar.style.width = progress + '%';
      });
    }
    total += progress;
  });

  const avgEl = document.getElementById('avgCompletion');
  if (avgEl && items.length > 0) {
    avgEl.textContent = Math.round(total / items.length) + '%';
  }
})();

(function initFilter() {
  const filter = document.getElementById('statusFilter');
  const items = document.querySelectorAll('.track-item');

  if (!filter) return;

  filter.addEventListener('change', () => {
    const selected = filter.value;

    items.forEach(item => {
      const status = item.dataset.status;
      const show = selected === 'all' || status === selected;
      item.style.display = show ? '' : 'none';
    });
  });
})();

(function initReportLinks() {
  document.querySelectorAll('.report-table a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      alert('Report download will be enabled after backend integration.');
    });
  });
})();

(function initTodayLabel() {
  const today = document.getElementById('dashToday');
  if (!today) return;

  const date = new Date();
  today.textContent = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
})();

(function initProvidedImages() {
  document.querySelectorAll('[data-provided]').forEach(img => {
    const provided = img.getAttribute('data-provided');
    if (!provided) return;

    const probe = new Image();
    probe.onload = () => {
      img.src = provided;
    };
    probe.src = provided;
  });
})();

(function initDashboardNav() {
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

(function initGnnsMap() {
  const mapEl = document.getElementById('gnnsMap');
  const label = document.getElementById('mapDistrictLabel');

  if (!mapEl || !label) return;

  if (typeof window.L === 'undefined') {
    label.textContent = 'Map unavailable: internet needed for live map tiles.';
    return;
  }

  const map = L.map('gnnsMap', {
    zoomControl: true,
    attributionControl: true
  }).setView([23.685, 90.3563], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const projects = [
    { name: 'Monsoon Paddy Harvest', district: 'Mymensingh', coords: [24.7471, 90.4203], status: 'On Track', completion: 90 },
    { name: 'Sustainable Poultry', district: 'Bogra', coords: [24.8465, 89.3776], status: 'On Track', completion: 65 },
    { name: 'Sylhet Bio-Fish Hatchery', district: 'Sylhet', coords: [24.8949, 91.8687], status: 'Needs Attention', completion: 42 },
    { name: 'Nakshi Kantha Collective', district: 'Rajshahi', coords: [24.3745, 88.6042], status: 'On Track', completion: 78 },
    { name: 'Jhuri Beti Bag Workshop', district: 'Tangail', coords: [24.2513, 89.9167], status: 'Needs Attention', completion: 55 }
  ];

  const markers = [];
  const statusColor = {
    'On Track': '#2d7860',
    'Needs Attention': '#d9a43d'
  };

  function setActive(marker, project) {
    markers.forEach(m => m.getElement()?.classList.remove('pin-active'));
    marker.getElement()?.classList.add('pin-active');
    label.textContent = 'Active district: ' + project.district;
  }

  projects.forEach((project, index) => {
    const marker = L.circleMarker(project.coords, {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: statusColor[project.status],
      fillOpacity: 0.92
    }).addTo(map);

    marker.bindPopup(
      '<div class="gnns-project-popup">' +
      '<h4>' + project.name + '</h4>' +
      '<p>' + project.district + ' | ' + project.status + ' | ' + project.completion + '% complete</p>' +
      '</div>'
    );

    marker.on('click', () => setActive(marker, project));
    markers.push(marker);

    if (index === 0) {
      setActive(marker, project);
    }
  });

  const bounds = L.latLngBounds(projects.map(p => p.coords));
  map.fitBounds(bounds.pad(0.25));
})();
