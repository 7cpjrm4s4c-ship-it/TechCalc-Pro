const FEEDBACK_TO = 'stefan.filly@proton.me';

function encode(value = '') {
  return encodeURIComponent(String(value).trim());
}

function buildFeedbackBody({ name, email, message }) {
  const lines = [
    'TechCalc Pro Feedback',
    '',
    name ? `Name: ${name}` : 'Name: -',
    email ? `E-Mail: ${email}` : 'E-Mail: -',
    '',
    'Nachricht:',
    message || '-'
  ];
  return lines.join('\n');
}

export function initFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  const hint = document.getElementById('feedbackHint');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const subject = String(data.get('subject') || 'TechCalc Pro Feedback').trim() || 'TechCalc Pro Feedback';
    const message = String(data.get('message') || '').trim();

    if (!message) {
      if (hint) hint.textContent = 'Bitte eine Nachricht eingeben.';
      form.querySelector('[name="message"]')?.focus();
      return;
    }

    const body = buildFeedbackBody({ name, email, message });
    const mailto = `mailto:${FEEDBACK_TO}?subject=${encode(subject)}&body=${encode(body)}`;
    window.location.href = mailto;
    if (hint) hint.textContent = 'Das E-Mail-Programm wurde geöffnet. Bitte die Nachricht dort absenden.';
  });
}
