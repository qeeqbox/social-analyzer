var helper = require("./helper.js")
var async = require("async");
var sanitizeHtml = require("sanitize-html");
const {
  htmlToText
} = require('html-to-text');
var cheerio = require('cheerio');

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
  const results = await async.parallelLimit(functions, 25);
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  return results.filter(item => item !== undefined)
}

async function find_username_site(uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!options.includes('json')) {
        helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
      }
      var body = await helper.get_url_wrapper_text(site.url.replace("{username}", username));
      var detections_count = 0;
      var source = body;
      var text_only = "unavailable";
      var title = "unavailable";
      var temp_profile = {
        "found": 0,
        "image": "",
        "link": "",
        "rate": "",
        "title": "",
        "text": "",
        "type": ""
      };

      await Promise.all(site.detections.map(async detection => {
        var temp_found = "false";
        if (detection.type == "normal" && options.includes("FindUserProfilesFast") && source != "") {
          detections_count += 1
          if (source.toLowerCase().includes(detection.string.replace("{username}", username).toLowerCase())) {
            temp_found = "true";
          }
          if (detection.return == temp_found) {
            //console.log(detection.string, "  >  normal");
            temp_profile.found += 1
          }
        }
      }));
      if (temp_profile.found > 0 && detections_count != 0) {
        temp_profile.text = sanitizeHtml(htmlToText(body, {
          wordwrap: false,
          hideLinkHrefIfSameAsText: true,
          ignoreHref: true,
          ignoreImage: true
        }));
        if (temp_profile.text == "") {
          temp_profile.text = "unavailable"
        }

        try {
          var $ = cheerio.load(body);
          title = sanitizeHtml($("title").text())
          if (title.length == 0) {
            title = "unavailable"
          }
        } catch (err) {
          helper.verbose && console.log(err);
        }

        temp_profile.title = title;
        temp_profile.rate = "%" + ((temp_profile["found"] / detections_count) * 100).toFixed(2);
        temp_profile.link = site.url.replace("{username}", username);
        temp_profile.type = site.type
        resolve(temp_profile);
      } else {
        resolve(undefined)
      }
    } catch (err) {
      resolve(undefined)
    }
  });
}

module.exports = {
  find_username_normal
}
