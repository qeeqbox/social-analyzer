function escape_html (value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function render_profile_rows (title, items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return ''
  }

  const rows = items.map((item) => {
    const username = escape_html(item.username || '')
    const link = escape_html(item.link || '')
    const status = escape_html(item.status || '')
    const discovered_from = escape_html(item.discovered_from || '')
    return `<tr><td>${username}</td><td><a href="${link}">${link}</a></td><td>${status}</td><td>${discovered_from}</td></tr>`
  }).join('')

  return `
    <section class="report-section">
      <h2>${escape_html(title)}</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Link</th>
            <th>Status</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

function serialize_results_to_html (results = {}) {
  const summary = results.summary || {}
  const scope = results.scope || {}
  const generated_at = new Date().toISOString()

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Social Analyzer Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #1b1b1b; background: #faf8f2; }
    h1, h2 { margin: 0 0 12px; }
    .meta { margin-bottom: 24px; color: #555; }
    .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
    .card { padding: 12px 16px; border: 1px solid #d9cfba; background: #fff; min-width: 120px; }
    .card strong { display: block; font-size: 24px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; background: #fff; }
    th, td { border: 1px solid #e6dcc7; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f4ead6; }
    .report-section { margin-bottom: 24px; }
    .scope { margin-bottom: 16px; }
    a { color: #6f4300; }
  </style>
</head>
<body>
  <h1>Social Analyzer Report</h1>
  <div class="meta">Generated at ${escape_html(generated_at)}</div>
  <div class="scope">
    <div><strong>Username:</strong> ${escape_html(results.username || '')}</div>
    <div><strong>Mode:</strong> ${escape_html(scope.mode || '')}</div>
    <div><strong>Countries:</strong> ${escape_html(scope.countries || 'all')}</div>
    <div><strong>Websites:</strong> ${escape_html(scope.websites || 'all')}</div>
    <div><strong>Type:</strong> ${escape_html(scope.type || 'all')}</div>
    <div><strong>Top:</strong> ${escape_html(scope.top || '0')}</div>
  </div>
  <div class="summary">
    <div class="card">Detected<strong>${escape_html(summary.detected || 0)}</strong></div>
    <div class="card">Unknown<strong>${escape_html(summary.unknown || 0)}</strong></div>
    <div class="card">Failed<strong>${escape_html(summary.failed || 0)}</strong></div>
    <div class="card">Recursive<strong>${escape_html(summary.recursive || 0)}</strong></div>
  </div>
  ${render_profile_rows('Detected Profiles', results.detected)}
  ${render_profile_rows('Unknown Profiles', results.unknown)}
  ${render_profile_rows('Failed Profiles', results.failed)}
</body>
</html>`
}

export {
  serialize_results_to_html
}
