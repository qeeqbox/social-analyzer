function is_non_empty_object (value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0
}

function build_analysis_summary (data = {}) {
  const normal_profiles = (((data.user_info_normal || {}).data) || [])
  const advanced_profiles = (((data.user_info_advanced || {}).data) || [])
  const special_profiles = (((data.user_info_special || {}).data) || [])
  const recursive_profiles = data.recursive_results || []

  const detected = normal_profiles.filter((site) => {
    return (site.method === 'all' || site.method === 'find') && site.good === 'true'
  }).length +
    advanced_profiles.filter((site) => site.found > 0 || site.image !== '').length +
    special_profiles.filter((site) => site.found > 0).length

  const unknown = normal_profiles.filter((site) => {
    return (site.method === 'all' && site.good !== 'true') || site.method === 'get'
  }).length

  const failed = normal_profiles.filter((site) => site.method === 'failed').length

  const sections = [
    (data.common || []).length > 0,
    (((data.info || {}).items) || []).length > 0,
    (data.words_info || []).length > 0,
    detected > 0,
    unknown > 0,
    failed > 0,
    advanced_profiles.length > 0,
    special_profiles.length > 0,
    (data.names_origins || []).length > 0,
    (data.custom_search || []).length > 0,
    recursive_profiles.length > 0,
    (data.ages || []).length > 0,
    is_non_empty_object(data.table),
    is_non_empty_object(data.stats),
    (((data.graph || {}).graph || {}).nodes || []).length > 0
  ].filter(Boolean).length

  return {
    detected,
    unknown,
    failed,
    recursive: recursive_profiles.length,
    sections
  }
}

export {
  build_analysis_summary
}
