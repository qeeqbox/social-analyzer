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
  const functions = [];
  await helper.parsed_sites.forEach(site => {
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.selected == "true" && site.detections.length > 0) {
      functions.push(find_username_site.bind(null, req.body.uuid, req.body.string, req.body.option, site));
    }
  });
  const results = await async.parallelLimit(functions, 5);
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  return results.filter(item => item !== undefined)
}

async function find_username_site(uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!options.includes('json')) {
        helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
      }
      var source = await helper.get_url_wrapper_text(site.url.replace("{username}", username));
      var detections_count = 0;
      var text_only = "unavailable";
      var title = "unavailable";
      var language = "unavailable"
      var good_or_bad = "false"
      var {
        temp_profile,
        temp_detected,
        detections_count
      } = await engine.detect("fast", uuid, username, options, site, source)
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
      if (temp_profile.good == "true"){
        temp_profile.rate = "%" + ((temp_profile["found"] / detections_count) * 100).toFixed(2);
      }
      temp_profile.link = site.url.replace("{username}", username);
      temp_profile.type = site.type

      if (options.includes("FindUserProfilesFast") && !options.includes("GetUserProfilesFast")){
        temp_profile.method = "find"
      }
      else if (options.includes("GetUserProfilesFast") && !options.includes("FindUserProfilesFast")){
        temp_profile.method = "get"
      }
      else if (options.includes("GetUserProfilesFast") && options.includes("FindUserProfilesFast")){
        temp_profile.method = "all"
      }
      resolve(temp_profile);
    } catch (err) {
      resolve(undefined)
    }
  });
}

module.exports = {
  find_username_normal
}
