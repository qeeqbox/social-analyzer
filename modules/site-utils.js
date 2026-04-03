function get_site_request_timeout (site, fallback = 2) {
  if (site && Number(site.timeout) > 0) {
    return Number(site.timeout)
  }

  return fallback
}

function normalize_country_filters (countries, find_country) {
  return countries
    .toLowerCase()
    .split(' ')
    .map(item => item.trim())
    .filter(Boolean)
    .flatMap(item => {
      const byCode = find_country(item)
      if (byCode !== '') {
        return [item, byCode.toLowerCase()]
      }

      return [item]
    })
}

function country_matches_filter (site_country, filters) {
  if (!site_country) {
    return false
  }

  return filters.includes(site_country.toLowerCase())
}

export {
  country_matches_filter,
  get_site_request_timeout,
  normalize_country_filters
}
