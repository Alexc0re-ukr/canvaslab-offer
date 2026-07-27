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

function randomDigits(count) {
  let digits = '';
  for (let i = 0; i < count; i += 1) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

function randomPhone() {
  return `0200${randomDigits(6)}`;
}

const COUNTRY_PHONE_GENERATORS = {
  // Local national dialing formats (no "+", no spaces) — matches the plain
  // digit style the registration API expects for the "phone" field.
  mx: () => `55${randomDigits(8)}`,
  ua: () => `0${randomItem(['50', '63', '66', '67', '68', '73', '93', '95', '96', '97', '98', '99'])}${randomDigits(7)}`,
  cl: () => `9${randomDigits(8)}`,
};

function randomPhoneForCountry(country) {
  const generator = COUNTRY_PHONE_GENERATORS[country];
  return generator ? generator() : randomPhone();
}

let selectedCountry = null;

function fillTestData() {
  form.querySelector('[name="firstName"]').value = randomItem(FIRST_NAMES);
  form.querySelector('[name="lastName"]').value = randomItem(LAST_NAMES);
  form.querySelector('[name="phone"]').value = randomPhoneForCountry(selectedCountry);
}

if (randomizeButton) {
  randomizeButton.addEventListener('click', fillTestData);
}

fillTestData();

// --- IP presets (Mexico / Ukraine / Chile test IPs) ------------------------

const ipPresets = document.querySelector('#ipPresets');

if (ipPresets) {
  ipPresets.addEventListener('click', async (event) => {
    const chip = event.target.closest('.ip-chip');
    if (!chip) return;

    const ip = chip.dataset.ip;
    const ipInput = form.querySelector('[name="ip"]');
    ipInput.value = ip;
    ipInput.focus();

    selectedCountry = chip.dataset.country;
    const phoneInput = form.querySelector('[name="phone"]');
    phoneInput.value = randomPhoneForCountry(selectedCountry);

    try {
      await navigator.clipboard.writeText(ip);
    } catch (error) {
      // Clipboard API unavailable (e.g. insecure context) — value is still filled in.
    }

    chip.classList.add('copied');
    setTimeout(() => chip.classList.remove('copied'), 900);
  });
}

// --- Messages -------------------------------------------------------------

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

// --- Submit -> serverless function -----------------------------------------
// The form posts JSON to /api/register (a Vercel serverless function).
// That function holds the real API token and forwards the request server
// side, so the token never reaches the browser.

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';
  message.hidden = true;

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
   const response = await fetch(`/api/register${window.location.search}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
    const data = await response.json();

   if (!response.ok) {
  showMessage('error', 'Registration failed', [data.message || 'Registration request failed.']);
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
