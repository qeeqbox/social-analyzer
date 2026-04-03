import { country_matches_filter, normalize_country_filters } from './site-utils.js'

function snapshot_site_selection (sites) {
  return sites.map(site => site.selected || 'false')
}

function restore_site_selection (sites, snapshot) {
  sites.forEach((site, index) => {
    site.selected = snapshot[index] || 'false'
  })
}

function finalize_pending_selection (sites) {
  sites.forEach((site) => {
    site.selected = site.selected === 'pending' ? 'true' : 'false'
  })
}

function apply_site_filters (sites, filters = {}, find_country = {}) {
  const websites = (filters.websites || 'all').trim()
  const countries = filters.countries || 'all'
  const type = filters.type || 'all'
  const top = Number(filters.top || 0)

  sites.forEach((site) => {
    site.selected = 'false'
  })

  if (websites === 'all') {
    if (countries !== 'all') {
      const list_of_countries = normalize_country_filters(countries, find_country)
      sites.forEach((site) => {
        site.selected = country_matches_filter(site.country, list_of_countries) ? 'true' : 'false'
      })
    } else {
      sites.forEach((site) => {
        site.selected = 'true'
      })
    }

    if (type !== 'all') {
      const selected_sites = sites.filter((site) => site.selected === 'true')
      selected_sites
        .filter((site) => site.type.toLowerCase().includes(type.toLowerCase()))
        .forEach((site) => {
          site.selected = 'pending'
        })
      finalize_pending_selection(sites)
    }

    if (top !== 0) {
      const selected_sites = sites
        .filter((site) => site.selected === 'true')
        .filter((site) => site.global_rank !== 0)
        .sort((a, b) => a.global_rank - b.global_rank)

      for (let i = 0; i < top && i < selected_sites.length; i++) {
        selected_sites[i].selected = 'pending'
      }

      finalize_pending_selection(sites)
    }

    return sites
  }

  const requested_sites = websites.split(' ').filter(Boolean)
  sites.forEach((site) => {
    if (requested_sites.some((item) => site.url.toLowerCase().includes(item.toLowerCase()))) {
      site.selected = 'true'
    }
  })

  return sites
}

export {
  apply_site_filters,
  restore_site_selection,
  snapshot_site_selection
}
