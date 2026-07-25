let seats = 18;

const form = document.querySelector('#registrationForm');
const spots = document.querySelector('#spots');
const message = document.querySelector('#formMessage');
const submitButton = document.querySelector('#seatButton');
const randomizeButton = document.querySelector('#randomizeButton');
const defaultButtonText = submitButton.textContent;

// --- Test data generator -----------------------------------------------

const FIRST_NAMES = [
  'Ivan', 'Oleksiy', 'Andriy', 'Dmytro', 'Serhiy', 'Taras', 'Bohdan', 'Yaroslav',
  'Maksym', 'Vitaliy', 'Olena', 'Kateryna', 'Nataliya', 'Iryna', 'Yuliya',
  'Anastasiya', 'Viktoriya', 'Oksana', 'Svitlana', 'Mariya',
];

const LAST_NAMES = [
  'Shevchenko', 'Kovalenko', 'Bondarenko', 'Tkachenko', 'Kravchenko', 'Oliynyk',
  'Shevchuk', 'Polishchuk', 'Melnyk', 'Boyko', 'Ruban', 'Moroz', 'Rudenko',
  'Marchenko', 'Kolomiyets', 'Savchenko', 'Lysenko', 'Fedorenko', 'Pavlenko', 'Onyshchenko',
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomPhone() {
  let digits = '';
  for (let i = 0; i < 7; i += 1) {
    digits += Math.floor(Math.random() * 10);
  }
  return `+38097${digits}`;
}

function fillTestData() {
  form.querySelector('[name="firstName"]').value = randomItem(FIRST_NAMES);
  form.querySelector('[name="lastName"]').value = randomItem(LAST_NAMES);
  form.querySelector('[name="phone"]').value = randomPhone();
}

if (randomizeButton) {
  randomizeButton.addEventListener('click', fillTestData);
}

document.addEventListener('DOMContentLoaded', fillTestData);
fillTestData();

// --- Existing submit / seats-left behaviour -----------------------------

function showMessage(type, title, items) {
  message.hidden = false;
  message.className = `message message-${type}`;
  message.innerHTML = '';

  const strong = document.createElement('strong');
  strong.textContent = title;
  message.appendChild(strong);

  if (items.length === 0) {
    return;
  }

  const list = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  message.appendChild(list);
}

if (window.fetch) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    message.hidden = true;

    try {
      const response = await fetch(form.action || window.location.href, {
        method: 'POST',
        body: new FormData(form),
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        showMessage('error', 'Registration failed', data.errors || ['Registration request failed.']);
        return;
      }

      form.reset();
      seats = Math.max(0, seats - 1);
      spots.textContent = `${seats} seats left`;
      showMessage('success', data.message || 'Registration request has been sent successfully.', []);
      fillTestData();
    } catch (error) {
      showMessage('error', 'Registration failed', ['Unable to send registration request.']);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
}
