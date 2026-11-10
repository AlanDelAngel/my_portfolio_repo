/* =========================================================
   Portfolio chat widget
   Floating button + panel that talks to /api/chat.
   - Text from the server is always inserted with textContent (no HTML).
   - Keeps only the last few turns and caps messages per browser session.
   - "Fun fact" asks the server for a fixed fact (no AI call, no cost).
   ========================================================= */
(function () {
  var ENDPOINT = '/api/chat';
  var MAX_CHARS = 500;
  var MAX_HISTORY = 8;
  var SESSION_LIMIT = 25;

  var IS_EN = (document.documentElement.lang || '').indexOf('en') === 0;
  var LANG = IS_EN ? 'en' : 'es';
  var TEXT = IS_EN ? {
    open: 'Ask about Alan', title: "Alan's assistant", close: 'Close chat',
    hello: "Hi! I'm the assistant on Alan's portfolio. Ask me about his projects, experience or skills, or tap Fun fact.",
    placeholder: 'Ask something about Alan...', send: 'Send',
    chips: ['What has he built?', "What's his tech stack?", 'How can I contact him?'],
    fact: 'Fun fact', factLabel: 'Fun fact',
    note: 'AI-generated answers that can contain mistakes. Messages are processed by OpenAI and are not stored.',
    offline: "The chat isn't available here. It only works on Alan's published site.",
    sessionLimit: "That's the message limit for this visit. You can reach Alan directly from the contact section.",
    error: 'Something went wrong. Please try again.'
  } : {
    open: 'Pregunta por Alan', title: 'Asistente de Alan', close: 'Cerrar chat',
    hello: 'Hola, soy el asistente del portafolio de Alan. Pregúntame por sus proyectos, experiencia o habilidades, o toca Dato curioso.',
    placeholder: 'Pregunta algo sobre Alan...', send: 'Enviar',
    chips: ['¿Qué proyectos ha hecho?', '¿Qué tecnologías usa?', '¿Cómo lo contacto?'],
    fact: 'Dato curioso', factLabel: 'Dato curioso',
    note: 'Respuestas generadas con IA que pueden contener errores. Los mensajes se procesan con OpenAI y no se guardan.',
    offline: 'El chat no está disponible aquí. Solo funciona en el sitio publicado de Alan.',
    sessionLimit: 'Llegaste al límite de mensajes de esta visita. Puedes contactar a Alan desde la sección de contacto.',
    error: 'Algo salió mal. Intenta de nuevo.'
  };

  /* Bot head icon (based on Lucide "bot", ISC license) */
  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M9 13v2M15 13v2"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var history = [];
  var seenFacts = [];
  var sent = 0;
  var busy = false;
  var locked = false;

  function readCount() {
    try { return parseInt(sessionStorage.getItem('chatCount'), 10) || 0; } catch (e) { return sent; }
  }
  function bumpCount() {
    sent = readCount() + 1;
    try { sessionStorage.setItem('chatCount', String(sent)); } catch (e) {}
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  /* ---------- build the widget ---------- */
  var launcher = el('button', 'chat-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'chat-panel');
  launcher.innerHTML = ICON_CHAT;
  launcher.appendChild(el('span', 'chat-launcher-label', TEXT.open));

  var panel = el('section', 'chat-panel');
  panel.id = 'chat-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', TEXT.title);

  var header = el('header', 'chat-head');
  header.appendChild(el('span', 'chat-dot'));
  header.appendChild(el('h2', 'chat-title', TEXT.title));
  var closeBtn = el('button', 'chat-close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', TEXT.close);
  closeBtn.innerHTML = ICON_CLOSE;
  header.appendChild(closeBtn);

  var log = el('div', 'chat-log');
  log.setAttribute('aria-live', 'polite');

  var chips = el('div', 'chat-chips');
  var factChip = el('button', 'chat-chip chat-chip-fact', TEXT.fact);
  factChip.type = 'button';
  chips.appendChild(factChip);
  TEXT.chips.forEach(function (q) {
    var chip = el('button', 'chat-chip', q);
    chip.type = 'button';
    chip.addEventListener('click', function () { ask(q); });
    chips.appendChild(chip);
  });

  var form = el('form', 'chat-form');
  var input = el('input', 'chat-input');
  input.type = 'text';
  input.maxLength = MAX_CHARS;
  input.placeholder = TEXT.placeholder;
  input.setAttribute('aria-label', TEXT.placeholder);
  input.autocomplete = 'off';
  var sendBtn = el('button', 'chat-send');
  sendBtn.type = 'submit';
  sendBtn.setAttribute('aria-label', TEXT.send);
  sendBtn.innerHTML = ICON_SEND;
  form.appendChild(input);
  form.appendChild(sendBtn);

  panel.appendChild(header);
  panel.appendChild(log);
  panel.appendChild(chips);
  panel.appendChild(form);
  panel.appendChild(el('p', 'chat-note', TEXT.note));

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  addBubble('bot', TEXT.hello);
  if (readCount() >= SESSION_LIMIT) lockSession();

  /* ---------- open / close ---------- */
  function openChat() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    launcher.classList.add('is-open');
    setTimeout(function () { input.focus(); }, 30);
  }
  function closeChat() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.classList.remove('is-open');
    launcher.focus();
  }
  launcher.addEventListener('click', function () { panel.hidden ? openChat() : closeChat(); });
  closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) closeChat();
  });

  /* ---------- messages ---------- */
  function addBubble(who, text, label) {
    var bubble = el('div', 'chat-msg chat-' + who);
    if (label) bubble.appendChild(el('span', 'chat-label', label));
    bubble.appendChild(el('p', null, text));
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
    return bubble;
  }
  function showTyping() {
    var typing = el('div', 'chat-msg chat-bot chat-typing');
    typing.appendChild(el('span'));
    typing.appendChild(el('span'));
    typing.appendChild(el('span'));
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;
    return typing;
  }
  function setBusy(state) {
    busy = state;
    input.disabled = state;
    sendBtn.disabled = state;
    Array.prototype.forEach.call(chips.children, function (c) { c.disabled = state; });
  }

  /* After the per-visit limit: show the notice once and disable the controls */
  function lockSession() {
    if (!locked) addBubble('bot', TEXT.sessionLimit);
    locked = true;
    setBusy(true);
  }

  function post(payload) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      var type = res.headers.get('content-type') || '';
      if (type.indexOf('application/json') === -1) throw new Error('offline');
      return res.json().then(function (data) { return { ok: res.ok, data: data }; });
    });
  }

  function run(payload, onReply) {
    if (busy) return;
    if (readCount() >= SESSION_LIMIT) { lockSession(); return; }
    bumpCount();
    setBusy(true);
    var typing = showTyping();
    post(payload).then(function (r) {
      typing.remove();
      if (r.ok && r.data.reply) onReply(r.data);
      else addBubble('bot', r.data.message || TEXT.error);
    }).catch(function () {
      typing.remove();
      addBubble('bot', TEXT.offline);
    }).then(function () {
      if (readCount() >= SESSION_LIMIT) { lockSession(); return; }
      setBusy(false);
      input.focus();
    });
  }

  function ask(question) {
    question = (question || '').trim().slice(0, MAX_CHARS);
    if (!question || busy) return;
    if (readCount() >= SESSION_LIMIT) { lockSession(); return; }
    addBubble('user', question);
    var payload = { mode: 'chat', lang: LANG, message: question, history: history.slice(-MAX_HISTORY) };
    run(payload, function (data) {
      addBubble('bot', data.reply);
      history.push({ role: 'user', content: question }, { role: 'assistant', content: data.reply });
      history = history.slice(-MAX_HISTORY);
    });
  }

  factChip.addEventListener('click', function () {
    run({ mode: 'fact', lang: LANG, seen: seenFacts }, function (data) {
      if (typeof data.factId === 'number') seenFacts.push(data.factId);
      addBubble('bot', data.reply, TEXT.factLabel);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = input.value;
    input.value = '';
    ask(value);
  });
})();
