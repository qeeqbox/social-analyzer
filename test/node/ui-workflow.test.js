import test from 'node:test'
import assert from 'node:assert/strict'

import {
  apply_site_filters,
  snapshot_site_selection,
  restore_site_selection
} from '../../modules/site-selection.js'
import {
  build_analysis_summary
} from '../../modules/ui-summary.js'

test('apply_site_filters keeps only top ranked websites for selected country', () => {
  const sites = [
    {
      url: 'https://github.com/{username}',
      selected: 'false',
      country: 'United States',
      global_rank: 1,
      type: 'Social'
    },
    {
      url: 'https://www.zhihu.com/people/{username}',
      selected: 'false',
      country: 'China',
      global_rank: 2,
      type: 'Forum'
    },
    {
      url: 'https://www.douban.com/people/{username}',
      selected: 'false',
      country: 'China',
      global_rank: 10,
      type: 'Social'
    }
  ]

  apply_site_filters(sites, {
    websites: 'all',
    countries: 'cn',
    top: 1
  }, (country) => {
    return country === 'cn' ? 'China' : ''
  })

  assert.deepEqual(sites.map((site) => site.selected), ['false', 'true', 'false'])
})

test('apply_site_filters respects explicit website filters', () => {
  const sites = [
    {
      url: 'https://github.com/{username}',
      selected: 'false',
      country: 'United States',
      global_rank: 1,
      type: 'Social'
    },
    {
      url: 'https://www.zhihu.com/people/{username}',
      selected: 'false',
      country: 'China',
      global_rank: 2,
      type: 'Forum'
    }
  ]

  apply_site_filters(sites, {
    websites: 'zhihu.com'
  })

  assert.deepEqual(sites.map((site) => site.selected), ['false', 'true'])
})

test('apply_site_filters supports type filters after country selection', () => {
  const sites = [
    {
      url: 'https://www.zhihu.com/people/{username}',
      selected: 'false',
      country: 'China',
      global_rank: 2,
      type: 'Forum'
    },
    {
      url: 'https://www.douban.com/people/{username}',
      selected: 'false',
      country: 'China',
      global_rank: 10,
      type: 'Social'
    }
  ]

  apply_site_filters(sites, {
    websites: 'all',
    countries: 'cn',
    type: 'social'
  }, (country) => {
    return country === 'cn' ? 'China' : ''
  })

  assert.deepEqual(sites.map((site) => site.selected), ['false', 'true'])
})

test('snapshot and restore site selection round-trip selected flags', () => {
  const sites = [
    { selected: 'true' },
    { selected: 'false' }
  ]

  const snapshot = snapshot_site_selection(sites)
  sites[0].selected = 'false'
  sites[1].selected = 'true'
  restore_site_selection(sites, snapshot)

  assert.deepEqual(sites.map((site) => site.selected), ['true', 'false'])
})

test('build_analysis_summary counts detected, unknown, failed and recursive results', () => {
  const summary = build_analysis_summary({
    common: [{ word: 'john' }],
    words_info: [{ word: 'john' }],
    user_info_normal: {
      data: [
        { method: 'all', good: 'true' },
        { method: 'all', good: 'false' },
        { method: 'failed', good: 'false' }
      ]
    },
    user_info_advanced: {
      data: [{ found: 1, image: '' }]
    },
    user_info_special: {
      data: [{ found: 1 }]
    },
    recursive_results: [{ username: 'octocat' }]
  })

  assert.deepEqual(summary, {
    detected: 3,
    unknown: 1,
    failed: 1,
    recursive: 1,
    sections: 8
  })
})
