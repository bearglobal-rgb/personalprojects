// Explicit visual examples only. Never infer a real decision from a URL, storage,
// or a form in this static site. Private application lookup will require a backend.
const examples = {
  none: {
    badge: 'Not connected', heading: 'No application loaded.',
    description: 'Once applications open, your private application link will show your progress here.',
    context: 'For now, you can explore the example states above.', stage: null,
  },
  received: {
    badge: 'Received', heading: 'Application received.',
    description: 'Your application is ready for review. This is the first step toward joining Black.',
    context: 'A decision has not been made yet.', stage: 0,
  },
  'under-review': {
    badge: 'Under review', heading: 'Your application is under review.',
    description: 'Your goals and commitment are being considered for the cohort. Your decision will appear here when the review is complete.',
    context: 'No payment is needed while your application is being reviewed.', stage: 1,
  },
  approved: {
    badge: 'Approved', heading: 'You’re invited to Black.',
    description: 'Congratulations. Your application has been approved. The next step is to complete your enrollment.',
    context: 'Approval is your invitation to join. Your place is confirmed after payment.', stage: 2,
  },
  'not-accepted': {
    badge: 'Not accepted', heading: 'An update on your application.',
    description: 'Thank you for applying. We’re unable to offer you a place in this cohort.',
    context: 'You can read the reviewer’s message below.', stage: 2,
  },
  enrolled: {
    badge: 'Enrollment confirmed', heading: 'Your place is confirmed.',
    description: 'Your payment is confirmed and your enrollment in Black is complete.',
    context: 'Your joining instructions will appear here once they are available.', stage: 3,
  },
  expired: {
    badge: 'Link expired', heading: 'This link has expired.',
    description: 'Your application status cannot be shown through this link. A new private access link is needed.',
    context: 'An expired link does not mean your application was declined.', stage: null,
  },
  unavailable: {
    badge: 'Status unavailable', heading: 'We can’t load your status right now.',
    description: 'Please try again later. This message does not indicate an approval or a decline.',
    context: 'No application status can be verified while the connection is unavailable.', stage: null,
  },
};

const select = document.querySelector('#status-preview-select');
const card = document.querySelector('.status-card');
const progress = document.querySelector('.status-progress');
const parameters = new URLSearchParams(location.search);
const requested = parameters.get('preview');
const valid = value => Object.hasOwn(examples, value);

function showExample(key) {
  const example = examples[key];
  card.dataset.status = key;
  document.querySelector('#status-badge').textContent = example.badge;
  document.querySelector('#status-heading').textContent = example.heading;
  document.querySelector('#status-description').textContent = example.description;
  document.querySelector('#status-context').textContent = example.context;
  progress.hidden = example.stage === null;
  progress.querySelectorAll('li').forEach((item, index) => {
    const current = index === example.stage;
    const completed = example.stage !== null && index < example.stage;
    item.hidden = key === 'not-accepted' && index === 3;
    item.dataset.state = completed ? 'complete' : current ? 'current' : 'upcoming';
    if (current) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    item.querySelector('.status-stage-detail').textContent = completed ? 'Complete' : current ? (key === 'enrolled' ? 'Complete' : 'Current') : 'Upcoming';
  });
  document.querySelector('.status-decision-note').hidden = key !== 'not-accepted';
  document.querySelector('.status-checkout').hidden = key !== 'approved';
  select.value = key;
}

document.querySelector('.status-preview-control').hidden = false;
showExample(valid(requested) ? requested : 'none');
select.addEventListener('change', () => {
  const key = valid(select.value) ? select.value : 'none';
  showExample(key);
  // Only the explicitly named preview setting is shared; never propagate private
  // query parameters or form values into these demonstration URLs.
  const url = new URL(location.href);
  url.search = key === 'none' ? '' : `?preview=${key}`;
  url.hash = '';
  history.replaceState(null, '', url);
});
