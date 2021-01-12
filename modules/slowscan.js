var helper = require("./helper.js")
var async = require("async");
var sanitizeHtml = require("sanitize-html");
var tesseract = require("node-tesseract-ocr");
var sanitizeHtml = require("sanitize-html");
var firefox = require("selenium-webdriver/firefox");
var {
  Builder,
  By,
  Key
} = require("selenium-webdriver");
var tmp = require("tmp");
var fs = require("fs");

async function find_username_advanced(req) {
  const time = new Date();
  const functions = [];
  helper.parsed_sites.forEach((site) => {
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.selected == "true" && site.detections.length > 0) {
      functions.push(find_username_site.bind(null, req.body.uuid, req.body.string, req.body.option, site));
    }
  });
  const results = await async.parallelLimit(functions, 8);
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  return results.filter(item => item !== undefined)
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
      var data = "";
      var language = "unavailable"
      var text_only = "unavailable";
      var title = "unavailable";
      var temp_profile = {
        "found": 0,
        "image": "",
        "link": "",
        "rate": "",
        "title": "",
        "language": "",
        "text": "",
        "type": ""
      };
      var link = site.url.replace("{username}", username);
      await driver.manage().setTimeouts(timeouts);
      await driver.get(link);;
      source = await driver.getPageSource();
      data = await driver.takeScreenshot();
      title = await driver.getTitle();
      text_only = await driver.findElement(By.tagName("body")).getText();
      await driver.quit()
      if (options.includes("ShowUserProfilesSlow")) {
        temp_profile["image"] = "data:image/png;base64,{image}".replace("{image}", data);
      }
      if (site.selected == "true" && site.detections.length > 0 && options.includes("FindUserProfilesSlow")) {
        await Promise.all(site.detections.map(async detection => {
          try {
            if ("status" in detection) {
              if (detection.status == "bad") {
                return;
              }
            }
            var temp_found = "false"
            if (detection.type == "ocr" && data != "") {
              tmpobj = tmp.fileSync();
              fs.writeFileSync(tmpobj.name, Buffer.from(data, "base64"));
              await tesseract.recognize(tmpobj.name, {
                  lang: "eng",
                  oem: 1,
                  psm: 3,
                })
                .then(text => {
                  text = text.replace(/[^A-Za-z0-9]/gi, "");
                  detection.string = detection.string.replace(/[^A-Za-z0-9]/gi, "");
                  if (text != "") {
                    if (text.toLowerCase().includes(detection.string.toLowerCase())) {
                      temp_found = "true";
                    }
                    if (detection.return == temp_found) {
                      //console.log(text);
                      //console.log(detection.string,"  > Found ocr");
                      temp_profile.found += 1;
                    }
                  }
                })
                .catch(error => {
                  helper.verbose && console.log(error.message);
                })
              tmpobj.removeCallback();
            } else if (detection.type == "normal" && source != "") {
              if (source.toLowerCase().includes(detection.string.replace("{username}", username).toLowerCase())) {
                temp_found = "true";
              }
              if (detection.return == temp_found) {
                //console.log(detection.string,"  >  normal");
                temp_profile.found += 1
              }
            } else if (detection.type == "advanced" && text_only != "") {
              if (text_only.toLowerCase().includes(detection.string.replace("{username}", username).toLowerCase())) {
                temp_found = "true";
              }
              if (detection.return == temp_found) {
                //console.log(detection.string,"  >  normal");
                temp_profile.found += 1
              }
            }

          } catch (err) {

          }
        }));
      }
      if (temp_profile.found > 0 || temp_profile.image != "") {

        language = helper.get_language_by_parsing(source)
        if (language == "unavailable"){
          language = helper.get_language_by_guessing(text_only)
        }

        temp_profile.text = sanitizeHtml(text_only);
        temp_profile.title = sanitizeHtml(title);
        temp_profile.language = language
        temp_profile.rate = "%" + ((temp_profile.found / site.detections.length) * 100).toFixed(2);
        temp_profile.link = site.url.replace("{username}", username);
        temp_profile.type = site.type
        resolve(temp_profile);
      } else {
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
