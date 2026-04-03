import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

import helper from '../../modules/helper.js'
import {
  country_matches_filter,
  get_site_request_timeout,
  normalize_country_filters
} from '../../modules/site-utils.js'

test('country code cn resolves to China', () => {
  assert.equal(helper.find_country('cn'), 'China')
})

test('country filters match both country code and country name', () => {
  const filters = normalize_country_filters('cn us', helper.find_country)

  assert.equal(country_matches_filter('China', filters), true)
  assert.equal(country_matches_filter('United States', filters), true)
  assert.equal(country_matches_filter('Japan', filters), false)
})

test('site request timeout respects site-specific timeout', () => {
  assert.equal(get_site_request_timeout({ timeout: 9 }), 9)
  assert.equal(get_site_request_timeout({ timeout: 0 }), 2)
  assert.equal(get_site_request_timeout({}, 4), 4)
})

test('sites.json includes leetcode.cn as a China platform with special detection', () => {
  const data = JSON.parse(fs.readFileSync('data/sites.json', 'utf8'))
  const site = data.websites_entries.find(item => item.url === 'https://leetcode.cn/u/{username}/')

  assert.ok(site)
  assert.equal(site.country, 'China')
  assert.deepEqual(site.detections, [{
    function: 'special_leetcode_cn_1',
    type: 'special'
  }])
})

test('sites.json includes zhihu as a China platform with special detection', () => {
  const data = JSON.parse(fs.readFileSync('data/sites.json', 'utf8'))
  const site = data.websites_entries.find(item => item.url === 'https://www.zhihu.com/people/{username}')

  assert.ok(site)
  assert.equal(site.country, 'China')
  assert.deepEqual(site.detections, [{
    function: 'special_zhihu_1',
    type: 'special'
  }])
})
