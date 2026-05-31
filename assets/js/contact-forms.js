(function () {
  const forms = document.querySelectorAll('[data-contact-form]');
  if (!forms.length) return;

  const TURNSTILE_CONFIG_URL = '/api/contact?config=turnstile';
  const TURNSTILE_API_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  let turnstileConfigPromise;
  let turnstileScriptPromise;

  function setMessage(form, message, type) {
    const target = form.querySelector('[data-form-message]');
    if (!target) return;
    target.style.display = 'block';
    target.textContent = message;
    target.classList.remove('is-success', 'is-error');
    target.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function setSubmitDisabled(form, disabled) {
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = disabled;
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
          if (!result.ok || !result.turnstile || !result.turnstile.siteKey) {
            throw new Error('The human verification is not configured yet. Add TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY in Cloudflare.');
          }
          return result.turnstile;
        });
    }
    return turnstileConfigPromise;
  }

  function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);

    if (!turnstileScriptPromise) {
      turnstileScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-arsenal-turnstile]');
        if (existing) {
          existing.addEventListener('load', () => resolve(window.turnstile));
          existing.addEventListener('error', () => reject(new Error('Cloudflare Turnstile could not load.')));
          return;
        }

        const script = document.createElement('script');
        script.src = TURNSTILE_API_URL;
        script.async = true;
        script.defer = true;
        script.dataset.arsenalTurnstile = 'true';
        script.onload = () => resolve(window.turnstile);
        script.onerror = () => reject(new Error('Cloudflare Turnstile could not load.'));
        document.head.appendChild(script);
      });
    }

    return turnstileScriptPromise;
  }

  function ensureHumanCheckField(form) {
    let field = form.querySelector('[data-human-check]');
    if (field) return field;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'cf-turnstile-response';
    hidden.setAttribute('data-turnstile-token', '');

    field = document.createElement('div');
    field.className = 'field humanCheckField full fullWidth';
    field.setAttribute('data-human-check', '');
    field.innerHTML = `
      <label>Are you human? <span>Required</span></label>
      <div class="turnstileBox" data-turnstile-container></div>
      <small class="fieldHelp">This helps stop spam bots before they can flood the inbox.</small>
    `;
    field.appendChild(hidden);

    const grid = form.querySelector('.formGrid') || form;
    const submitButton = grid.querySelector('button[type="submit"]') || form.querySelector('button[type="submit"]');
    if (submitButton && submitButton.parentNode === grid) {
      grid.insertBefore(field, submitButton);
    } else if (submitButton) {
      submitButton.parentNode.insertBefore(field, submitButton);
    } else {
      grid.appendChild(field);
    }

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

    try {
      const [config, turnstile] = await Promise.all([loadTurnstileConfig(), loadTurnstileScript()]);

      if (form.dataset.turnstileWidgetId || !container) return;

      const widgetId = turnstile.render(container, {
        sitekey: config.siteKey,
        theme: 'light',
        appearance: 'always',
        callback: function (token) {
          tokenInput.value = token;
          field.classList.remove('has-error');
        },
        'expired-callback': function () {
          tokenInput.value = '';
          setMessage(form, 'The human check expired. Please complete it again before sending.', 'error');
        },
        'error-callback': function () {
          tokenInput.value = '';
          field.classList.add('has-error');
          setMessage(form, 'The human check could not be completed. Please refresh and try again.', 'error');
        }
      });

      form.dataset.turnstileWidgetId = widgetId;
    } catch (error) {
      field.classList.add('has-error');
      if (container) {
        container.innerHTML = '<div class="turnstileError">Human verification is not ready. Check the Turnstile keys in Cloudflare.</div>';
      }
      setMessage(form, error.message || 'The human verification could not load.', 'error');
    }
  }

  forms.forEach((form) => {
    ensureHumanCheckField(form);
    setupTurnstile(form);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      const tokenInput = form.querySelector('[data-turnstile-token]');

      if (!tokenInput || !tokenInput.value) {
        setMessage(form, 'Please complete the “Are you human?” check before sending.', 'error');
        setupTurnstile(form);
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
  });
})();
