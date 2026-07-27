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

  var styles = document.createElement("style");
  styles.textContent =
    "#cb-root{position:relative;z-index:999998}" +
    "#cb-root *{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    "@keyframes cb-pulse{0%,100%{transform:scale(1);box-shadow:0 4px 16px rgba(0,0,0,.2)}50%{transform:scale(1.1);box-shadow:0 8px 28px rgba(0,0,0,.28)}}" +
    "#cb-toggle{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;border:none!important;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);z-index:999998;color:#fff!important;font-size:24px;display:flex!important;align-items:center;justify-content:center;background:#e85d04!important;transition:transform .25s ease,box-shadow .25s ease}" +
    "#cb-toggle.cb-pulse{animation:cb-pulse 2s ease-in-out infinite}" +
    "#cb-toggle:active{transform:scale(.96)!important}" +
    "#cb-panel{position:fixed;right:20px;bottom:88px;width:360px;max-width:calc(100vw - 40px);height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);display:flex;flex-direction:column;overflow:hidden;z-index:999999;opacity:0;visibility:hidden;pointer-events:none;transform:scale(.94) translateY(16px);transform-origin:bottom right;transition:opacity .4s ease,transform .45s cubic-bezier(.34,1.45,.64,1),visibility .4s ease}" +
    "#cb-panel.open{opacity:1;visibility:visible;pointer-events:auto;transform:scale(1) translateY(0)}" +
    "#cb-header{padding:16px;color:#fff;font-weight:600;font-size:16px;display:flex;justify-content:space-between;align-items:center}" +
    "#cb-close{background:transparent!important;border:none!important;color:#fff!important;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}" +
    "#cb-messages{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:10px}" +
    ".cb-msg{max-width:85%;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.45;word-wrap:break-word;white-space:pre-wrap}" +
    ".cb-msg.user{align-self:flex-end;background:#2563eb;color:#fff;border-bottom-right-radius:4px}" +
    ".cb-msg.bot{align-self:flex-start;background:#fff;color:#1e293b;border:1px solid #e2e8f0;border-bottom-left-radius:4px}" +
    ".cb-msg.error{align-self:flex-start;background:#fef2f2;color:#991b1b;border:1px solid #fecaca}" +
    "#cb-typing{align-self:flex-start;font-size:13px;color:#64748b;padding:0 4px;display:none}" +
    "#cb-typing.visible{display:block}" +
    "#cb-input-row{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff}" +
    "#cb-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font-size:14px;outline:none;resize:none;min-height:42px;max-height:100px}" +
    "#cb-input:focus{border-color:#2563eb}" +
    "#cb-send{border:none!important;border-radius:10px;padding:0 14px;font-size:14px;font-weight:600;color:#fff!important;cursor:pointer;min-width:72px;background:#e85d04!important}" +
    "#cb-send:disabled{opacity:.6;cursor:not-allowed}" +
    "@media(max-width:480px){#cb-panel{right:10px;left:10px;width:auto;bottom:78px;height:calc(100vh - 100px)}#cb-toggle{right:14px;bottom:14px}}";

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
    '<div id="cb-input-row"><textarea id="cb-input" rows="1" placeholder="Напишите сообщение..."></textarea><button id="cb-send" type="button">Отправить</button></div>';

  root.appendChild(toggle);
  root.appendChild(panel);
  document.body.appendChild(root);

  var titleEl = panel.querySelector("#cb-title");
  var messagesEl = panel.querySelector("#cb-messages");
  var typingEl = panel.querySelector("#cb-typing");
  var inputEl = panel.querySelector("#cb-input");
  var sendBtn = panel.querySelector("#cb-send");
  var closeBtn = panel.querySelector("#cb-close");
  var headerEl = panel.querySelector("#cb-header");

  function applyTheme(color) {
    var c = color || "#2563eb";
    toggle.style.setProperty("background", c, "important");
    headerEl.style.background = c;
    sendBtn.style.setProperty("background", c, "important");
    var userMsgs = document.querySelectorAll(".cb-msg.user");
    for (var i = 0; i < userMsgs.length; i++) {
      userMsgs[i].style.background = c;
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

  function renderMessages() {
    messagesEl.innerHTML = "";
    for (var i = 0; i < history.length; i++) {
      appendMessageBubble(history[i].role, history[i].content, false);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessageBubble(role, content, scroll) {
    var div = document.createElement("div");
    div.className = "cb-msg " + (role === "user" ? "user" : "bot");
    if (role === "error") div.className = "cb-msg error";
    div.textContent = content;
    messagesEl.appendChild(div);
    if (scroll !== false) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    if (role === "user" && config && config.primary_color) {
      div.style.background = config.primary_color;
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
        titleEl.textContent = data.business_name || "Чат";
        applyTheme(data.primary_color);
        if (history.length === 0 && data.welcome_message) {
          appendMessageBubble("bot", data.welcome_message, true);
        }
        scheduleAutoOpen();
      })
      .catch(function () {
        config = {
          business_name: "Чат",
          primary_color: "#2563eb",
          welcome_message: "Здравствуйте! Чем могу помочь?",
          escalation_contact: "",
        };
        titleEl.textContent = config.business_name;
        applyTheme(config.primary_color);
        appendMessageBubble("bot", config.welcome_message, true);
        scheduleAutoOpen();
      });
  }

  function sendMessage() {
    var text = (inputEl.value || "").trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    inputEl.value = "";

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

  sendBtn.addEventListener("click", sendMessage);

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
