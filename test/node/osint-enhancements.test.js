import test from 'node:test'
import assert from 'node:assert/strict'

import {
  convert_wmn_site,
  convert_wmn_dataset
} from '../../modules/wmn-sync.js'
import {
  collect_recursive_candidates,
  extract_username_from_url
} from '../../modules/recursive-search.js'
import {
  serialize_results_to_csv,
  serialize_results_to_json
} from '../../modules/export-results.js'
import {
  serialize_results_to_html
} from '../../modules/html-report.js'
import {
  classify_site_response
} from '../../modules/site-doctor.js'

test('convert_wmn_site maps a compatible WhatsMyName site into social-analyzer format', () => {
  const converted = convert_wmn_site({
    name: 'about.me',
    uri_check: 'https://about.me/{account}',
    e_code: 200,
    e_string: ' | about.me',
    m_code: 404,
    m_string: 'about.me',
    cat: 'social'
  })

  assert.equal(converted.mode, 'compatible')
  assert.equal(converted.site.url, 'https://about.me/{username}')
  assert.equal(converted.site.type, 'Imported > social')
  assert.deepEqual(converted.site.detections, [
    {
      return: 'false',
      string: 'about.me',
      type: 'normal'
    },
    {
      return: 'true',
      string: ' | about.me',
      type: 'normal'
    }
  ])
})

test('convert_wmn_dataset separates compatible and advanced entries', () => {
  const converted = convert_wmn_dataset({
    sites: [
      {
        name: 'about.me',
        uri_check: 'https://about.me/{account}',
        e_string: 'ok',
        m_string: 'missing',
        cat: 'social'
      },
      {
        name: 'AniList',
        uri_check: 'https://graphql.anilist.co',
        uri_pretty: 'https://anilist.co/user/{account}',
        post_body: '{}',
        headers: {
          'Content-Type': 'application/json'
        },
        e_string: '"id":',
        m_string: 'Not Found',
        cat: 'social'
      }
    ]
  })

  assert.equal(converted.compatible.length, 1)
  assert.equal(converted.advanced.length, 1)
  assert.equal(converted.compatible[0].url, 'https://about.me/{username}')
  assert.equal(converted.advanced[0].name, 'AniList')
})

test('extract_username_from_url returns likely usernames from profile urls', () => {
  assert.equal(extract_username_from_url('https://github.com/octocat'), 'octocat')
  assert.equal(extract_username_from_url('https://www.zhihu.com/people/excited-vczh'), 'excited-vczh')
  assert.equal(extract_username_from_url('https://leetcode.cn/u/gg_boy/'), 'gg_boy')
  assert.equal(extract_username_from_url('https://example.com/users/'), '')
})

test('collect_recursive_candidates gathers aliases and linked usernames', () => {
  const candidates = collect_recursive_candidates([
    {
      username: 'seed-user',
      link: 'https://leetcode.cn/u/seed-user/',
      aliases: ['octocat'],
      metadata: [
        {
          name: 'github',
          content: 'https://github.com/torvalds'
        }
      ],
      extracted: [
        {
          type: 'link',
          matched: 'https://www.zhihu.com/people/excited-vczh'
        }
      ]
    }
  ], ['seed-user'])

  assert.deepEqual(candidates, [
    {
      username: 'octocat',
      discovered_from: 'seed-user',
      source_url: 'https://leetcode.cn/u/seed-user/'
    },
    {
      username: 'torvalds',
      discovered_from: 'seed-user',
      source_url: 'https://leetcode.cn/u/seed-user/'
    },
    {
      username: 'excited-vczh',
      discovered_from: 'seed-user',
      source_url: 'https://leetcode.cn/u/seed-user/'
    }
  ])
})

test('serialize_results_to_csv flattens detected profiles into rows', () => {
  const csv = serialize_results_to_csv({
    detected: [
      {
        username: 'octocat',
        link: 'https://github.com/octocat',
        status: 'good',
        aliases: ['octo']
      }
    ]
  })

  assert.match(csv, /bucket,username,link,status,aliases/)
  assert.match(csv, /detected,octocat,https:\/\/github.com\/octocat,good,octo/)
})

test('serialize_results_to_json preserves formatted indentation', () => {
  const json = serialize_results_to_json({
    detected: [{ username: 'octocat' }]
  })

  assert.match(json, /\n  "detected": \[/)
  assert.match(json, /"username": "octocat"/)
})

test('serialize_results_to_html renders summary and detected rows', () => {
  const html = serialize_results_to_html({
    username: 'octocat',
    scope: {
      mode: 'fast',
      countries: 'all',
      websites: 'github.com',
      type: 'all',
      top: '0'
    },
    summary: {
      detected: 1,
      unknown: 0,
      failed: 0,
      recursive: 0
    },
    detected: [
      {
        username: 'octocat',
        link: 'https://github.com/octocat',
        status: 'good'
      }
    ]
  })

  assert.match(html, /Social Analyzer Report/)
  assert.match(html, /Detected<strong>1<\/strong>/)
  assert.match(html, /https:\/\/github\.com\/octocat/)
})

test('classify_site_response detects captcha, waf, timeouts and normal responses', () => {
  assert.deepEqual(classify_site_response(200, '<html>Attention Required! | Cloudflare captcha</html>'), {
    status: 'captcha',
    reason: 'challenge page detected'
  })
  assert.deepEqual(classify_site_response(403, '<html>SafeLine WAF</html>'), {
    status: 'blocked',
    reason: 'waf or access denied page detected'
  })
  assert.deepEqual(classify_site_response(500, 'error-get-url'), {
    status: 'timeout',
    reason: 'request failed or timed out'
  })
  assert.deepEqual(classify_site_response(200, '<html><title>Profile</title></html>'), {
    status: 'ok',
    reason: 'response looks reachable'
  })
})
