import sanitizeHtml from 'sanitize-html'

const xquik_users_url = 'https://xquik.com/api/v1/x/users'
const x_hosts = new Set(['x.com', 'twitter.com', 'mobile.twitter.com'])

function normalize_username (username) {
  if (typeof username !== 'string') {
    return ''
  }
  const normalized = username.trim().replace(/^@/, '')
  return /^[a-zA-Z0-9_]{1,50}$/.test(normalized) ? normalized : ''
}

function sanitize_text (value, fallback = 'unavailable') {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const sanitized = sanitizeHtml(String(value), {
    allowedTags: [],
    allowedAttributes: {}
  }).trim()
  return sanitized || fallback
}

function is_x_site (site) {
  try {
    const hostname = new URL(site.url.replace('{username}', 'username')).hostname
    return x_hosts.has(hostname)
  } catch {
    return false
  }
}

function create_metadata (user) {
  const fields = [
    ['x:user_id', user.id],
    ['x:followers', user.followers],
    ['x:following', user.following],
    ['x:verified', user.verified],
    ['x:verified_type', user.verifiedType],
    ['x:location', user.location],
    ['x:created_at', user.createdAt],
    ['x:profile_image', user.profilePicture]
  ]
  return fields
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => ({
      name,
      content: sanitize_text(value)
    }))
}

function get_method (options) {
  const find = options.includes('FindUserProfilesFast')
  const get = options.includes('GetUserProfilesFast')
  if (find && get) {
    return 'all'
  }
  return find ? 'find' : 'get'
}

function create_profile (username, options, site, user) {
  const normalized = normalize_username(username)
  if (!normalized || normalize_username(user?.username).toLowerCase() !== normalized.toLowerCase()) {
    return undefined
  }
  return {
    found: 2,
    username: sanitize_text(user.username, normalized),
    image: '',
    link: `https://x.com/${encodeURIComponent(normalized)}`,
    rate: '%100.00',
    status: 'good',
    title: sanitize_text(user.name, normalized),
    language: 'unavailable',
    country: site.country || 'unavailable',
    rank: site.global_rank || 'unavailable',
    text: sanitize_text(user.description),
    type: site.type || 'unavailable',
    metadata: options.includes('ExtractMetadata') ? create_metadata(user) : '',
    extracted: '',
    good: 'true',
    method: get_method(options)
  }
}

async function find_username (username, options, site, api_key, get_json) {
  const normalized = normalize_username(username)
  if (!normalized || !is_x_site(site) || typeof api_key !== 'string' || api_key.trim() === '') {
    return undefined
  }
  try {
    const response = await get_json(
      `${xquik_users_url}/${encodeURIComponent(normalized)}`,
      10,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'social-analyzer/2.0.32',
          'x-api-key': api_key.trim()
        }
      }
    )
    return create_profile(normalized, options, site, response?.data)
  } catch {
    return undefined
  }
}

export {
  create_profile,
  find_username,
  is_x_site,
  normalize_username
}

export default {
  find_username
}
