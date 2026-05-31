(function () {
  'use strict';

  const VERSION = '28';
  const CONFIG_URL = '/api/contact?config=turnstile&v=' + VERSION;
  const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  let configPromise = null;
  let scriptPromise = null;

  function log() {
    try { console.info.apply(console, ['Arsenal Media contact forms v' + VERSION].concat(Array.from(arguments))); } catch (_) {}
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function getForms() {
    return Array.from(document.querySelectorAll('form[data-contact-form], form[action="/api/contact"], form[action$="/api/contact"]'));
  }

  function messageBox(form) {
    let box = form.querySelector('[data-form-message]');
    if (!box) {
      box = document.createElement('p');
      box.className = 'formStatus fullWidth';
      box.setAttribute('data-form-message', '');
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      const submit = submitButton(form);
      if (submit && submit.parentNode) submit.parentNode.insertBefore(box, submit.nextSibling);
      else form.appendChild(box);
    }
    return box;
  }

  function setMessage(form, text, type) {
    const box = messageBox(form);
    box.style.display = text ? 'block' : 'none';
    box.textContent = text || '';
    box.classList.remove('is-success', 'is-error');
    if (type) box.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function submitButton(form) {
    return form.querySelector('button[type="submit"], input[type="submit"]');
  }

  function readData(form) {
    const data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    data.source_page = data.source_page || window.location.href;
    return data;
  }

  async function readJson(response) {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text); }
    catch (_) {
      return { ok: false, message: text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || 'Unexpected server response.' };
    }
  }

  function loadConfig() {
    if (!configPromise) {
      configPromise = fetch(CONFIG_URL, { cache: 'no-store' })
        .then(readJson)
        .then(function (json) {
          const siteKey = json && json.turnstile && json.turnstile.siteKey;
          if (!siteKey) throw new Error('Turnstile site key was not returned by /api/contact?config=turnstile.');
          return json.turnstile;
        });
    }
    return configPromise;
  }

  function loadTurnstile() {
    if (window.turnstile && typeof window.turnstile.render === 'function') return Promise.resolve(window.turnstile);
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-am-turnstile-script]');

      function waitForApi() {
        const started = Date.now();
        const timer = window.setInterval(function () {
          if (window.turnstile && typeof window.turnstile.render === 'function') {
            window.clearInterval(timer);
            resolve(window.turnstile);
          } else if (Date.now() - started > 10000) {
            window.clearInterval(timer);
            reject(new Error('Cloudflare Turnstile API did not become ready.'));
          }
        }, 100);
      }

      if (existing) {
        waitForApi();
        return;
      }

      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-am-turnstile-script', 'true');
      script.onload = waitForApi;
      script.onerror = function () {
        reject(new Error('Cloudflare Turnstile could not load. Browser privacy tools or a content blocker may be blocking challenges.cloudflare.com.'));
      };
      document.head.appendChild(script);
    });

    return scriptPromise;
  }

  function insertBeforeSubmit(form, element) {
    const submit = submitButton(form);
    if (!submit) {
      form.appendChild(element);
      return;
    }

    // The current forms put the submit button inside .formGrid. Inserting before the button
    // makes the human check visible exactly where users expect it.
    submit.parentNode.insertBefore(element, submit);
  }

  function ensureHumanCheck(form) {
    let field = form.querySelector('[data-human-check]');
    if (field) return field;

    field = document.createElement('div');
    field.className = 'field humanCheckField full fullWidth turnstilePending';
    field.setAttribute('data-human-check', '');

    const label = document.createElement('label');
    label.textContent = 'Are you human?';
    const req = document.createElement('span');
    req.textContent = ' Required';
    label.appendChild(req);

    const box = document.createElement('div');
    box.className = 'turnstileBox';
    box.setAttribute('data-turnstile-container', '');
    box.innerHTML = '<div class="turnstileLoading">Loading human verification...</div>';

    const help = document.createElement('small');
    help.className = 'fieldHelp';
    help.textContent = 'This quick check helps stop spam bots before they can flood the inbox.';

    const token = document.createElement('input');
    token.type = 'hidden';
    token.name = 'cf-turnstile-response';
    token.setAttribute('data-turnstile-token', '');

    field.appendChild(label);
    field.appendChild(box);
    field.appendChild(help);
    field.appendChild(token);

    insertBeforeSubmit(form, field);
    return field;
  }

  async function renderTurnstile(form) {
    const field = ensureHumanCheck(form);
    const box = field.querySelector('[data-turnstile-container]');
    const tokenInput = field.querySelector('[data-turnstile-token]');

    if (!box || !tokenInput) return;
    if (form.dataset.turnstileRendered === 'true') return;

    try {
      field.classList.add('turnstilePending');
      field.classList.remove('has-error', 'is-verified');
      box.innerHTML = '<div class="turnstileLoading">Loading human verification...</div>';

      const result = await Promise.all([loadConfig(), loadTurnstile()]);
      const config = result[0];
      const turnstile = result[1];

      box.innerHTML = '';
      const widgetId = turnstile.render(box, {
        sitekey: config.siteKey,
        theme: 'light',
        appearance: 'always',
        callback: function (token) {
          tokenInput.value = token;
          field.classList.remove('turnstilePending', 'has-error');
          field.classList.add('is-verified');
          setMessage(form, '', null);
        },
        'expired-callback': function () {
          tokenInput.value = '';
          field.classList.remove('is-verified');
          setMessage(form, 'The human check expired. Please complete it again before sending.', 'error');
        },
        'error-callback': function () {
          tokenInput.value = '';
          field.classList.remove('is-verified', 'turnstilePending');
          field.classList.add('has-error');
          setMessage(form, 'The human check could not be completed. Please refresh and try again.', 'error');
        }
      });

      form.dataset.turnstileRendered = 'true';
      form.dataset.turnstileWidgetId = String(widgetId);
      field.classList.remove('turnstilePending');
      log('Turnstile rendered for form', form.id || form.className || form);
    } catch (error) {
      console.error('Arsenal Media Turnstile render failed:', error);
      field.classList.remove('turnstilePending');
      field.classList.add('has-error');
      box.innerHTML = '<div class="turnstileError">Human verification could not load. Refresh the page. If it still does not appear, check browser blockers or Cloudflare Turnstile settings.</div>';
    }
  }

  function resetWidget(form) {
    const token = form.querySelector('[data-turnstile-token]');
    if (token) token.value = '';
    if (window.turnstile && form.dataset.turnstileWidgetId) {
      try { window.turnstile.reset(form.dataset.turnstileWidgetId); } catch (_) {}
    }
    const field = form.querySelector('[data-human-check]');
    if (field) field.classList.remove('is-verified');
  }

  function bindForm(form) {
    if (!form || form.dataset.amContactBound === 'true') return;
    form.dataset.amContactBound = 'true';
    form.setAttribute('data-contact-form', '');

    ensureHumanCheck(form);
    renderTurnstile(form);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      ensureHumanCheck(form);
      renderTurnstile(form);

      const token = form.querySelector('[data-turnstile-token]');
      if (!token || !token.value) {
        setMessage(form, 'Please complete the “Are you human?” check before sending the form.', 'error');
        return;
      }

      const submit = submitButton(form);
      const original = submit ? submit.textContent : '';
      if (submit) {
        submit.disabled = true;
        if (submit.tagName.toLowerCase() === 'button') submit.textContent = 'Sending...';
      }
      setMessage(form, '', null);

      try {
        const response = await fetch(form.getAttribute('action') || '/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(readData(form))
        });
        const result = await readJson(response);
        if (!response.ok || result.ok === false) throw new Error(result.message || 'The form could not be sent.');

        form.reset();
        resetWidget(form);
        setMessage(form, result.message || 'Thanks. Your workflow review request was sent.', 'success');
      } catch (error) {
        setMessage(form, error.message || 'Something went wrong sending the form. Please try again.', 'error');
        resetWidget(form);
      } finally {
        if (submit) {
          submit.disabled = false;
          if (submit.tagName.toLowerCase() === 'button') submit.textContent = original;
        }
      }
    });
  }

  function init() {
    const forms = getForms();
    if (!forms.length) return;
    forms.forEach(bindForm);
  }

  ready(function () {
    init();
    window.setTimeout(init, 300);
    window.setTimeout(init, 1200);

    if ('MutationObserver' in window) {
      const observer = new MutationObserver(function () { init(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  });
})();
