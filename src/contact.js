// No delivery endpoint is connected. Keep this form a non-submitting preview.
const form = document.querySelector('#contact-form');
form.addEventListener('submit', (event) => event.preventDefault());

const topic = new URLSearchParams(location.search).get('topic');
const allowedTopics = ['free-system', 'black', 'technical', 'privacy', 'other'];
if (allowedTopics.includes(topic)) form.elements.topic.value = topic;
