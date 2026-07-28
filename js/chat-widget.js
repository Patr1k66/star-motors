(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) {
    var scripts = document.querySelectorAll("script[data-bot-id][data-api-url]");
    script = scripts[scripts.length - 1] || null;
  }
  if (!script) return;

  var botId = script.getAttribute("data-bot-id");
  var apiUrl = (script.getAttribute("data-api-url") || "").replace(/\/$/, "");
  var autoOpenMs = parseInt(script.getAttribute("data-auto-open-ms") || "0", 10);
  var AUTO_OPEN_KEY = "chatbot_auto_opened_";

  if (!botId || !apiUrl) {
    console.error("[ChatBot] data-bot-id and data-api-url are required");
    return;
  }

  var STORAGE_KEY = "chatbot_history_" + botId;
  var config = null;
  var isOpen = false;
  var isSending = false;
  var history = [];
  var autoOpenTimer = null;

  var URL_RE = /https?:\/\/[^\s<>"']+/gi;
  var PHONE_RE = /(?:\+7|8)[\s\-()]*(?:\d[\s\-()]*){10}/g;

  var styles = document.createElement("style");
  styles.textContent =
    "#cb-root{position:relative;z-index:999998}" +
    "#cb-root *{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    "@keyframes cb-pulse{0%,100%{transform:scale(1);box-shadow:0 4px 16px rgba(0,0,0,.2)}50%{transform:scale(1.1);box-shadow:0 8px 28px rgba(0,0,0,.28)}}" +
    "#cb-toggle{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:none!important;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:999998;color:#fff!important;font-size:24px;display:flex!important;align-items:center;justify-content:center;background:#e85d04!important;transition:transform .25s ease,box-shadow .25s ease}" +
    "#cb-toggle.cb-pulse{animation:cb-pulse 2s ease-in-out infinite}" +
    "#cb-toggle:active{transform:scale(.96)!important}" +
    "#cb-panel{position:fixed;right:20px;bottom:88px;width:360px;max-width:calc(100vw - 40px);height:560px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;z-index:999999;opacity:0;visibility:hidden;pointer-events:none;transform:scale(.94) translateY(16px);transform-origin:bottom right;transition:opacity .4s ease,transform .45s cubic-bezier(.34,1.45,.64,1),visibility .4s ease}" +
    "#cb-panel.open{opacity:1;visibility:visible;pointer-events:auto;transform:scale(1) translateY(0)}" +
    "#cb-header{padding:16px;color:#fff;font-weight:600;font-size:16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}" +
    "#cb-close{background:transparent!important;border:none!important;color:#fff!important;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}" +
    "#cb-messages{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:10px;min-height:0}" +
    ".cb-msg{max-width:85%;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.45;word-wrap:break-word;white-space:pre-wrap}" +
    ".cb-msg a{color:inherit;text-decoration:underline;text-underline-offset:2px}" +
    ".cb-msg.bot a{color:#2563eb}" +
    ".cb-msg.user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:4px}" +
    ".cb-msg.user a{color:#fff}" +
    ".cb-msg.bot{align-self:flex-start;background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:4px}" +
    ".cb-msg.error{align-self:flex-start;background:#fef2f2;color:#991b1b;border:1px solid #fecaca}" +
    "#cb-typing{align-self:flex-start;font-size:13px;color:#64748b;padding:0 4px;display:none;flex-shrink:0}" +
    "#cb-typing.visible{display:block}" +
    "#cb-quick-replies{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0;border-top:1px solid #e2e8f0;background:#fff;flex-shrink:0}" +
    "#cb-quick-replies:empty{display:none}" +
    ".cb-quick-reply{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:999px;padding:6px 12px;font-size:12px;line-height:1.3;cursor:pointer;transition:background .15s,border-color .15s,color .15s}" +
    ".cb-quick-reply:hover{background:#f1f5f9;border-color:#94a3b8}" +
    "#cb-actions{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:#fff;flex-shrink:0}" +
    "#cb-actions:empty{display:none}" +
    ".cb-action-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:none!important;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:600;color:#fff!important;cursor:pointer;text-decoration:none!important;flex:1;min-width:calc(50% - 3px);text-align:center}" +
    ".cb-action-btn.cb-action-outline{background:#fff!important;color:#334155!important;border:1px solid #cbd5e1!important}" +
    "#cb-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff;flex-shrink:0}" +
    "#cb-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:14px;outline:none;resize:none;min-height:42px;max-height:100px}" +
    "#cb-input:focus{border-color:#2563eb}" +
    "#cb-send{border:none!important;border-radius:10px;padding:0 14px;font-size:14px;font-weight:600;color:#fff!important;cursor:pointer;min-width:72px;background:#e85d04!important}" +
    "#cb-send:disabled{opacity:.6;cursor:not-allowed}" +
    "@media(max-width:480px){#cb-panel{right:10px;left:10px;width:auto;bottom:78px;height:calc(100vh - 100px)}#cb-toggle{right:14px;bottom:14px}.cb-action-btn{min-width:100%}}";

  document.head.appendChild(styles);

  var root = document.createElement("div");
  root.id = "cb-root";

  var toggle = document.createElement("button");
  toggle.id = "cb-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Открыть чат");
  toggle.textContent = "💬";

  var panel = document.createElement("div");
  panel.id = "cb-panel";
  panel.innerHTML =
    '<div id="cb-header"><span id="cb-title">Чат</span><button id="cb-close" type="button" aria-label="Закрыть">&times;</button></div>' +
    '<div id="cb-messages"></div>' +
    '<div id="cb-typing">Печатает...</div>' +
    '<div id="cb-quick-replies"></div>' +
    '<div id="cb-actions"></div>' +
    '<div id="cb-input-row"><textarea id="cb-input" rows="1" placeholder="Напишите сообщение..."></textarea><button id="cb-send" type="button">Отправить</button></div>';

  root.appendChild(toggle);
  root.appendChild(panel);
  document.body.appendChild(root);

  var titleEl = panel.querySelector("#cb-title");
  var messagesEl = panel.querySelector("#cb-messages");
  var typingEl = panel.querySelector("#cb-typing");
  var quickRepliesEl = panel.querySelector("#cb-quick-replies");
  var actionsEl = panel.querySelector("#cb-actions");
  var inputEl = panel.querySelector("#cb-input");
  var sendBtn = panel.querySelector("#cb-send");
  var closeBtn = panel.querySelector("#cb-close");
  var headerEl = panel.querySelector("#cb-header");

  function themeColor() {
    return (config && config.primary_color) || "#2563eb";
  }

  function applyTheme(color) {
    var c = color || "#2563eb";
    toggle.style.setProperty("background", c, "important");
    headerEl.style.background = c;
    sendBtn.style.setProperty("background", c, "important");
    var userMsgs = messagesEl.querySelectorAll(".cb-msg.user");
    for (var i = 0; i < userMsgs.length; i++) {
      userMsgs[i].style.background = c;
    }
    var actionBtns = actionsEl.querySelectorAll(".cb-action-btn:not(.cb-action-outline)");
    for (var j = 0; j < actionBtns.length; j++) {
      actionBtns[j].style.setProperty("background", c, "important");
    }
    var quickBtns = quickRepliesEl.querySelectorAll(".cb-quick-reply");
    for (var k = 0; k < quickBtns.length; k++) {
      quickBtns[k].style.borderColor = c;
      quickBtns[k].style.color = c;
    }
  }

  function normalizePhone(phone) {
    var digits = phone.replace(/\D/g, "");
    if (digits.charAt(0) === "8") digits = "7" + digits.slice(1);
    if (digits.charAt(0) !== "7") digits = "7" + digits;
    return "+" + digits;
  }

  function appendLinkedText(parent, text) {
    var parts = [];
    var lastIndex = 0;
    var matches = [];
    var urlMatch;
    var phoneMatch;

    URL_RE.lastIndex = 0;
    while ((urlMatch = URL_RE.exec(text)) !== null) {
      matches.push({ start: urlMatch.index, end: urlMatch.index + urlMatch[0].length, kind: "url", value: urlMatch[0] });
    }

    PHONE_RE.lastIndex = 0;
    while ((phoneMatch = PHONE_RE.exec(text)) !== null) {
      var overlaps = false;
      for (var i = 0; i < matches.length; i++) {
        if (phoneMatch.index >= matches[i].start && phoneMatch.index < matches[i].end) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        matches.push({
          start: phoneMatch.index,
          end: phoneMatch.index + phoneMatch[0].length,
          kind: "phone",
          value: phoneMatch[0],
        });
      }
    }

    matches.sort(function (a, b) {
      return a.start - b.start;
    });

    for (var m = 0; m < matches.length; m++) {
      var item = matches[m];
      if (item.start < lastIndex) continue;
      if (item.start > lastIndex) {
        parent.appendChild(document.createTextNode(text.slice(lastIndex, item.start)));
      }
      var link = document.createElement("a");
      link.textContent = item.value;
      if (item.kind === "url") {
        link.href = item.value;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.href = "tel:" + normalizePhone(item.value);
      }
      parent.appendChild(link);
      lastIndex = item.end;
    }

    if (lastIndex < text.length) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      history = raw ? JSON.parse(raw) : [];
    } catch (e) {
      history = [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      /* ignore */
    }
  }

  function hasUserMessages() {
    for (var i = 0; i < history.length; i++) {
      if (history[i].role === "user") return true;
    }
    return false;
  }

  function renderQuickReplies() {
    quickRepliesEl.innerHTML = "";
    if (!config || !config.quick_replies || !config.quick_replies.length) return;
    if (hasUserMessages()) return;

    for (var i = 0; i < config.quick_replies.length; i++) {
      (function (label) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cb-quick-reply";
        btn.textContent = label;
        btn.addEventListener("click", function () {
          sendMessage(label);
        });
        quickRepliesEl.appendChild(btn);
      })(config.quick_replies[i]);
    }
    applyTheme(themeColor());
  }

  function handleActionButton(button) {
    if (!button || !button.value) return;

    if (button.type === "phone") {
      window.location.href = "tel:" + normalizePhone(button.value);
      return;
    }

    if (button.type === "url") {
      window.open(button.value, "_blank", "noopener,noreferrer");
      return;
    }

    if (button.type === "scroll") {
      var target = document.querySelector(button.value);
      if (target) {
        setOpen(false);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (button.type === "click") {
      var trigger = document.querySelector(button.value);
      if (trigger) {
        setOpen(false);
        trigger.click();
      }
    }
  }

  function renderActionButtons() {
    actionsEl.innerHTML = "";
    if (!config || !config.action_buttons || !config.action_buttons.length) return;

    for (var i = 0; i < config.action_buttons.length; i++) {
      (function (button) {
        var isExternal = button.type === "url";
        var el = document.createElement(isExternal ? "a" : "button");
        el.className = "cb-action-btn";
        if (button.type === "scroll" || button.type === "click") {
          el.className += " cb-action-outline";
        }
        el.textContent = button.label;
        if (isExternal) {
          el.href = button.value;
          el.target = "_blank";
          el.rel = "noopener noreferrer";
        } else {
          el.type = "button";
          el.addEventListener("click", function () {
            handleActionButton(button);
          });
        }
        actionsEl.appendChild(el);
      })(config.action_buttons[i]);
    }
    applyTheme(themeColor());
  }

  function renderMessages() {
    messagesEl.innerHTML = "";
    for (var i = 0; i < history.length; i++) {
      appendMessageBubble(history[i].role, history[i].content, false);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
    renderQuickReplies();
  }

  function appendMessageBubble(role, content, scroll) {
    var div = document.createElement("div");
    div.className = "cb-msg " + (role === "user" ? "user" : "bot");
    if (role === "error") div.className = "cb-msg error";
    appendLinkedText(div, content);
    messagesEl.appendChild(div);
    if (scroll !== false) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    if (role === "user") {
      div.style.background = themeColor();
    }
  }

  function stopPulse() {
    toggle.classList.remove("cb-pulse");
  }

  function startPulse() {
    if (history.length > 0) return;
    toggle.classList.add("cb-pulse");
  }

  function setOpen(open) {
    isOpen = open;
    if (open) {
      stopPulse();
      if (autoOpenTimer) {
        clearTimeout(autoOpenTimer);
        autoOpenTimer = null;
      }
    }
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-label", open ? "Закрыть чат" : "Открыть чат");
    if (open) {
      setTimeout(function () {
        inputEl.focus();
      }, 350);
    }
  }

  function setTyping(visible) {
    typingEl.classList.toggle("visible", visible);
    if (visible) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function scheduleAutoOpen() {
    if (!autoOpenMs || autoOpenMs <= 0) return;
    if (history.length > 0) return;

    var storageKey = AUTO_OPEN_KEY + botId;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch (e) {
      /* ignore */
    }

    autoOpenTimer = setTimeout(function () {
      autoOpenTimer = null;
      if (isOpen) return;
      try {
        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, "1");
      } catch (e) {
        /* ignore */
      }
      setOpen(true);
    }, autoOpenMs);
  }

  function fetchConfig() {
    return fetch(apiUrl + "/api/config/" + encodeURIComponent(botId))
      .then(function (res) {
        if (!res.ok) throw new Error("config");
        return res.json();
      })
      .then(function (data) {
        config = data;
        if (!config.quick_replies) config.quick_replies = [];
        if (!config.action_buttons) config.action_buttons = [];
        titleEl.textContent = data.business_name || "Чат";
        applyTheme(data.primary_color);
        if (history.length === 0 && data.welcome_message) {
          appendMessageBubble("bot", data.welcome_message, true);
        }
        renderQuickReplies();
        renderActionButtons();
        scheduleAutoOpen();
      })
      .catch(function () {
        config = {
          business_name: "Чат",
          primary_color: "#2563eb",
          welcome_message: "Здравствуйте! Чем могу помочь?",
          escalation_contact: "",
          quick_replies: [],
          action_buttons: [],
        };
        titleEl.textContent = config.business_name;
        applyTheme(config.primary_color);
        appendMessageBubble("bot", config.welcome_message, true);
        scheduleAutoOpen();
      });
  }

  function sendMessage(forcedText) {
    var text = typeof forcedText === "string" ? forcedText.trim() : (inputEl.value || "").trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    inputEl.value = "";
    renderQuickReplies();

    appendMessageBubble("user", text, true);
    setTyping(true);

    var payloadHistory = history.map(function (m) {
      return { role: m.role, content: m.content };
    });

    fetch(apiUrl + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bot_id: botId,
        message: text,
        history: payloadHistory,
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        setTyping(false);
        if (!result.ok) {
          var errText =
            (result.data && result.data.detail) ||
            "Сервис временно недоступен.";
          if (config && config.escalation_contact) {
            errText += " Напишите: " + config.escalation_contact;
          }
          appendMessageBubble("error", errText, true);
          return;
        }

        history.push({ role: "user", content: text });
        history.push({ role: "assistant", content: result.data.reply });
        saveHistory();
        appendMessageBubble("bot", result.data.reply, true);
      })
      .catch(function () {
        setTyping(false);
        var fallback = "Сервис временно недоступен.";
        if (config && config.escalation_contact) {
          fallback += " Напишите: " + config.escalation_contact;
        }
        appendMessageBubble("error", fallback, true);
      })
      .finally(function () {
        isSending = false;
        sendBtn.disabled = false;
        inputEl.focus();
      });
  }

  toggle.addEventListener("click", function () {
    if (!isOpen) stopPulse();
    setOpen(!isOpen);
  });

  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });

  sendBtn.addEventListener("click", function () {
    sendMessage();
  });

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  panel.setAttribute("aria-hidden", "true");

  loadHistory();
  renderMessages();
  startPulse();
  fetchConfig();
})();
