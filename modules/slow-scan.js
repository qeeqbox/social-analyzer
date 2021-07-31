const helper = require('./helper.js')
const extraction = require('./extraction.js')
const async = require('async')
const sanitizeHtml = require('sanitize-html')
const firefox = require('selenium-webdriver/firefox')
const {
  Builder,
  By,
  Key
} = require('selenium-webdriver')
const path = require('path')
const engine = require('./engine.js')

if (process.platform === 'win32') {
  const package_path = path.join(path.dirname(require.resolve('geckodriver')), '..')
  process.env.PATH = process.env.PATH + ';' + package_path
}

async function find_username_advanced (req) {
  helper.log_to_file_queue(req.body.uuid, '[init] Selected websites: ' + helper.websites_entries.filter((item) => item.selected === 'true').length + ' for username: ' + req.body.string)
  const time = new Date()
  const functions = []
  helper.websites_entries.forEach((site) => {
    if ('status' in site) {
      if (site.status === 'bad') {
        return Promise.resolve()
      }
    }
    if (site.selected === 'true' && site.detections.length > 0 && !helper.global_lock.includes(req.body.uuid)) {
      functions.push(find_username_site.bind(null, req.body.uuid, req.body.string, req.body.option, site))
    }
  })
  let results = await async.parallelLimit(functions, 8)
  helper.verbose && console.log(`Total time ${new Date() - time}`)
  results = results.filter(item => item)
  return results.sort((first, second) => {
    return helper.compare_objects(first, second, 'rate')
  })
}

async function find_username_site (uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    if (!helper.global_lock.includes(uuid)) {
      helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
      let driver
      if (helper.grid_url === '') {
        driver = new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(new firefox.Options().headless().windowSize({
            width: 640,
            height: 480
          }))
          .build()
      } else {
        driver = new Builder()
          .forBrowser('firefox')
          .setFirefoxOptions(new firefox.Options().headless().windowSize({
            width: 640,
            height: 480
          }))
          .usingServer(helper.grid_url)
          .build()
      }

      try {
        let timeouts = {
          implicit: 0,
          pageLoad: 5000,
          script: 5000
        }

        const timeout = (site.timeout !== 0) ? site.timeout * 1000 : 5000
        const implicit = (site.implicit !== 0) ? site.implicit * 1000 : 0

        timeouts = {
          implicit: implicit,
          pageLoad: timeout,
          script: timeout
        }

        helper.verbose && console.log(timeouts)

        let source = ''
        let screen_shot = ''
        let language = 'unavailable'
        let text_only = 'unavailable'
        let title = 'unavailable'
        const link = site.url.replace('{username}', username)
        // await driver.manage().setTimeouts(timeouts);
        await driver.get(link)
        source = await driver.getPageSource()
        screen_shot = await driver.takeScreenshot()
        title = await driver.getTitle()
        text_only = await driver.findElement(By.tagName('body')).getText()
        await driver.quit()
        const [temp_profile, temp_detected, detections_count] = await engine.detect('slow', uuid, username, options, site, source, text_only, screen_shot)
        if (options.includes('ShowUserProfilesSlow')) {
          temp_profile.image = 'data:image/png;base64,{image}'.replace('{image}', screen_shot)
        }
        if (temp_profile.found >= helper.detection_level[helper.detection_level.current].found && detections_count >= helper.detection_level[helper.detection_level.current].count) {
          temp_profile.good = 'true'
          try {
            language = helper.get_language_by_parsing(source)
            if (language === 'unavailable') {
              language = helper.get_language_by_guessing(text_only)
            }
          } catch (err) {
            helper.verbose && console.log(err)
          }

          temp_profile.username = username
          temp_profile.text = sanitizeHtml(text_only)
          temp_profile.title = sanitizeHtml(title)
          temp_profile.language = language

          temp_profile.text = temp_profile.text.replace(/(\r\n|\n|\r)/gm, '')
          temp_profile.title = temp_profile.title.replace(/(\r\n|\n|\r)/gm, '')

          if (helper.strings_titles.test(temp_profile.title) || helper.strings_pages.test(temp_profile.text)) {
            temp_profile.title = 'filtered'
            temp_profile.text = 'filtered'
          }

          if (temp_profile.good === 'true') {
            const temp_value = ((temp_profile.found / detections_count) * 100).toFixed(2)
            temp_profile.rate = '%' + temp_value
            if (temp_value >= 100.00) {
              temp_profile.status = 'good'
            } else if (temp_value >= 50.00 && temp_value < 100.00) {
              temp_profile.status = 'maybe'
            } else {
              temp_profile.status = 'bad'
            }
          }

          if (temp_profile.status === 'good') {
            if (options.includes('ExtractPatterns')) {
              let temp_extracted_list = []
              temp_extracted_list = await extraction.extract_patterns(site, source)
              if (temp_extracted_list.length > 0) {
                temp_profile.extracted = temp_extracted_list
              }
            }
            if (options.includes('ExtractMetadata')) {
              let temp_metadata_list = []
              temp_metadata_list = await extraction.extract_metadata(site, source)
              if (temp_metadata_list.length > 0) {
                temp_profile.metadata = temp_metadata_list
              }
            }
          }

          temp_profile.rank = site.global_rank
          temp_profile.country = site.country

          if (temp_profile.rank === 0) {
            temp_profile.rank = 'unavailable'
          }

          ['title', 'language', 'text', 'type', 'metadata', 'extracted', 'country'].forEach((item) => {
            if (temp_profile[item] === '') {
              temp_profile[item] = 'unavailable'
            }
          })

          temp_profile.link = site.url.replace('{username}', username)
          temp_profile.type = site.type
          resolve(temp_profile)
        } else if (temp_profile.image !== '') {
          temp_profile.username = username
          temp_profile.text = 'unavailable'
          temp_profile.title = 'unavailable'
          temp_profile.language = 'unavailable'
          temp_profile.rate = '%00.0'
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
    } else {
      resolve(undefined)
    }
  })
}

module.exports = {
  find_username_advanced
}
