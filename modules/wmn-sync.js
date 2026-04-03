import fs from 'node:fs'
import path from 'node:path'
import helper from './helper.js'

function convert_wmn_site (site) {
  const pretty_or_check_url = site.uri_pretty || site.uri_check || ''

  if (site.post_body || site.headers) {
    if (!pretty_or_check_url.includes('{account}')) {
      return {
        mode: 'skipped',
        reason: 'username is not directly addressable in uri_pretty or uri_check'
      }
    }
    return {
      mode: 'advanced',
      site: {
        name: site.name,
        url: pretty_or_check_url.replaceAll('{account}', '{username}'),
        category: site.cat || 'misc',
        headers: site.headers || {},
        post_body: site.post_body || ''
      }
    }
  }

  if (!site || !site.uri_check || !site.uri_check.includes('{account}')) {
    return {
      mode: 'skipped',
      reason: 'username is not directly addressable in uri_check'
    }
  }

  const detections = []
  if (site.m_string) {
    detections.push({
      return: 'false',
      string: site.m_string,
      type: 'normal'
    })
  }
  if (site.e_string) {
    detections.push({
      return: 'true',
      string: site.e_string,
      type: 'normal'
    })
  }

  return {
    mode: 'compatible',
    site: {
      url: (site.uri_pretty || site.uri_check).replaceAll('{account}', '{username}'),
      detections,
      selected: 'false',
      timeout: 8,
      implicit: 0,
      extract: [],
      type: `Imported > ${site.cat || 'misc'}`,
      global_rank: 0,
      country: '',
      country_code: 0,
      nsfw: String(site.cat || '').toLowerCase().includes('nsfw') ? 'true' : 'false'
    }
  }
}

function convert_wmn_dataset (dataset) {
  const compatible = []
  const advanced = []
  const skipped = []

  ;(dataset.sites || []).forEach(site => {
    const converted = convert_wmn_site(site)
    if (converted.mode === 'compatible') {
      compatible.push(converted.site)
    } else if (converted.mode === 'advanced') {
      advanced.push(converted.site)
    } else {
      skipped.push({
        name: site.name || 'unknown',
        reason: converted.reason
      })
    }
  })

  return {
    compatible,
    advanced,
    skipped
  }
}

async function sync_whatsmyname_dataset (output_directory = path.join('data', 'imports')) {
  const [status_code, body] = await helper.get_url_wrapper_text(
    'https://raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json',
    30
  )
  if (status_code !== 200 || body === 'error-get-url') {
    throw new Error(`Failed to download WhatsMyName dataset: ${status_code}`)
  }

  const dataset = JSON.parse(body)
  const converted = convert_wmn_dataset(dataset)
  fs.mkdirSync(output_directory, { recursive: true })
  fs.writeFileSync(
    path.join(output_directory, 'whatsmyname-compatible.json'),
    JSON.stringify(converted.compatible, null, 2)
  )
  fs.writeFileSync(
    path.join(output_directory, 'whatsmyname-advanced.json'),
    JSON.stringify(converted.advanced, null, 2)
  )
  fs.writeFileSync(
    path.join(output_directory, 'whatsmyname-skipped.json'),
    JSON.stringify(converted.skipped, null, 2)
  )

  return {
    compatible: converted.compatible.length,
    advanced: converted.advanced.length,
    skipped: converted.skipped.length,
    output_directory
  }
}

export {
  convert_wmn_site,
  convert_wmn_dataset,
  sync_whatsmyname_dataset
}
