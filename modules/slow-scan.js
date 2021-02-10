var helper = require('./helper.js')
var async = require("async");
var sanitizeHtml = require("sanitize-html");
var sanitizeHtml = require("sanitize-html");
var firefox = require("selenium-webdriver/firefox");
var {
  Builder,
  By,
  Key
} = require("selenium-webdriver");
var path = require('path');
var engine = require('./engine.js')

if (process.platform == 'win32'){
  var package_path = path.join(path.dirname(require.resolve("geckodriver")),'..')
  process.env['PATH'] = process.env['PATH'] + ';' + package_path
}

async function find_username_advanced(req) {
  const time = new Date();
  const functions = [];
  var all_results = []
  helper.websites_entries.forEach((site) => {
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.selected == "true" && site.detections.length > 0) {
      functions.push(find_username_site.bind(null, req.body.uuid, req.body.string, req.body.option, site));
    }
  });
  var results = await async.parallelLimit(functions, 8);
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  results = results.filter(item => item)
  return results.sort((first, second) => {return helper.compare_objects(first, second, 'rate')})
}

async function find_username_site(uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
    let driver = undefined
    if (helper.grid_url == "") {
      driver = new Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(new firefox.Options().headless().windowSize({
          width: 640,
          height: 480
        }))
        .build();
    } else {
      driver = new Builder()
        .forBrowser("firefox")
        .setFirefoxOptions(new firefox.Options().headless().windowSize({
          width: 640,
          height: 480
        }))
        .usingServer(helper.grid_url)
        .build();
    }

    try {

      var timeouts = {
        implicit: 0,
        pageLoad: 5000,
        script: 5000
      };

      var timeout = (site.timeout != 0) ? site.timeout * 1000 : 5000;
      var implicit = (site.implicit != 0) ? site.implicit * 1000 : 0;

      timeouts = {
        implicit: implicit,
        pageLoad: timeout,
        script: timeout
      };

      helper.verbose && console.log(timeouts)

      var source = "";
      var screen_shot = "";
      var language = "unavailable"
      var text_only = "unavailable";
      var title = "unavailable";
      var link = site.url.replace("{username}", username);
      //await driver.manage().setTimeouts(timeouts);
      await driver.get(link);;
      source = await driver.getPageSource();
      screen_shot = await driver.takeScreenshot();
      title = await driver.getTitle();
      text_only = await driver.findElement(By.tagName("body")).getText();
      await driver.quit()
      var [temp_profile, temp_detected, detections_count] = await engine.detect("slow", uuid, username, options, site ,source, text_only, screen_shot)
      if (options.includes("ShowUserProfilesSlow")) {
        temp_profile["image"] = "data:image/png;base64,{image}".replace("{image}", screen_shot);
      }
      if (temp_profile.found >= helper.detection_level[helper.detection_level.current].found && detections_count >= helper.detection_level[helper.detection_level.current].count){
        temp_profile.good = "true"
        try {
          language = helper.get_language_by_parsing(source)
          if (language == "unavailable") {
            language = helper.get_language_by_guessing(text_only)
          }
        } catch (err) {
          helper.verbose && console.log(err);
        }

        temp_profile.text = sanitizeHtml(text_only);
        temp_profile.title = sanitizeHtml(title);
        temp_profile.language = language
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
        resolve(temp_profile);
      }
      else if (temp_profile.image != ""){
        temp_profile.text = "unavailable";
        temp_profile.title = "unavailable";
        temp_profile.language = "unavailable"
        temp_profile.rate = "%00.0"
        temp_profile.link = site.url.replace("{username}", username);
        temp_profile.type = site.type
        resolve(temp_profile);
      }
      else {
        resolve(undefined)
      }
    } catch (err) {
      if (driver !== undefined) {
        try {
          await driver.quit()
        } catch (err) {
          helper.verbose && console.log("Driver Session Issue")
        }
      }
      resolve(undefined)
    }
  });
}

module.exports = {
  find_username_advanced
}
