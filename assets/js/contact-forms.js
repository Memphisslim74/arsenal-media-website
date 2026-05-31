(function () {
  const TURNSTILE_CONFIG_URL = '/api/contact?config=turnstile&v=27';
  const TURNSTILE_API_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  let turnstileConfigPromise;
  let turnstileScriptPromise;
  let observerStarted = false;

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function setMessage(form, message, type) {
    const target = form.querySelector('[data-form-message]');
    if (!target) return;
    target.style.display = 'block';
    target.textContent = message;
    target.classList.remove('is-success', 'is-error');
    target.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function getSubmitButton(form) {
    return form.querySelector('button[type="submit"], input[type="submit"]');
  }

  function getFormData(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    data.source_page = data.source_page || window.location.href;
    return data;
  }

  async function readJsonSafely(response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.toLowerCase().includes('bad gateway') || response.status === 502) {
        return { message: 'The contact API returned a Cloudflare 502. Check the Cloudflare Pages Function logs and Resend settings.' };
      }
      return { message: cleaned || 'The form reached the site, but the server returned an unexpected response.' };
    }
  }

  async function loadTurnstileConfig() {
    if (!turnstileConfigPromise) {
      turnstileConfigPromise = fetch(TURNSTILE_CONFIG_URL, { cache: 'no-store' })
        .then(readJsonSafely)
        .then((result) => {
          const siteKey = result && result.turnstile && result.turnstile.siteKey;
          if (!result.ok || !siteKey) {
            throw new Error('Human verification is not configured yet. Add TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in Cloudflare, then redeploy.');
          }
          return result.turnstile;
        });
    }
    return turnstileConfigPromise;
  }

  function loadTurnstileScript() {
    if (window.turnstile && typeof window.turnstile.render === 'function') {
      return Promise.resolve(window.turnstile);
    }

    if (!turnstileScriptPromise) {
      turnstileScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-arsenal-turnstile]');
        if (existing) {
          const waitForTurnstile = window.setInterval(() => {
            if (window.turnstile && typeof window.turnstile.render === 'function') {
              window.clearInterval(waitForTurnstile);
              resolve(window.turnstile);
            }
          }, 80);
          window.setTimeout(() => {
            window.clearInterval(waitForTurnstile);
            if (window.turnstile && typeof window.turnstile.render === 'function') resolve(window.turnstile);
            else reject(new Error('Cloudflare Turnstile loaded, but the widget API was not ready.'));
          }, 8000);
          return;
        }

        const script = document.createElement('script');
        script.src = TURNSTILE_API_URL;
        script.async = true;
        script.defer = true;
        script.dataset.arsenalTurnstile = 'true';
        script.onload = () => {
          const waitForTurnstile = window.setInterval(() => {
            if (window.turnstile && typeof window.turnstile.render === 'function') {
              window.clearInterval(waitForTurnstile);
              resolve(window.turnstile);
            }
          }, 80);
          window.setTimeout(() => {
            window.clearInterval(waitForTurnstile);
            if (window.turnstile && typeof window.turnstile.render === 'function') resolve(window.turnstile);
            else reject(new Error('Cloudflare Turnstile loaded, but the widget API was not ready.'));
          }, 8000);
        };
        script.onerror = () => reject(new Error('Cloudflare Turnstile could not load. A browser blocker may be blocking challenges.cloudflare.com.'));
        document.head.appendChild(script);
      });
    }

    return turnstileScriptPromise;
  }

  function findInsertTarget(form) {
    const submitButton = getSubmitButton(form);
    if (!submitButton) return { parent: form, before: null };

    const wrapper = submitButton.closest('.formActions, .formFooter, .contactActions, .leadFormActions, .buttonRow, .actions');
    if (wrapper && wrapper.parentNode) {
      return { parent: wrapper.parentNode, before: wrapper };
    }

    if (submitButton.parentNode) {
      return { parent: submitButton.parentNode, before: submitButton };
    }

    return { parent: form, before: null };
  }

  function ensureHumanCheckField(form) {
    let field = form.querySelector('[data-human-check]');
    if (field) return field;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'cf-turnstile-response';
    hidden.setAttribute('data-turnstile-token', '');

    field = document.createElement('div');
    field.className = 'field humanCheckField full fullWidth turnstilePending';
    field.setAttribute('data-human-check', '');
    field.innerHTML = [
      '<label>Are you human? <span>Required</span></label>',
      '<div class="turnstileBox" data-turnstile-container>',
      '  <div class="turnstileLoading">Loading human verification...</div>',
      '</div>',
      '<small class="fieldHelp">This quick check helps stop spam bots before they can flood the inbox.</small>'
    ].join('');
    field.appendChild(hidden);

    const target = findInsertTarget(form);
    target.parent.insertBefore(field, target.before);

    return field;
  }

  function resetTurnstileForm(form) {
    const tokenInput = form.querySelector('[data-turnstile-token]');
    if (tokenInput) tokenInput.value = '';

    const widgetId = form.dataset.turnstileWidgetId;
    if (window.turnstile && widgetId) {
      try {
        window.turnstile.reset(widgetId);
      } catch (error) {
        console.warn('Could not reset Turnstile widget:', error);
      }
    }
  }

  async function setupTurnstile(form) {
    const field = ensureHumanCheckField(form);
    const container = field.querySelector('[data-turnstile-container]');
    const tokenInput = field.querySelector('[data-turnstile-token]');

    if (!container || !tokenInput) return;
    if (form.dataset.turnstileWidgetId) return;

    try {
      field.classList.add('turnstilePending');
      container.innerHTML = '<div class="turnstileLoading">Loading human verification...</div>';

      const [config, turnstile] = await Promise.all([loadTurnstileConfig(), loadTurnstileScript()]);

      container.innerHTML = '';
      const widgetId = turnstile.render(container, {
        sitekey: config.siteKey,
        theme: 'light',
        appearance: 'always',
        callback: function (token) {
          tokenInput.value = token;
          field.classList.remove('has-error', 'turnstilePending');
          field.classList.add('is-verified');
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

      form.dataset.turnstileWidgetId = widgetId;
      field.classList.remove('turnstilePending');
    } catch (error) {
      field.classList.remove('turnstilePending');
      field.classList.add('has-error');
      container.innerHTML = '<div class="turnstileError">Human verification could not load. Refresh the page. If it still does not appear, check browser blockers or Cloudflare Turnstile settings.</div>';
      console.error('Arsenal Media Turnstile setup failed:', error);
    }
  }

  function bindForm(form) {
    if (!form || form.dataset.contactFormBound === 'true') return;
    form.dataset.contactFormBound = 'true';

    ensureHumanCheckField(form);
    setupTurnstile(form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = getSubmitButton(form);
      const originalText = submitButton ? submitButton.textContent : '';
      const tokenInput = form.querySelector('[data-turnstile-token]');

      if (!tokenInput || !tokenInput.value) {
        ensureHumanCheckField(form);
        setupTurnstile(form);
        setMessage(form, 'Please complete the “Are you human?” check before sending the form.', 'error');
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      setMessage(form, 'Sending your request...', 'success');

      try {
        const response = await fetch(form.getAttribute('action') || '/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(getFormData(form))
        });

        const result = await readJsonSafely(response);

        if (!response.ok || result.ok === false) {
          if ((result.message || '').toLowerCase().includes('human verification') || response.status === 400) {
            resetTurnstileForm(form);
          }
          throw new Error(result.message || 'The form reached the site, but the email did not send. Please try again shortly.');
        }

        setMessage(form, result.message || 'Thanks. Your request was sent.', 'success');
        form.reset();
        resetTurnstileForm(form);
      } catch (error) {
        setMessage(form, error.message || 'The form did not send. Please try again.', 'error');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      }
    });
  }

  function initForms() {
    document.querySelectorAll('[data-contact-form]').forEach(bindForm);

    if (!observerStarted) {
      observerStarted = true;
      const observer = new MutationObserver(() => {
        document.querySelectorAll('[data-contact-form]').forEach(bindForm);
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  ready(initForms);
})();
