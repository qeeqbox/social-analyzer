import helper from './helper.js'
import async from 'async'
import {Builder,By,Key} from 'selenium-webdriver'
import firefox from 'selenium-webdriver/firefox.js'
import { get_site_request_timeout } from './site-utils.js'
import { extract_username_from_url } from './recursive-search.js'

async function find_username_special (req) {
  const time = new Date()
  const functions = []
  helper.websites_entries.forEach((site) => {
    if ('status' in site) {
      if (site.status === 'bad') {
        return Promise.resolve()
      }
    }
    if (site.selected === 'true') {
      site.detections.forEach((detection) => {
        if (detection.type === 'special') {
          if (detection.function === 'special_facebook_1') {
            functions.push(find_username_site_special_facebook_1.bind(null, req.body.uuid, req.body.string, site))
          } else if (detection.function === 'special_gmail_1') {
            functions.push(find_username_site_special_gmail_1.bind(null, req.body.uuid, req.body.string, site))
          } else if (detection.function === 'special_google_1') {
            functions.push(find_username_site_special_google_1.bind(null, req.body.uuid, req.body.string, site))
          } else if (detection.function === 'special_leetcode_cn_1') {
            functions.push(find_username_site_special_leetcode_cn_1.bind(null, req.body.uuid, req.body.string, site))
          } else if (detection.function === 'special_zhihu_1') {
            functions.push(find_username_site_special_zhihu_1.bind(null, req.body.uuid, req.body.string, site))
          }
        }
      })
    }
  })
  const results = await async.parallelLimit(functions, 5)
  helper.verbose && console.log(`Total time ${new Date() - time}`)
  return results.filter(item => item !== undefined)
}

async function find_username_site_special_facebook_1 (uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
    const driver = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(new firefox.Options().headless().windowSize({
        width: 640,
        height: 480
      }))
      .build()

    try {
      const timeouts = {
        implicit: 0,
        pageLoad: 10000,
        script: 10000
      }

      let source = ''
      const temp_profile = Object.assign({}, helper.profile_template)
      const link = 'https://mbasic.facebook.com/login/identify/?ctx=recoveqr'
      await driver.manage().setTimeouts(timeouts)
      await driver.get(link)
      await driver.findElement(By.id('identify_search_text_input')).sendKeys(username)
      await driver.findElement(By.id('did_submit')).click()
      source = await driver.getPageSource()
      await driver.quit()
      if (source.includes('Try Entering Your Password')) {
        temp_profile.found += 1
      }
      if (temp_profile.found > 0) {
        temp_profile.text = 'unavailable'
        temp_profile.title = 'unavailable'
        temp_profile.rate = '%' + ((temp_profile.found / 1) * 100).toFixed(2)
        temp_profile.link = site.url.replace('{username}', username)
        temp_profile.type = site.type
        resolve(temp_profile)
      } else {
        resolve(undefined)
      }
    } catch (err) {
      if (driver !== undefined) {
        try {
          await driver.quit()
        } catch (err) {
          helper.verbose && console.log('Driver Session Issue')
        }
      }
      resolve(undefined)
    }
  })
}

async function find_username_site_special_gmail_1 (uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
    const driver = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(new firefox.Options().headless().windowSize({
        width: 640,
        height: 480
      }))
      .build()

    try {
      const timeouts = {
        implicit: 0,
        pageLoad: 10000,
        script: 10000
      }

      const temp_profile = Object.assign({}, helper.profile_template)
      const link = 'https://accounts.google.com/signup/v2/webcreateaccount?service=mail&continue=https%3A%2F%2Fmail.google.com%2Fmail%2F%3Fpc%3Dtopnav-about-n-en&flowName=GlifWebSignIn&flowEntry=SignUp'
      await driver.manage().setTimeouts(timeouts)
      await driver.get(link)
      await driver.findElement(By.id('username')).sendKeys(username)
      await driver.findElement(By.id('selectioni1')).click()
      const text_only = await driver.findElement(By.tagName('body')).getText()
      await driver.quit()
      if (text_only.includes('That username is taken') && !text_only.includes('your username must be between') && !text_only.includes('You can use letters')) {
        temp_profile.found += 1
      }
      if (temp_profile.found > 0) {
        temp_profile.text = username + '@gmail.com'
        temp_profile.title = 'unavailable'
        temp_profile.rate = '%' + ((temp_profile.found / 1) * 100).toFixed(2)
        temp_profile.link = 'https://google.com'
        temp_profile.type = site.type
        resolve(temp_profile)
      } else {
        resolve(undefined)
      }
    } catch (err) {
      if (driver !== undefined) {
        try {
          await driver.quit()
        } catch (err) {
          helper.verbose && console.log('Driver Session Issue')
        }
      }
      resolve(undefined)
    }
  })
}

