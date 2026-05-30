(function () {
  const forms = document.querySelectorAll('[data-contact-form]');
  if (!forms.length) return;

  function setMessage(form, message, type) {
    const target = form.querySelector('[data-form-message]');
    if (!target) return;
    target.style.display = 'block';
    target.textContent = message;
    target.classList.remove('is-success', 'is-error');
    target.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  function getFormData(form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = typeof value === 'string' ? value.trim() : value;
    });
    data.source_page = data.source_page || window.location.href;
    return data;
  }

  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';

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

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.ok === false) {
          throw new Error(result.message || 'Something went wrong. Please try again.');
        }

        setMessage(form, result.message || 'Thanks. Your request was sent.', 'success');
        form.reset();
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
