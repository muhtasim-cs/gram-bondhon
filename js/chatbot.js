/* ================================================================
   GRAM-BONDHON AI CHATBOT
   Features: Invest, Payment, Project Monitoring, Find Investors
   ================================================================ */
(function () {
  'use strict';

  /* ── Data ───────────────────────────────────────────────────── */
  const PROJECTS = [
    { id: 1, name: 'Monsoon Paddy Harvest',    location: 'Mymensingh', funded: 90, target: 450000,  raised: 405000,  roi: '18%', duration: '6 months', status: 'On Track',       category: 'Agriculture' },
    { id: 2, name: 'Sustainable Poultry',       location: 'Bogra',      funded: 65, target: 280000,  raised: 182000,  roi: '22%', duration: '8 months', status: 'On Track',       category: 'Livestock'   },
    { id: 3, name: 'Sylhet Bio-Fish Hatchery',  location: 'Sylhet',     funded: 42, target: 850000,  raised: 357000,  roi: '25%', duration: '10 months',status: 'Needs Attention',category: 'Fisheries'  },
    { id: 4, name: 'Nakshi Kantha Collective',  location: 'Rajshahi',   funded: 78, target: 180000,  raised: 140400,  roi: '15%', duration: '4 months', status: 'On Track',       category: 'Handicrafts' },
    { id: 5, name: 'Jhuri Beti Bag Workshop',   location: 'Tangail',    funded: 55, target: 220000,  raised: 121000,  roi: '17%', duration: '5 months', status: 'Needs Attention',category: 'Handicrafts' },
  ];

  const INVESTORS = [
    { name: 'Anwar Hossain',  type: 'Tech Entrepreneur', city: 'Dhaka',       min: 50000,  interest: ['Agriculture','Fisheries'], active: 3 },
    { name: 'Farah Jahan',    type: 'Financial Analyst',  city: 'Chittagong', min: 25000,  interest: ['Handicrafts','Livestock'],  active: 2 },
    { name: 'Kamrul Islam',   type: 'NRB Investor',       city: 'London',     min: 100000, interest: ['Agriculture','Fisheries'], active: 4 },
    { name: 'Sumaiya Ahmed',  type: 'Social Entrepreneur',city: 'Dhaka',      min: 15000,  interest: ['Handicrafts'],             active: 1 },
    { name: 'Rahim Chowdhury',type: 'Retired Banker',     city: 'Sylhet',     min: 30000,  interest: ['Livestock','Agriculture'], active: 2 },
  ];

  const QUICK_REPLIES = {
    main: [
      { label: '💰 Invest in a Project', action: 'invest' },
      { label: '📊 Monitor My Projects', action: 'monitor' },
      { label: '💳 Make a Payment',      action: 'payment' },
      { label: '🤝 Find Investors',      action: 'find_investors' },
      { label: '👩 Women Empowerment',   action: 'women' },
      { label: '❓ Help & FAQ',          action: 'faq' },
    ],
    invest_confirm: [
      { label: '✅ Confirm Investment', action: '__confirm_invest__' },
      { label: '🔄 Choose Different',   action: 'invest' },
      { label: '🏠 Main Menu',          action: 'main_menu' },
    ],
    payment_methods: [
      { label: '📱 bKash',    action: '__pay_bkash__' },
      { label: '🏦 Bank Transfer', action: '__pay_bank__' },
      { label: '💳 Nagad',    action: '__pay_nagad__' },
      { label: '🏠 Main Menu', action: 'main_menu' },
    ],
    back_main: [
      { label: '🏠 Back to Main Menu', action: 'main_menu' },
      { label: '💰 Invest Now',        action: 'invest' },
    ],
  };

  /* ── State ──────────────────────────────────────────────────── */
  let state = {
    step: 'idle',
    selectedProject: null,
    investAmount: null,
    paymentPending: null,
    isOpen: false,
    isTyping: false,
  };

  /* ── DOM refs ───────────────────────────────────────────────── */
  let chatWindow, chatBody, chatInput, chatSend, chatToggle, chatBadge;

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    injectHTML();
    chatWindow = document.getElementById('gbChatWindow');
    chatBody   = document.getElementById('gbChatBody');
    chatInput  = document.getElementById('gbChatInput');
    chatSend   = document.getElementById('gbChatSend');
    chatToggle = document.getElementById('gbChatToggle');
    chatBadge  = document.getElementById('gbChatBadge');

    chatToggle.addEventListener('click', toggleChat);
    chatSend.addEventListener('click', handleUserInput);
    chatInput.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUserInput(); }
    });
    document.getElementById('gbChatClose').addEventListener('click', closeChat);

    // show badge after 3s
    setTimeout(function(){ chatBadge.style.display = 'flex'; }, 3000);

    // auto-greet after 4s if not opened
    setTimeout(function(){
      if (!state.isOpen) pulse();
    }, 4000);
  }

  function pulse() {
    chatToggle.classList.add('gb-pulse');
    setTimeout(function(){ chatToggle.classList.remove('gb-pulse'); }, 2000);
  }

  function toggleChat() {
    state.isOpen ? closeChat() : openChat();
  }

  function openChat() {
    state.isOpen = true;
    chatWindow.classList.add('open');
    chatToggle.classList.add('active');
    chatBadge.style.display = 'none';
    if (chatBody.children.length === 0) {
      showGreeting();
    }
    setTimeout(function(){ chatInput.focus(); }, 300);
  }

  function closeChat() {
    state.isOpen = false;
    chatWindow.classList.remove('open');
    chatToggle.classList.remove('active');
  }

  /* ── Greeting ───────────────────────────────────────────────── */
  function showGreeting() {
    var hour = new Date().getHours();
    var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    botMessage(greet + '! 👋 I\'m <strong>Bondhon AI</strong>, your personal investment assistant for Gram-Bondhon.<br><br>I can help you <strong>invest</strong>, <strong>monitor projects</strong>, <strong>process payments</strong>, and <strong>connect with investors</strong>. What would you like to do?');
    showQuickReplies(QUICK_REPLIES.main);
  }

  /* ── Message rendering ──────────────────────────────────────── */
  function botMessage(html, delay) {
    delay = delay || 0;
    showTyping();
    setTimeout(function(){
      hideTyping();
      var msg = document.createElement('div');
      msg.className = 'gb-msg gb-bot';
      msg.innerHTML = '<span class="gb-avatar"><span class="material-icons">smart_toy</span></span><div class="gb-bubble">' + html + '</div>';
      chatBody.appendChild(msg);
      scrollBottom();
    }, delay + 700);
  }

  function userMessage(text) {
    var msg = document.createElement('div');
    msg.className = 'gb-msg gb-user';
    msg.innerHTML = '<div class="gb-bubble">' + escHtml(text) + '</div>';
    chatBody.appendChild(msg);
    scrollBottom();
  }

  function showTyping() {
    if (document.getElementById('gbTyping')) return;
    var el = document.createElement('div');
    el.id = 'gbTyping';
    el.className = 'gb-msg gb-bot';
    el.innerHTML = '<span class="gb-avatar"><span class="material-icons">smart_toy</span></span><div class="gb-bubble gb-typing"><span></span><span></span><span></span></div>';
    chatBody.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    var el = document.getElementById('gbTyping');
    if (el) el.remove();
  }

  function showQuickReplies(replies) {
    var wrap = document.createElement('div');
    wrap.className = 'gb-quick-wrap';
    replies.forEach(function(r){
      var btn = document.createElement('button');
      btn.className = 'gb-quick';
      btn.textContent = r.label;
      btn.addEventListener('click', function(){
        wrap.remove();
        userMessage(r.label);
        handleAction(r.action);
      });
      wrap.appendChild(btn);
    });
    chatBody.appendChild(wrap);
    scrollBottom();
  }

  function showProjectCards(projects) {
    var wrap = document.createElement('div');
    wrap.className = 'gb-cards-wrap';
    projects.forEach(function(p){
      var card = document.createElement('div');
      card.className = 'gb-proj-card';
      var statusCls = p.status === 'On Track' ? 'on-track' : 'watch';
      card.innerHTML = [
        '<div class="gb-proj-head">',
          '<span class="gb-proj-cat">' + p.category + '</span>',
          '<span class="gb-proj-status ' + statusCls + '">' + p.status + '</span>',
        '</div>',
        '<h4>' + p.name + '</h4>',
        '<p>📍 ' + p.location + ' &nbsp;|&nbsp; 📅 ' + p.duration + '</p>',
        '<div class="gb-proj-bar-wrap"><div class="gb-proj-bar" style="width:' + p.funded + '%"></div></div>',
        '<div class="gb-proj-meta">',
          '<span>' + p.funded + '% Funded</span>',
          '<span>ROI: <strong>' + p.roi + '</strong></span>',
          '<span>৳' + p.raised.toLocaleString() + ' / ৳' + p.target.toLocaleString() + '</span>',
        '</div>',
        '<button class="gb-proj-btn" data-id="' + p.id + '">Invest in This Project →</button>',
      ].join('');
      card.querySelector('.gb-proj-btn').addEventListener('click', function(){
        wrap.remove();
        state.selectedProject = p;
        state.step = 'enter_amount';
        userMessage('I want to invest in: ' + p.name);
        botMessage('Great choice! 🌾 <strong>' + p.name + '</strong> is ' + p.funded + '% funded with an expected ROI of <strong>' + p.roi + '</strong>.<br><br>Minimum investment: <strong>৳5,000</strong><br>Available slot: <strong>৳' + (p.target - p.raised).toLocaleString() + '</strong><br><br>Please type the amount you\'d like to invest (in BDT):');
      });
      wrap.appendChild(card);
    });
    chatBody.appendChild(wrap);
    scrollBottom();
  }

  function showInvestorCards(investors) {
    var wrap = document.createElement('div');
    wrap.className = 'gb-cards-wrap';
    investors.forEach(function(inv){
      var card = document.createElement('div');
      card.className = 'gb-inv-card';
      card.innerHTML = [
        '<div class="gb-inv-head">',
          '<span class="gb-inv-avatar"><span class="material-icons">person</span></span>',
          '<div>',
            '<h4>' + inv.name + '</h4>',
            '<p>' + inv.type + ' · ' + inv.city + '</p>',
          '</div>',
        '</div>',
        '<div class="gb-inv-tags">',
          inv.interest.map(function(t){ return '<span>' + t + '</span>'; }).join(''),
        '</div>',
        '<div class="gb-inv-meta">',
          '<span>Min: <strong>৳' + inv.min.toLocaleString() + '</strong></span>',
          '<span>Active Projects: <strong>' + inv.active + '</strong></span>',
        '</div>',
        '<button class="gb-proj-btn">Connect with Investor →</button>',
      ].join('');
      card.querySelector('.gb-proj-btn').addEventListener('click', function(){
        userMessage('Connect with ' + inv.name);
        botMessage('📩 A connection request has been sent to <strong>' + inv.name + '</strong>! They will receive your project details and respond within 24 hours.<br><br>You\'ll be notified via email once they accept.');
        showQuickReplies(QUICK_REPLIES.back_main);
      });
      wrap.appendChild(card);
    });
    chatBody.appendChild(wrap);
    scrollBottom();
  }

  /* ── Main action router ──────────────────────────────────────── */
  function handleAction(action) {
    switch(action) {

      case 'invest':
        state.step = 'select_project';
        botMessage('Here are our active investment opportunities. All projects are <strong>Shariah-compliant</strong> and asset-backed 🌿');
        setTimeout(function(){ showProjectCards(PROJECTS); }, 1400);
        break;

      case 'monitor':
        state.step = 'idle';
        var html = '<strong>📊 Your Portfolio Overview</strong><br><br>';
        html += '<table class="gb-table"><tr><th>Project</th><th>Progress</th><th>Status</th></tr>';
        PROJECTS.forEach(function(p){
          var dot = p.status === 'On Track' ? '🟢' : '🟡';
          html += '<tr><td>' + p.name + '</td><td>' + p.funded + '%</td><td>' + dot + ' ' + p.status + '</td></tr>';
        });
        html += '</table><br>For detailed analytics, visit your <a href="dashboard.html" target="_blank" style="color:#2d7860;font-weight:600">Investor Dashboard →</a>';
        botMessage(html);
        showQuickReplies(QUICK_REPLIES.back_main);
        break;

      case 'payment':
        state.step = 'payment_project';
        botMessage('Which project would you like to pay for? Type the project name or select below:');
        var payQR = PROJECTS.map(function(p){
          return { label: p.name, action: '__pay_project_' + p.id + '__' };
        });
        payQR.push({ label: '🏠 Main Menu', action: 'main_menu' });
        setTimeout(function(){ showQuickReplies(payQR); }, 1400);
        break;

      case 'find_investors':
        state.step = 'idle';
        botMessage('Here are <strong>verified investors</strong> currently active on Gram-Bondhon. You can send them a connection request 🤝');
        setTimeout(function(){ showInvestorCards(INVESTORS); }, 1400);
        break;

      case 'women':
        state.step = 'idle';
        botMessage('🌸 Our <strong>Women Empowerment Program</strong> has transformed 1,240 lives across Bangladesh.<br><br>• Avg income growth: <strong>214%</strong><br>• Total invested: <strong>৳3.2 Crore</strong><br>• Skills trained: <strong>892 women</strong><br>• Marketplace products: <strong>3,480</strong><br><br><a href="women.html" target="_blank" style="color:#7c3d6e;font-weight:600">View Full Dashboard →</a>');
        showQuickReplies(QUICK_REPLIES.back_main);
        break;

      case 'faq':
        state.step = 'idle';
        botMessage([
          '<strong>❓ Frequently Asked Questions</strong><br><br>',
          '<b>Is my investment halal?</b><br>Yes — all investments are 100% Shariah-compliant, asset-backed, and interest-free (Riba-free).<br><br>',
          '<b>What is the minimum investment?</b><br>As low as <strong>৳5,000</strong> BDT.<br><br>',
          '<b>How do I get my returns?</b><br>Profits are distributed after project completion via bKash, Nagad, or bank transfer.<br><br>',
          '<b>How are projects verified?</b><br>All projects are verified by our admin team and partner NGOs before listing.<br><br>',
          'Need more help? <a href="mailto:support@gram-bondhon.com" style="color:#2d7860;font-weight:600">Email our support team</a>'
        ].join(''));
        showQuickReplies(QUICK_REPLIES.back_main);
        break;

      case 'main_menu':
        state.step = 'idle';
        state.selectedProject = null;
        state.investAmount = null;
        botMessage('How else can I help you? 😊');
        showQuickReplies(QUICK_REPLIES.main);
        break;

      case '__confirm_invest__':
        if (state.selectedProject && state.investAmount) {
          var p = state.selectedProject;
          var amt = state.investAmount;
          state.paymentPending = { project: p, amount: amt };
          botMessage([
            '✅ <strong>Investment Confirmed!</strong><br><br>',
            '📋 <strong>Project:</strong> ' + p.name + '<br>',
            '💰 <strong>Amount:</strong> ৳' + parseInt(amt).toLocaleString() + '<br>',
            '📍 <strong>Location:</strong> ' + p.location + '<br>',
            '📈 <strong>Expected ROI:</strong> ' + p.roi + '<br><br>',
            'Please choose your <strong>payment method</strong> to complete the investment:'
          ].join(''));
          setTimeout(function(){ showQuickReplies(QUICK_REPLIES.payment_methods); }, 1400);
        }
        break;

      case '__pay_bkash__':
      case '__pay_nagad__':
      case '__pay_bank__': {
        var method = action === '__pay_bkash__' ? 'bKash' : action === '__pay_nagad__' ? 'Nagad' : 'Bank Transfer';
        var p2 = state.paymentPending;
        if (p2) {
          var txId = 'GB' + Date.now().toString().slice(-8).toUpperCase();
          botMessage([
            '🎉 <strong>Payment Initiated via ' + method + '!</strong><br><br>',
            '🧾 <strong>Transaction ID:</strong> ' + txId + '<br>',
            '💰 <strong>Amount:</strong> ৳' + parseInt(p2.amount).toLocaleString() + '<br>',
            '📌 <strong>Project:</strong> ' + p2.project.name + '<br><br>',
            method === 'Bank Transfer'
              ? 'Bank: <strong>Dutch-Bangla Bank Ltd</strong><br>A/C: <strong>1481140025784</strong><br>Branch: Dhanmondi, Dhaka<br><br>Transfer the amount and send the slip to <a href="mailto:payments@gram-bondhon.com" style="color:#2d7860">payments@gram-bondhon.com</a><br><br>'
              : 'Send <strong>৳' + parseInt(p2.amount).toLocaleString() + '</strong> to <strong>01XXXXXXXXX</strong> (' + method + ' merchant).<br>Reference: <strong>' + txId + '</strong><br><br>',
            '📊 Your project will appear in your <a href="dashboard.html" target="_blank" style="color:#2d7860;font-weight:600">Dashboard</a> once payment is verified.'
          ].join(''));
          state.paymentPending = null;
          state.selectedProject = null;
          state.investAmount = null;
          state.step = 'idle';
          setTimeout(function(){ showQuickReplies(QUICK_REPLIES.back_main); }, 1400);
        } else {
          botMessage('Please start an investment first so I can process your payment.');
          showQuickReplies(QUICK_REPLIES.main);
        }
        break;
      }

      default:
        // handle __pay_project_X__ actions
        if (action.startsWith('__pay_project_')) {
          var pid = parseInt(action.replace('__pay_project_','').replace('__',''));
          var proj = PROJECTS.find(function(x){ return x.id === pid; });
          if (proj) {
            state.paymentPending = { project: proj, amount: 5000 };
            botMessage('How much would you like to pay for <strong>' + proj.name + '</strong>? Type the amount in BDT:');
            state.step = 'enter_payment_amount';
          }
        }
    }
  }

  /* ── Free-text input handler ────────────────────────────────── */
  function handleUserInput() {
    var text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    userMessage(text);

    // remove any quick replies
    var qw = chatBody.querySelector('.gb-quick-wrap');
    if (qw) qw.remove();

    var lower = text.toLowerCase();

    // state-based handlers
    if (state.step === 'enter_amount') {
      var amount = parseFloat(text.replace(/[^0-9.]/g,''));
      if (!amount || amount < 5000) {
        botMessage('Minimum investment is <strong>৳5,000</strong>. Please enter a valid amount (e.g. 10000):');
        return;
      }
      if (state.selectedProject && amount > (state.selectedProject.target - state.selectedProject.raised)) {
        botMessage('That exceeds the available slot of <strong>৳' + (state.selectedProject.target - state.selectedProject.raised).toLocaleString() + '</strong>. Please enter a lower amount:');
        return;
      }
      state.investAmount = amount;
      state.step = 'confirm_invest';
      var p = state.selectedProject;
      botMessage([
        '📋 <strong>Investment Summary</strong><br><br>',
        '🌾 <strong>Project:</strong> ' + p.name + '<br>',
        '📍 <strong>Location:</strong> ' + p.location + '<br>',
        '💰 <strong>Your Investment:</strong> ৳' + parseInt(amount).toLocaleString() + '<br>',
        '📈 <strong>Expected ROI:</strong> ' + p.roi + '<br>',
        '📅 <strong>Duration:</strong> ' + p.duration + '<br><br>',
        'Shall I confirm this investment?'
      ].join(''));
      setTimeout(function(){ showQuickReplies(QUICK_REPLIES.invest_confirm); }, 1400);
      return;
    }

    if (state.step === 'enter_payment_amount') {
      var pamt = parseFloat(text.replace(/[^0-9.]/g,''));
      if (!pamt || pamt < 100) {
        botMessage('Please enter a valid amount (min ৳100):');
        return;
      }
      if (state.paymentPending) state.paymentPending.amount = pamt;
      state.step = 'idle';
      botMessage('Choose your payment method for <strong>৳' + parseInt(pamt).toLocaleString() + '</strong>:');
      setTimeout(function(){ showQuickReplies(QUICK_REPLIES.payment_methods); }, 1400);
      return;
    }

    // NLP keyword matching
    if (/invest|bond|fund|project|farm|paddy|poultry|fish|kantha|bag|basket/i.test(lower)) {
      handleAction('invest');
    } else if (/monitor|track|progress|dashboard|status|portfolio/i.test(lower)) {
      handleAction('monitor');
    } else if (/pay|payment|bkash|nagad|bank|transfer|send money/i.test(lower)) {
      handleAction('payment');
    } else if (/investor|partner|connect|find|angel|funder/i.test(lower)) {
      handleAction('find_investors');
    } else if (/women|empow|girl|female|shilpi|fatema|roksana/i.test(lower)) {
      handleAction('women');
    } else if (/hello|hi|assalam|salam|hey|good|morning|afternoon|evening/i.test(lower)) {
      botMessage('Hello! 😊 How can I assist you with your investments today?');
      showQuickReplies(QUICK_REPLIES.main);
    } else if (/roi|return|profit|earning|income|interest/i.test(lower)) {
      botMessage('Our projects offer <strong>15–25% ROI</strong> depending on the project type and duration. All returns are <strong>halal profit-sharing</strong> (not interest).<br><br>Would you like to browse projects?');
      showQuickReplies([
        { label: '💰 Browse Projects', action: 'invest' },
        { label: '🏠 Main Menu', action: 'main_menu' },
      ]);
    } else if (/faq|help|how|question|what|who|when|where/i.test(lower)) {
      handleAction('faq');
    } else if (/thank|thanks|shukriya|dhonnobad/i.test(lower)) {
      botMessage('You\'re most welcome! 🙏 May your investments bring barakah and growth. Is there anything else I can help with?');
      showQuickReplies(QUICK_REPLIES.main);
    } else {
      botMessage('I\'m not sure I understood that, but I\'m here to help! Please choose what you\'d like to do:');
      showQuickReplies(QUICK_REPLIES.main);
    }
  }

  /* ── Helpers ─────────────────────────────────────────────────── */
  function scrollBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── HTML injection ──────────────────────────────────────────── */
  function injectHTML() {
    var html = [
      /* Toggle button */
      '<button class="gb-toggle" id="gbChatToggle" aria-label="Open Bondhon AI chat" title="Chat with Bondhon AI">',
        '<span class="material-icons gb-toggle-icon">smart_toy</span>',
        '<span class="material-icons gb-toggle-close">close</span>',
        '<span class="gb-badge" id="gbChatBadge">1</span>',
      '</button>',

      /* Chat window */
      '<div class="gb-chat-window" id="gbChatWindow" role="dialog" aria-label="Bondhon AI Chat">',
        /* Header */
        '<div class="gb-chat-header">',
          '<div class="gb-header-info">',
            '<span class="gb-header-avatar"><span class="material-icons">smart_toy</span></span>',
            '<div>',
              '<strong>Bondhon AI</strong>',
              '<span class="gb-header-sub"><span class="gb-online-dot"></span>Online · Investment Assistant</span>',
            '</div>',
          '</div>',
          '<button class="gb-close-btn" id="gbChatClose" aria-label="Close chat"><span class="material-icons">close</span></button>',
        '</div>',

        /* Body */
        '<div class="gb-chat-body" id="gbChatBody"></div>',

        /* Input */
        '<div class="gb-chat-footer">',
          '<input type="text" id="gbChatInput" class="gb-chat-input" placeholder="Type a message..." autocomplete="off" maxlength="300" />',
          '<button id="gbChatSend" class="gb-send-btn" aria-label="Send"><span class="material-icons">send</span></button>',
        '</div>',
        '<div class="gb-powered">Powered by <strong>Gram-Bondhon</strong> · Halal Fintech</div>',
      '</div>',
    ].join('');

    var el = document.createElement('div');
    el.id = 'gbChatRoot';
    el.innerHTML = html;
    document.body.appendChild(el);
  }

  /* ── Boot ────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
