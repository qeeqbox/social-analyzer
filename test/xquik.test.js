import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import {
  create_profile,
  find_username,
  is_x_site,
  normalize_username
} from '../modules/xquik-scan.js'

const twitter_site = {
  url: 'https://mobile.twitter.com/{username}',
  country: 'United States',
  global_rank: 35,
  type: 'Internet'
}

const user = {
  id: '123',
  username: 'github',
  name: '<b>GitHub</b>',
  description: '<script>bad()</script>Open source projects',
  followers: 2800000,
  following: 350,
  verified: true,
  verifiedType: 'business',
  location: 'San Francisco',
  createdAt: '2008-02-11T04:23:23Z',
  profilePicture: 'https://example.com/avatar.png'
}

test('normalizes X usernames and rejects invalid paths', () => {
  assert.equal(normalize_username(' @GitHub '), 'GitHub')
  assert.equal(normalize_username('../github'), '')
  assert.equal(normalize_username(''), '')
})

test('recognizes only X and Twitter profile sites', () => {
  assert.equal(is_x_site(twitter_site), true)
  assert.equal(is_x_site({ url: 'https://x.com/{username}' }), true)
  assert.equal(is_x_site({ url: 'https://example.com/{username}' }), false)
  assert.equal(is_x_site({ url: 'invalid' }), false)
})

test('maps an exact Xquik profile into Social Analyzer output', () => {
  const profile = create_profile(
    'GitHub',
    ['FindUserProfilesFast', 'GetUserProfilesFast', 'ExtractMetadata'],
    twitter_site,
    user
  )
  assert.equal(profile.username, 'github')
  assert.equal(profile.link, 'https://x.com/GitHub')
  assert.equal(profile.title, 'GitHub')
  assert.equal(profile.text, 'Open source projects')
  assert.equal(profile.status, 'good')
  assert.equal(profile.method, 'all')
  assert.deepEqual(profile.metadata[0], {
    name: 'x:user_id',
    content: '123'
  })
  assert.equal(profile.metadata.length, 8)
})

test('rejects a search result for a different username', () => {
  assert.equal(create_profile('github', [], twitter_site, {
    username: 'not-github'
  }), undefined)
})

test('uses the published Xquik endpoint without exposing the key', async () => {
  let request
  const profile = await find_username(
    '@github',
    ['FindUserProfilesFast'],
    twitter_site,
    ' test-key ',
    async (...args) => {
      request = args
      return { data: user }
    }
  )
  assert.equal(request[0], 'https://xquik.com/api/v1/x/users/github')
  assert.equal(request[1], 10)
  assert.deepEqual(request[2], {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'social-analyzer/2.0.32',
      'x-api-key': 'test-key'
    }
  })
  assert.equal(profile.method, 'find')
  assert.equal(JSON.stringify(profile).includes('test-key'), false)
})

test('skips Xquik without a key and falls back after request errors', async () => {
  let calls = 0
  const get_json = async () => {
    calls += 1
    throw new Error('temporary failure')
  }
  assert.equal(await find_username('github', [], twitter_site, '', get_json), undefined)
  assert.equal(calls, 0)
  assert.equal(await find_username('github', [], twitter_site, 'key', get_json), undefined)
  assert.equal(calls, 1)
})

test('does not send non-X usernames to Xquik', async () => {
  let calls = 0
  const get_json = async () => {
    calls += 1
    return { data: user }
  }
  const profile = await find_username(
    'github',
    [],
    { url: 'https://github.com/{username}' },
    'test-key',
    get_json
  )
  assert.equal(profile, undefined)
  assert.equal(calls, 0)
})

test('keeps the current X profile marker in both detection databases', () => {
  for (const path of ['data/sites.json', 'data/sites.json_new']) {
    const sites = JSON.parse(fs.readFileSync(path)).websites_entries
    const twitter = sites.find(site => site.url === twitter_site.url)
    assert.ok(twitter)
    assert.ok(twitter.detections.some(detection => {
      return detection.type === 'normal' &&
        detection.return === 'true' &&
        detection.string === 'property="profile:username" content="{username}"'
    }))
  }
})
