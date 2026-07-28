// Vercel serverless function: /api/register
// Receives the form POST from the static page, forwards it to the real
// registration API with the token attached server-side (never exposed to
// the browser), and returns a small JSON result the frontend understands.

const API_URL = 'https://affdist.stage.leaddist.team/api/api/registration';
const API_TOKEN = '6ea59edd68382df128dc815f491903431a9f9776fd57d13e2e9b7bfea298d05b';
const TEST_IP = '167.71.76.100';

const BUSINESS_PARAM_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];

function randomHex(bytes) {
  let out = '';
  for (let i = 0; i < bytes; i += 1) {
    out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return out;
}

function extractApiErrors(decoded, statusCode) {
  if (!decoded || typeof decoded !== 'object') {
    return [`Registration API returned HTTP ${statusCode}.`];
  }

  const errors = [];
  const data = Array.isArray(decoded.data) ? decoded.data : [];

  data.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const msg = item.message || '';
    const field = item.field || '';
    if (msg) errors.push(field ? `${field}: ${msg}` : msg);
  });

  if (errors.length > 0) return errors;
  if (decoded.message) return [decoded.message];
  return [`Registration API returned HTTP ${statusCode}.`];
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, errors: ['Method not allowed.'] });
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
    res.status(422).json({ success: false, errors });
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
    externalClickId: (req.query && (req.query.click_id || req.query.external_click_id)) || '',
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

    // Upstream success is HTTP 2xx with a body (no `success: true` field).
    if (apiResponse.ok) {
      res.status(200).json({
        success: true,
        message: (decoded && decoded.message) || 'Registration request has been sent successfully.',
      });
      return;
    }

    res.status(422).json({
      success: false,
      errors: extractApiErrors(decoded, apiResponse.status),
    });
  } catch (error) {
    res.status(502).json({
      success: false,
      errors: [`Registration API request failed: ${error.message}`],
    });
  }
};
