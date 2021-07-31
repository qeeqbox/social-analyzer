const helper = require('./helper.js')
const extraction = require('./extraction.js')
const async = require('async')
const sanitizeHtml = require('sanitize-html')
const {
  htmlToText
} = require('html-to-text')
const cheerio = require('cheerio')
const engine = require('./engine.js')

async function find_username_normal (req) {
  helper.log_to_file_queue(req.body.uuid, '[init] Selected websites: ' + helper.websites_entries.filter((item) => item.selected === 'true').length + ' for username: ' + req.body.string)
  const time = new Date()
  let all_results = []
  const [first_re_try, first_profiles] = await find_username_normal_wrapper(req, helper.websites_entries)
  helper.verbose && console.log(`Total time ${new Date() - time}`)
  const [second_re_try, second_profiles] = await find_username_normal_wrapper(req, first_re_try)
  helper.verbose && console.log(`Total time ${new Date() - time}`)
  const [third_re_try, third_profiles] = await find_username_normal_wrapper(req, second_re_try)
  helper.verbose && console.log(`Total time ${new Date() - time}`)
  if (third_re_try.length > 0) {
    const failed_sites = await get_failed(req, third_re_try)
    all_results = Array.prototype.concat(first_profiles, second_profiles, third_profiles, failed_sites)
  } else {
    all_results = Array.prototype.concat(first_profiles, second_profiles, third_profiles)
  }

  all_results = all_results.filter(item => item)
  return all_results.sort((first, second) => {
    return helper.compare_objects(first, second, 'rate')
  })
}

async function get_failed (req, failed) {
  const temp_result = []
  try {
    await failed.forEach(site => {
      const temp_profile = {
        link: '',
        method: ''
      }
      temp_profile.method = 'failed'
      temp_profile.username = req.body.string
      temp_profile.link = site.url.replace('{username}', req.body.string)
      temp_result.push(temp_profile)
    })
  } catch (err) {
    helper.verbose && console.log(err)
  }
  return temp_result
}

async function find_username_normal_wrapper (req, sites) {
  const results = []
  const re_try = []
  const functions = []
  try {
    const temp_sites = sites.filter(site => site.selected === 'true')
    if (temp_sites.length > 0) {
      await temp_sites.forEach(site => {
        if (site.detections.length > 0 && !helper.global_lock.includes(req.body.uuid)) {
          functions.push(find_username_site.bind(null, req.body.uuid, req.body.string, req.body.option, site))
        }
      })
      const temp_results = await async.parallelLimit(functions, 15)
      await temp_results.forEach(item => {
        if (item !== undefined) {
          if (item.return === 1) {
            results.push(item.profile)
          } else {
            helper.log_to_file_queue(req.body.uuid, '[Waiting to retry] ' + helper.get_site_from_url(item.site.url))
            re_try.push(item.site)
          }
        }
      })
    }
  } catch (err) {
    helper.verbose && console.log(err)
  }
  return [re_try, results]
}

async function find_username_site (uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    if (!helper.global_lock.includes(uuid)) {
      try {
        if (!options.includes('json')) {
          helper.log_to_file_queue(uuid, '[Checking] ' + helper.get_site_from_url(site.url))
        }
        const source = await helper.get_url_wrapper_text(site.url.replace('{username}', username))
        if (source !== 'error-get-url') {
          let title = 'unavailable'
          let language = 'unavailable'
          const [
            temp_profile,
            temp_detected,
            detections_count
          ] = await engine.detect('fast', uuid, username, options, site, source)
          if (temp_profile.found >= helper.detection_level[helper.detection_level.current].found && detections_count >= helper.detection_level[helper.detection_level.current].count) {
            temp_profile.good = 'true'
          }
          temp_profile.text = sanitizeHtml(htmlToText(source, {
            wordwrap: false,
            hideLinkHrefIfSameAsText: true,
            ignoreHref: true,
            ignoreImage: true
          }))
          if (temp_profile.text === '') {
            temp_profile.text = 'unavailable'
          }

          try {
            const $ = cheerio.load(source)
            title = sanitizeHtml($('title').text())
            if (title.length === 0) {
              title = 'unavailable'
            }
          } catch (err) {
            helper.verbose && console.log(err)
          }

          try {
            language = helper.get_language_by_parsing(source)
            if (language === 'unavailable') {
              language = helper.get_language_by_guessing(temp_profile.text)
            }
          } catch (err) {
            helper.verbose && console.log(err)
          }

          temp_profile.text = temp_profile.text.replace(/(\r\n|\n|\r)/gm, '')
          temp_profile.title = title.replace(/(\r\n|\n|\r)/gm, '')
          temp_profile.language = language

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

          temp_profile.username = username
          temp_profile.link = site.url.replace('{username}', username)
          temp_profile.type = site.type
          temp_profile.rank = site.global_rank
          temp_profile.country = site.country

          if (temp_profile.rank === 0) {
            temp_profile.rank = 'unavailable'
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

          ['title', 'language', 'text', 'type', 'metadata', 'extracted', 'country'].forEach((item) => {
            if (temp_profile[item] === '') {
              temp_profile[item] = 'unavailable'
            }
          })

          if (options.includes('FindUserProfilesFast') && !options.includes('GetUserProfilesFast')) {
            temp_profile.method = 'find'
          } else if (options.includes('GetUserProfilesFast') && !options.includes('FindUserProfilesFast')) {
            temp_profile.method = 'get'
          } else if (options.includes('GetUserProfilesFast') && options.includes('FindUserProfilesFast')) {
            temp_profile.method = 'all'
          }
          resolve({
            return: 1,
            site: site,
            profile: temp_profile
          })
        } else {
          resolve({
            return: 0,
            site: site,
            profile: []
          })
        }
      } catch (err) {
        resolve(undefined)
      }
    } else {
      resolve(undefined)
    }
  })
}

module.exports = {
  find_username_normal
}
