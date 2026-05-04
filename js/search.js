/* ============================================================
   GRAM-BONDHON — MOBILE SEARCH
   Live search across projects, sections, pages
   ============================================================ */

(function initMobileSearch() {
  const input   = document.getElementById('mobileSearchInput');
  const clearBtn = document.getElementById('mobileSearchClear');
  const results  = document.getElementById('mobileSearchResults');
  if (!input || !results) return;

  /* ---- Search index: built from DOM + static entries ---- */
  function buildIndex() {
    const items = [];

    // Project cards (present on index.html)
    document.querySelectorAll('.project-card').forEach(card => {
      const title    = card.querySelector('h3')?.textContent.trim() || '';
      const location = card.querySelector('.project-location')?.textContent.trim() || '';
      const amount   = card.querySelector('.project-amount')?.textContent.trim() || '';
      const badge    = card.querySelector('.funded-badge')?.textContent.trim() || '';
      if (!title) return;
      items.push({
        type: 'project',
        icon: 'agriculture',
        title,
        sub: `${location} · ${badge} · ${amount}`,
        action: () => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.outline = '2px solid var(--green)';
          setTimeout(() => card.style.outline = '', 2000);
        }
      });
    });

    // Step cards (How it Works)
    document.querySelectorAll('.step-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent.trim() || '';
      if (!title) return;
      items.push({
        type: 'section',
        icon: 'info_outline',
        title,
        sub: 'How It Works',
        action: () => card.scrollIntoView({ behavior: 'smooth', block: 'center' })
      });
    });

    // Static page links
    const pages = [
      { icon: 'storefront',        title: 'Market AI Analysis',       sub: 'AI-powered price insights',    href: 'market.html' },
      { icon: 'trending_up',       title: 'Investor Dashboard',        sub: 'Portfolio & analytics',        href: 'dashboard.html' },
      { icon: 'volunteer_activism',title: 'Women Empowerment',         sub: 'Artisan & training programs',  href: 'women.html' },
      { icon: 'payments',          title: 'Halal Investment',          sub: '0% interest, asset-backed',    href: '#marketplace' },
      { icon: 'groups',            title: 'About Gram-Bondhon',        sub: 'Our mission & partners',       href: '#about' },
      { icon: 'star',              title: 'Testimonials',              sub: 'Community stories',            href: '#' },
      { icon: 'login',             title: 'Login',                     sub: 'Sign in to your account',      action: () => window.openModal && openModal('loginModal') },
      { icon: 'person_add',        title: 'Sign Up',                   sub: 'Join as farmer or investor',   action: () => window.openModal && openModal('signupModal') },
    ];
    pages.forEach(p => items.push({ type: 'page', ...p }));

    return items;
  }

  let index = [];
  // Build after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { index = buildIndex(); });
  } else {
    index = buildIndex();
  }

  /* ---- Filter ---- */
  function search(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return index.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.sub || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }

  /* ---- Render results ---- */
  function renderResults(items, query) {
    results.innerHTML = '';
    if (!items.length) {
      results.innerHTML = `<div class="search-no-result">No results for "<strong>${escHtml(query)}</strong>"</div>`;
      results.classList.add('visible');
      return;
    }
    items.forEach(item => {
      const el = document.createElement(item.href ? 'a' : 'button');
      el.className = 'search-result-item';
      if (item.href) {
        el.href = item.href;
        if (item.href.startsWith('http') || (!item.href.startsWith('#') && item.href.endsWith('.html'))) {
          // same-tab navigation
        }
      }
      el.innerHTML = `
        <div class="search-result-icon"><span class="material-icons">${item.icon}</span></div>
        <div class="search-result-text">
          <div class="search-result-title">${highlight(item.title, query)}</div>
          <div class="search-result-sub">${escHtml(item.sub || '')}</div>
        </div>
        <span class="material-icons" style="color:var(--text-gray);font-size:1rem">chevron_right</span>
      `;
      el.addEventListener('click', () => {
        hideResults();
        input.blur();
        if (item.action) {
          setTimeout(item.action, 150);
        }
      });
      results.appendChild(el);
    });
    results.classList.add('visible');
  }

  function hideResults() {
    results.classList.remove('visible');
  }

  /* ---- Helpers ---- */
  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function highlight(text, query) {
    const safe = escHtml(text);
    const safeQ = escHtml(query.trim());
    if (!safeQ) return safe;
    return safe.replace(new RegExp(`(${safeQ.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),
      '<mark style="background:var(--green-light);color:var(--green);border-radius:3px;padding:0 2px">$1</mark>');
  }

  /* ---- Events ---- */
  input.addEventListener('input', () => {
    const q = input.value;
    clearBtn.classList.toggle('visible', q.length > 0);
    if (q.length === 0) { hideResults(); return; }
    renderResults(search(q), q);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    hideResults();
    input.focus();
  });

  // Close results when tapping outside
  document.addEventListener('click', e => {
    if (!e.target.closest('#mobileSearchInput') &&
        !e.target.closest('#mobileSearchResults')) {
      hideResults();
    }
  });

  // Dismiss on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hideResults(); input.blur(); }
  });

  // Re-build index once main.js has run (project cards might be added later)
  window.addEventListener('load', () => { index = buildIndex(); });
})();