async function find_username_site_special_google_1 (uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
    const driver = new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(new firefox.Options().headless().windowSize({
        width: 640,
        height: 480
      }))
      .build()

    try {
      const timeouts = {
        implicit: 0,
        pageLoad: 10000,
        script: 10000
      }

      const temp_profile = Object.assign({}, helper.profile_template)
      const link = 'https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&service=mail&sacu=1&rip=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin'
      await driver.manage().setTimeouts(timeouts)
      await driver.get(link)
      await driver.findElement(By.id('identifierId')).sendKeys(username)
      await driver.findElement(By.xpath("//button[contains(.,'Next')]")).click()
      const text_only = await driver.findElement(By.tagName('body')).getText()
      await driver.quit()
      if (text_only.includes("Couldn't sign you in") && !text_only.includes("Couldn't find your")) {
        temp_profile.found += 1
      }
      if (temp_profile.found > 0) {
        temp_profile.text = username + '@gmail.com'
        temp_profile.title = 'unavailable'
        temp_profile.rate = '%' + ((temp_profile.found / 1) * 100).toFixed(2)
        temp_profile.link = 'https://google.com'
        temp_profile.type = site.type
        resolve(temp_profile)
      } else {
        resolve(undefined)
      }
    } catch (err) {
      if (driver !== undefined) {
        try {
          await driver.quit()
        } catch (err) {
          helper.verbose && console.log('Driver Session Issue')
        }
      }
      resolve(undefined)
    }
  })
}

async function find_username_site_special_leetcode_cn_1 (uuid, username, site) {
  helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
  const timeout = get_site_request_timeout(site, 8)
  const payload = {
    operationName: 'getUserProfile',
    query: 'query getUserProfile($username: String!) { userProfileUserQuestionProgress(userSlug: $username) { numAcceptedQuestions { count difficulty } } userProfilePublicProfile(userSlug: $username) { haveFollowed siteRanking profile { userSlug realName aboutMe asciiCode userAvatar github websites socialAccounts { provider profileUrl } } } }',
    variables: {
      username: username
    }
  }

  try {
    const response = await helper.post_url_wrapper_json('https://leetcode.cn/graphql/', payload, timeout)
    const profile = response && response.data && response.data.data && response.data.data.userProfilePublicProfile
    if (!profile || !profile.profile) {
      return undefined
    }

    const accepted = response.data.data.userProfileUserQuestionProgress && response.data.data.userProfileUserQuestionProgress.numAcceptedQuestions
      ? response.data.data.userProfileUserQuestionProgress.numAcceptedQuestions.map(item => item.count).reduce((sum, count) => sum + count, 0)
      : 0
    const social_accounts = profile.profile.socialAccounts || []
    const websites = profile.profile.websites || []
    const alias_urls = []
    if (profile.profile.github) {
      alias_urls.push(profile.profile.github)
    }
    alias_urls.push(...websites.filter(Boolean))
    alias_urls.push(...social_accounts.map(item => item.profileUrl).filter(Boolean))
    const aliases = alias_urls.map(item => extract_username_from_url(item)).filter(Boolean)
    const temp_profile = Object.assign({}, helper.profile_template)
    temp_profile.found = 1
    temp_profile.good = 'true'
    temp_profile.status = 'good'
    temp_profile.rate = '%100.00'
    temp_profile.method = 'find'
    temp_profile.username = username
    temp_profile.link = site.url.replace('{username}', username)
    temp_profile.title = profile.profile.realName || profile.profile.userSlug || username
    temp_profile.language = 'Chinese'
    temp_profile.country = site.country
    temp_profile.rank = profile.siteRanking || 'unavailable'
    temp_profile.type = site.type
    temp_profile.image = profile.profile.userAvatar || ''
    temp_profile.text = [
      profile.profile.realName,
      profile.profile.aboutMe,
      profile.profile.github,
      accepted > 0 ? 'Accepted: ' + accepted : ''
    ].filter(Boolean).join(' | ')
    temp_profile.aliases = Array.from(new Set(aliases))
    temp_profile.metadata = alias_urls.map(item => ({
      name: 'link',
      content: item
    }))
    return temp_profile
  } catch (err) {
    helper.verbose && console.log(err)
    return undefined
  }
}

async function find_username_site_special_zhihu_1 (uuid, username, site) {
  helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
  const timeout = get_site_request_timeout(site, 8)

  try {
    const response = await helper.get_url_wrapper_json(
      'https://www.zhihu.com/api/v4/members/' + username + '?include=id,url_token,name,headline,answer_count,articles_count,follower_count',
      timeout
    )
    const data = response && response.data
    if (!data || data.error || !data.url_token) {
      return undefined
    }

    const temp_profile = Object.assign({}, helper.profile_template)
    temp_profile.found = 1
    temp_profile.good = 'true'
    temp_profile.status = 'good'
    temp_profile.rate = '%100.00'
    temp_profile.method = 'find'
    temp_profile.username = username
    temp_profile.link = site.url.replace('{username}', username)
    temp_profile.title = data.name || data.url_token || username
    temp_profile.language = 'Chinese'
    temp_profile.country = site.country
    temp_profile.rank = 'unavailable'
    temp_profile.type = site.type
    temp_profile.image = data.avatar_url || ''
    temp_profile.text = [
      data.headline,
      typeof data.answer_count === 'number' ? 'Answers: ' + data.answer_count : '',
      typeof data.articles_count === 'number' ? 'Articles: ' + data.articles_count : '',
      typeof data.follower_count === 'number' ? 'Followers: ' + data.follower_count : ''
    ].filter(Boolean).join(' | ')
    return temp_profile
  } catch (err) {
    helper.verbose && console.log(err)
    return undefined
  }
}

export default{
  find_username_special
}
