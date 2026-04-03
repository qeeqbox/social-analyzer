function normalize_cell (value) {
  if (Array.isArray(value)) {
    return value.join('|')
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value)
  }
  if (typeof value === 'undefined' || value === null) {
    return ''
  }
  return String(value)
}

function escape_csv_cell (value) {
  const normalized = normalize_cell(value)
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replaceAll('"', '""')}"`
  }
  return normalized
}

function serialize_results_to_csv (results) {
  const rows = []
  const headers = ['bucket', 'username', 'link', 'status', 'aliases']
  rows.push(headers.join(','))

  Object.entries(results).forEach(([bucket, items]) => {
    if (!Array.isArray(items)) {
      return
    }
    items.forEach(item => {
      rows.push([
        bucket,
        item.username || '',
        item.link || '',
        item.status || '',
        item.aliases || ''
      ].map(escape_csv_cell).join(','))
    })
  })

  return rows.join('\n')
}

function serialize_results_to_json (results) {
  return JSON.stringify(results, null, 2)
}

export {
  serialize_results_to_csv,
  serialize_results_to_json
}
