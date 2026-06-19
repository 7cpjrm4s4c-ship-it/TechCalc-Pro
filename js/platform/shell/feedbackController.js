const DEFAULT_FEEDBACK_ENDPOINT = 'https://formspree.io/f/meedowlv';

let feedbackControllerInitialized = false;

export function initializeFeedbackController({
  appVersion = '1.3.0-rc.1',
  endpoint = DEFAULT_FEEDBACK_ENDPOINT,
  form = document.getElementById('feedbackForm'),
  status = document.getElementById('feedbackStatus'),
  submit = document.getElementById('feedbackSubmit'),
  subject = document.getElementById('feedbackSubject'),
  getRoute = () => '',
  fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null
} = {}) {
  if (feedbackControllerInitialized) return false;
  feedbackControllerInitialized = true;
  if (!form) return false;

  function setStatus(message, type = '') {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  }

  function buildPayload() {
    const data = new FormData(form);
    data.set('version', appVersion);
    data.set('route', getRoute());
    data.set('userAgent', navigator.userAgent || '');
    data.set('timestamp', new Date().toISOString());
    return data;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('', '');
    if (!form.reportValidity()) return;

    if (!fetchImpl) {
      setStatus('Feedback konnte nicht direkt gesendet werden. Bitte später erneut versuchen.', 'error');
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sende …';
    }
    setStatus('Feedback wird gesendet …', 'pending');

    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        body: buildPayload(),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree HTTP ${response.status}`);
      form.reset();
      if (subject) subject.value = 'TechCalc Pro Feedback';
      setStatus('Feedback wurde gesendet. Danke!', 'success');
    } catch (error) {
      console.error('Feedback konnte nicht gesendet werden:', error);
      setStatus('Feedback konnte nicht direkt gesendet werden. Bitte später erneut versuchen.', 'error');
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = 'Feedback senden';
      }
    }
  });

  return true;
}

export default initializeFeedbackController;
