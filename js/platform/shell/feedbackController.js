const DEFAULT_FEEDBACK_ENDPOINT = 'https://formspree.io/f/meedowlv';
const FEEDBACK_OFFLINE_QUEUE_KEY = 'techcalc.feedback.offlineQueue.v1';

let feedbackControllerInitialized = false;

function getNavigatorOnline(navigatorRef) {
  return !navigatorRef || typeof navigatorRef.onLine !== 'boolean' ? true : navigatorRef.onLine;
}

function formDataToObject(data) {
  return Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value)]));
}

function readOfflineQueue(storage) {
  if (!storage) return [];
  try {
    const value = storage.getItem(FEEDBACK_OFFLINE_QUEUE_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOfflineQueue(storage, queue) {
  if (!storage) return false;
  try {
    storage.setItem(FEEDBACK_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

function saveOfflineFeedback(storage, payload, reason) {
  const queue = readOfflineQueue(storage);
  queue.push({
    savedAt: new Date().toISOString(),
    reason,
    payload: formDataToObject(payload)
  });
  return writeOfflineQueue(storage, queue);
}

export function initializeFeedbackController({
  appVersion = '1.3.2-dev.1',
  endpoint = DEFAULT_FEEDBACK_ENDPOINT,
  form = null,
  status = null,
  submit = null,
  subject = null,
  getRoute = () => '',
  fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
  navigatorRef = typeof navigator !== 'undefined' ? navigator : null
} = {}) {
  const doc = typeof document !== 'undefined' ? document : null;
  form = form || doc?.getElementById('feedbackForm') || null;
  status = status || doc?.getElementById('feedbackStatus') || null;
  submit = submit || doc?.getElementById('feedbackSubmit') || null;
  subject = subject || doc?.getElementById('feedbackSubject') || null;

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
    data.set('userAgent', navigatorRef?.userAgent || '');
    data.set('timestamp', new Date().toISOString());
    return data;
  }

  function saveForLater(payload, reason) {
    const saved = saveOfflineFeedback(storage, payload, reason);
    if (saved) {
      setStatus('Feedback wurde lokal zwischengespeichert. Bitte später mit Netz erneut senden.', 'pending');
      return true;
    }
    setStatus('Feedback konnte nicht gesendet oder lokal gespeichert werden. Bitte kopiere die Nachricht und versuche es später erneut.', 'error');
    return false;
  }

  const pendingCount = readOfflineQueue(storage).length;
  if (pendingCount > 0) {
    setStatus(`${pendingCount} Feedback-Entwurf(e) sind lokal zwischengespeichert. Bitte bei Netz erneut senden.`, 'pending');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('', '');
    if (!form.reportValidity()) return;
    const honeypot = String(new FormData(form).get('_gotcha') || '').trim();
    if (honeypot) {
      setStatus('Feedback wurde verarbeitet. Danke!', 'success');
      form.reset();
      if (subject) subject.value = 'TechCalc Pro Feedback';
      return;
    }

    const payload = buildPayload();

    if (!getNavigatorOnline(navigatorRef)) {
      saveForLater(payload, 'offline');
      return;
    }

    if (!fetchImpl) {
      saveForLater(payload, 'fetch-unavailable');
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
        body: payload,
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error(`Formspree HTTP ${response.status}`);
      form.reset();
      if (subject) subject.value = 'TechCalc Pro Feedback';
      setStatus('Feedback wurde gesendet. Danke!', 'success');
    } catch (error) {
      console.error('Feedback konnte nicht gesendet werden:', error);
      saveForLater(payload, 'send-failed');
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
