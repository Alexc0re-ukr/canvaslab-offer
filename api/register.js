// Vercel serverless function: /api/register
// Receives the form POST from the static page, forwards it to the real
// registration API with the token attached server-side (never exposed to
// the browser), and proxies the API's raw response back to the frontend.
//
// CD-357: the registration API has no `success` field in its body — it
// signals success purely via HTTP status (200 on success, with a body like
// { message, redirectURL, clickId }). A validation failure comes back as a
// non-2xx with its own body shape. So we don't re-wrap the response here —
// we just forward the upstream status + body as-is, and the frontend keys
// off `response.ok` plus whatever fields are present.

const API_URL = 'https://affdist.dev20.leaddist.team/api/api/registration';
const API_TOKEN = '6dc6586f33394a86157548b348581848171789b96e2420b4c8b0124e86bbf49d';
const TEST_IP = '167.71.76.100';

const BUSINESS_PARAM_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];

function randomHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes; i += 1) {
    out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ errors: ['Method not allowed.'] });
    return;
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const firstName = (body.firstName || '').trim();
  const lastName = (body.lastName || '').trim();
  const phone = (body.phone || '').trim();
  const ip = (body.ip || '').trim() || TEST_IP;

  const errors = [];
  if (!firstName) errors.push('First name is required.');
  if (!lastName) errors.push('Last name is required.');
  if (!phone) errors.push('Phone is required.');

  if (errors.length > 0) {
    res.status(422).json({ errors });
    return;
  }

  const payload = {
    firstName,
    lastName,
    email: `lead-${randomHex(8)}@example.com`,
    phone,
    ip,
    languageIsoCode: (req.headers['accept-language'] || 'en').slice(0, 2) || 'en',
    trafficSource: 'FB',
    externalClickId: (req.query && (req.query.token || req.query.click_id || req.query.external_click_id)) || '',
    browser: req.headers['user-agent'] || '',
    trackingType: 'smart_link_ai_tracker',
  };

  BUSINESS_PARAM_KEYS.forEach((key) => {
    payload[key] = (body[key] || '').toString();
  });

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Token': API_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    let decoded = null;
    try {
      decoded = await apiResponse.json();
    } catch (_e) {
      decoded = null;
    }

    // Proxy the upstream status + body through unchanged.
    res.status(apiResponse.status).json(decoded ?? {});
  } catch (error) {
    res.status(502).json({ errors: [`Registration API request failed: ${error.message}`] });
  }
};
