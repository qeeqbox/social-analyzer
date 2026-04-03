const reserved_segments = new Set([
  'people',
  'person',
  'user',
  'users',
  'member',
  'members',
  'profile',
  'profiles',
  'summary',
  'about',
  'u'
])

function extract_username_from_url (value) {
  try {
    const temp_url = new URL(value)
    const segments = temp_url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      return ''
    }
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i]
      if (!reserved_segments.has(segment.toLowerCase()) && /^[a-z0-9._-]{2,40}$/i.test(segment)) {
        return segment
      }
    }
  } catch (err) {
    return ''
  }
  return ''
}

function collect_urls_from_metadata (metadata) {
  const urls = []
  if (Array.isArray(metadata)) {
    metadata.forEach(item => {
      if (item && typeof item.content === 'string' && item.content.startsWith('http')) {
        urls.push(item.content)
      }
    })
  }
  return urls
}

function collect_urls_from_extracted (extracted) {
  const urls = []
  if (Array.isArray(extracted)) {
    extracted.forEach(item => {
      if (item && typeof item.matched === 'string' && item.matched.startsWith('http')) {
        urls.push(item.matched)
      }
    })
  }
  return urls
}

function collect_recursive_candidates (profiles, excluded_usernames = []) {
  const excluded = new Set(excluded_usernames.map(item => item.toLowerCase()))
  const seen = new Set()
  const results = []

  profiles.forEach(item => {
    const candidates = []
    if (Array.isArray(item.aliases)) {
      candidates.push(...item.aliases)
    }
    collect_urls_from_metadata(item.metadata).forEach(url => {
      const username = extract_username_from_url(url)
      if (username !== '') {
        candidates.push(username)
      }
    })
    collect_urls_from_extracted(item.extracted).forEach(url => {
      const username = extract_username_from_url(url)
      if (username !== '') {
        candidates.push(username)
      }
    })

    candidates.forEach(username => {
      const normalized = username.toLowerCase()
      if (normalized === '' || excluded.has(normalized) || seen.has(normalized)) {
        return
      }
      seen.add(normalized)
      results.push({
        username: username,
        discovered_from: item.username || '',
        source_url: item.link || ''
      })
    })
  })

  return results
}

export {
  collect_recursive_candidates,
  extract_username_from_url
}
