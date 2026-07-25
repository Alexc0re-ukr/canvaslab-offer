<?php

declare(strict_types=1);

$apiUrl = 'https://affdist.dev20.leaddist.team/api/api/registration';
$apiToken = '6dc6586f33394a86157548b348581848171789b96e2420b4c8b0124e86bbf49d';
$ip = '167.71.76.100';

$businessParams = [
    'p1' => 'Traffic model',
    'p2' => 'Campaign name',
    'p3' => 'Audience segment',
    'p4' => 'Creative angle',
    'p5' => 'Ad placement',
    'p6' => 'Funnel step',
    'p7' => 'Partner tag',
    'p8' => 'Offer variant',
    'p9' => 'Media buyer',
    'p10' => 'Internal note',
];

$form = [
    'firstName' => '',
    'lastName' => '',
    'phone' => '',
];

foreach ($businessParams as $key => $_label) {
    $form[$key] = '';
}

$errors = [];
$successMessage = null;
$isAjaxRequest = ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($form as $key => $_value) {
        $form[$key] = trim((string) ($_POST[$key] ?? ''));
    }

    if ($form['firstName'] === '') {
        $errors[] = 'First name is required.';
    }

    if ($form['lastName'] === '') {
        $errors[] = 'Last name is required.';
    }

    if ($form['phone'] === '') {
        $errors[] = 'Phone is required.';
    }

    if ($errors === []) {
        $payload = [
            'firstName' => $form['firstName'],
            'lastName' => $form['lastName'],
            'email' => sprintf('lead-%s@example.com', bin2hex(random_bytes(8))),
            'phone' => $form['phone'],
            'ip' => $ip ?? $_SERVER['REMOTE_ADDR'] ?? '',
            'languageIsoCode' => substr((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'en'), 0, 2) ?: 'en',
            'trafficSource' => 'FB',
            'externalClickId' => (string) ($_GET['click_id'] ?? $_GET['external_click_id'] ?? ''),
            'browser' => (string) ($_SERVER['HTTP_USER_AGENT'] ?? ''),
            'trackingType' => 'smart_link_ai_tracker',
        ];

        foreach ($businessParams as $key => $_label) {
            $payload[$key] = $form[$key];
        }

        $response = sendRegistrationRequest($apiUrl, $apiToken, $payload);

        if ($response['success']) {
            $successMessage = 'Registration request has been sent successfully.';
            foreach ($form as $key => $_value) {
                $form[$key] = '';
            }
        } else {
            $errors = $response['errors'];
        }
    }

    if ($isAjaxRequest) {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code($errors === [] ? 200 : 422);
        echo json_encode([
            'success' => $errors === [],
            'message' => $successMessage,
            'errors' => $errors,
        ], JSON_THROW_ON_ERROR);
        exit;
    }
}

function sendRegistrationRequest(string $apiUrl, string $apiToken, array $payload): array
{
    if (!function_exists('curl_init')) {
        return [
            'success' => false,
            'errors' => ['Server error: PHP cURL extension is not enabled.'],
        ];
    }

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Api-Token: ' . $apiToken,
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR),
        CURLOPT_TIMEOUT => 15,
    ]);

    $body = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        return [
            'success' => false,
            'errors' => ['Registration API request failed: ' . $curlError],
        ];
    }

    $decoded = json_decode((string) $body, true);

    if ($statusCode >= 200 && $statusCode < 300 && is_array($decoded) && ($decoded['success'] ?? false) === true) {
        return [
            'success' => true,
            'errors' => [],
        ];
    }

    return [
        'success' => false,
        'errors' => extractApiErrors($decoded, $statusCode),
    ];
}

function extractApiErrors(mixed $decoded, int $statusCode): array
{
    if (!is_array($decoded)) {
        return [sprintf('Registration API returned HTTP %d.', $statusCode)];
    }

    $errors = [];

    foreach (($decoded['data'] ?? []) as $item) {
        if (!is_array($item)) {
            continue;
        }

        $message = (string) ($item['message'] ?? '');
        $field = (string) ($item['field'] ?? '');

        if ($message !== '') {
            $errors[] = $field !== '' ? sprintf('%s: %s', humanizeField($field), $message) : $message;
        }
    }

    if ($errors !== []) {
        return $errors;
    }

    if (isset($decoded['message']) && is_string($decoded['message']) && $decoded['message'] !== '') {
        return [$decoded['message']];
    }

    return [sprintf('Registration API returned HTTP %d.', $statusCode)];
}

function humanizeField(string $field): string
{
    return ucwords(str_replace('_', ' ', $field));
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CanvasLab Offer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="layout">
    <section>
      <p>Course bundle</p>
      <h1>CanvasLab Design Sprint</h1>
      <span>Fake UI lessons, portfolio prompts, and mentor review offer text.</span>
    </section>
    <aside>
      <h2 id="spots">18 seats left</h2>

      <?php if ($successMessage !== null): ?>
        <div class="message message-success"><?= e($successMessage) ?></div>
      <?php endif; ?>

      <?php if ($errors !== []): ?>
        <div class="message message-error">
          <strong>Registration failed</strong>
          <ul>
            <?php foreach ($errors as $error): ?>
              <li><?= e($error) ?></li>
            <?php endforeach; ?>
          </ul>
        </div>
      <?php endif; ?>

      <div id="formMessage" class="message" hidden></div>

      <form method="post" action="" id="registrationForm">
        <label>
          <span>First name</span>
          <input name="firstName" value="<?= e($form['firstName']) ?>" autocomplete="given-name" required>
        </label>
        <label>
          <span>Last name</span>
          <input name="lastName" value="<?= e($form['lastName']) ?>" autocomplete="family-name" required>
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" value="<?= e($form['phone']) ?>" autocomplete="tel" required>
        </label>

        <?php foreach ($businessParams as $key => $_label): ?>
          <input type="hidden" name="<?= e($key) ?>" value="<?= e($form[$key]) ?>">
        <?php endforeach; ?>

        <button type="button" id="randomizeButton">Randomize test data</button>
        <button type="submit" id="seatButton">Reserve demo seat</button>
      </form>
    </aside>
  </main>
  <script src="script.js"></script>
</body>
</html>
