var helper = require('./helper.js')
var async = require("async");
var sanitizeHtml = require("sanitize-html");
var {
  htmlToText
} = require('html-to-text');
var cheerio = require('cheerio');
var engine = require('./engine.js')

async function find_username_normal(req) {
  const time = new Date();
  var all_results = []
  var [first_re_try, first_profiles] = await find_username_normal_wrapper(req, helper.websites_entries);
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  var [second_re_try, second_profiles] = await find_username_normal_wrapper(req, first_re_try)
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  var [third_re_try, third_profiles] = await find_username_normal_wrapper(req, second_re_try)
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  if (third_re_try.length > 0) {
    failed_sites = await get_failed(req, third_re_try)
    all_results = Array.prototype.concat(first_profiles, second_profiles, third_profiles, failed_sites)
  } else {
    all_results = Array.prototype.concat(first_profiles, second_profiles, third_profiles)
  }

  all_results = all_results.filter(item => item)
  return all_results.sort((first, second) => {return helper.compare_objects(first, second, 'rate')})
}

async function get_failed(req, failed) {
  temp_result = []
  try {
    await failed.forEach(site => {
      var temp_profile = {
        "link": "",
        "method": ""
      };
      temp_profile.method = "failed"
      temp_profile.link = site.url.replace("{username}", req.body.string)
      temp_result.push(temp_profile)
    });
  } catch (err) {
    helper.verbose && console.log(err);
  }
  return temp_result
}

async function find_username_normal_wrapper(req, sites) {
  var results = []
  var re_try = []
  var functions = [];
  try {
    var temp_sites = sites.filter(site => site.selected == "true")
    if (temp_sites.length > 0) {
      await temp_sites.forEach(site => {
        if (site.detections.length > 0) {
          functions.push(find_username_site.bind(null, req.body.uuid, req.body.string, req.body.option, site));
        }
      });
      var temp_results = await async.parallelLimit(functions, 15);
      await temp_results.forEach(item => {
        if (item !== undefined) {
          if (item.return == 1) {
            results.push(item.profile)
          } else {
            helper.log_to_file_queue(req.body.uuid, "[Waiting to retry] " + helper.get_site_from_url(item.site.url))
            re_try.push(item.site)
          }
        }
      });
    }
  } catch (err) {
    helper.verbose && console.log(err);
  }
  return [re_try, results]
}

async function find_username_site(uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!options.includes('json')) {
        helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
      }
      var source = await helper.get_url_wrapper_text(site.url.replace("{username}", username));
      if (source != "error-get-url") {
        var detections_count = 0;
        var text_only = "unavailable";
        var title = "unavailable";
        var language = "unavailable"
        var good_or_bad = "false"
        var [
          temp_profile,
          temp_detected,
          detections_count
        ] = await engine.detect("fast", uuid, username, options, site, source)
        if (temp_profile.found >= helper.detection_level[helper.detection_level.current].found && detections_count >= helper.detection_level[helper.detection_level.current].count) {
          temp_profile.good = "true"
        }
        temp_profile.text = sanitizeHtml(htmlToText(source, {
          wordwrap: false,
          hideLinkHrefIfSameAsText: true,
          ignoreHref: true,
          ignoreImage: true
        }));
        if (temp_profile.text == "") {
          temp_profile.text = "unavailable"
        }

        try {
          var $ = cheerio.load(source);
          title = sanitizeHtml($("title").text())
          if (title.length == 0) {
            title = "unavailable"
          }
        } catch (err) {
          helper.verbose && console.log(err);
        }

        try {
          language = helper.get_language_by_parsing(source)
          if (language == "unavailable") {
            language = helper.get_language_by_guessing(temp_profile.text)
          }
        } catch (err) {
          helper.verbose && console.log(err);
        }

        temp_profile.title = title;
        temp_profile.language = language;
        if (temp_profile.good == "true") {
          var temp_value = ((temp_profile["found"] / detections_count) * 100).toFixed(2)
          temp_profile.rate = "%" + temp_value;
          if (temp_value >= 100.00){
            temp_profile.status = "good"
          }
          else if (temp_value >= 50.00 && temp_value < 100.00){
            temp_profile.status = "maybe"
          }
          else{
            temp_profile.status = "bad"
          }
        }
        temp_profile.link = site.url.replace("{username}", username);
        temp_profile.type = site.type

        if (options.includes("FindUserProfilesFast") && !options.includes("GetUserProfilesFast")) {
          temp_profile.method = "find"
        } else if (options.includes("GetUserProfilesFast") && !options.includes("FindUserProfilesFast")) {
          temp_profile.method = "get"
        } else if (options.includes("GetUserProfilesFast") && options.includes("FindUserProfilesFast")) {
          temp_profile.method = "all"
        }
        resolve({
          return: 1,
          site: site,
          profile: temp_profile
        });
      } else {
        resolve({
          return: 0,
          site: site,
          profile: []
        });
      }
    } catch (err) {
      resolve(undefined)
    }
  });
}

module.exports = {
  find_username_normal
}
