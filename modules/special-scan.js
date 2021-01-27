var helper = require('./helper.js')
var async = require("async");
var sanitizeHtml = require("sanitize-html");
var firefox = require("selenium-webdriver/firefox");
var {
  Builder,
  By,
  Key
} = require("selenium-webdriver");

async function find_username_special(req) {
  const time = new Date();
  const functions = [];
  helper.websites_entries.forEach((site) => {
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.selected == "true") {
      site.detections.forEach((detection) => {
        if (detection.type == 'special') {
          if (detection.function == 'special_facebook_1') {
            functions.push(find_username_site_special_facebook_1.bind(null, req.body.uuid, req.body.string, site));
          } else if (detection.function == 'special_gmail_1') {
            functions.push(find_username_site_special_gmail_1.bind(null, req.body.uuid, req.body.string, site));
          } else if (detection.function == 'special_google_1') {
            functions.push(find_username_site_special_google_1.bind(null, req.body.uuid, req.body.string, site));
          }
        }
      });
    }
  });
  const results = await async.parallelLimit(functions, 5);
  helper.verbose && console.log(`Total time ${new Date() - time}`);
  return results.filter(item => item !== undefined)
}

async function find_username_site_special_facebook_1(uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
    let driver = new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(new firefox.Options().headless().windowSize({
        width: 640,
        height: 480
      }))
      .build();

    try {
      var timeouts = {
        implicit: 0,
        pageLoad: 10000,
        script: 10000
      };

      var source = "";
      var data = "";
      var text_only = "unavailable";
      var title = "unavailable";
      var temp_profile = Object.assign({}, helper.profile_template);
      var link = "https://mbasic.facebook.com/login/identify/?ctx=recoveqr";
      await driver.manage().setTimeouts(timeouts);
      await driver.get(link);;
      await driver.findElement(By.id('identify_search_text_input')).sendKeys(username);
      await driver.findElement(By.id('did_submit')).click();
      source = await driver.getPageSource();
      text_only = await driver.findElement(By.tagName("body")).getText();
      await driver.quit()
      if (source.includes("Try Entering Your Password")) {
        temp_found = "true";
        temp_profile.found += 1
      }
      if (temp_profile.found > 0) {
        temp_profile.text = "unavailable";
        temp_profile.title = "unavailable";
        temp_profile.rate = "%" + ((temp_profile.found / 1) * 100).toFixed(2);
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

async function find_username_site_special_gmail_1(uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
    let driver = new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(new firefox.Options().headless().windowSize({
        width: 640,
        height: 480
      }))
      .build();

    try {
      var timeouts = {
        implicit: 0,
        pageLoad: 10000,
        script: 10000
      };

      var source = "";
      var data = "";
      var text_only = "unavailable";
      var title = "unavailable";
      var temp_profile = Object.assign({}, helper.profile_template);
      var link = "https://accounts.google.com/signup/v2/webcreateaccount?service=mail&continue=https%3A%2F%2Fmail.google.com%2Fmail%2F%3Fpc%3Dtopnav-about-n-en&flowName=GlifWebSignIn&flowEntry=SignUp";
      await driver.manage().setTimeouts(timeouts);
      await driver.get(link);;
      await driver.findElement(By.id('username')).sendKeys(username);
      await driver.findElement(By.id('selectioni1')).click();
      source = await driver.getPageSource();
      text_only = await driver.findElement(By.tagName("body")).getText();
      await driver.quit()
      if (text_only.includes("That username is taken") && !text_only.includes('your username must be between') && !text_only.includes('You can use letters')) {
        temp_found = "true";
        temp_profile.found += 1
      }
      if (temp_profile.found > 0) {
        temp_profile.text = username + "@gmail.com";
        temp_profile.title = "unavailable";
        temp_profile.rate = "%" + ((temp_profile.found / 1) * 100).toFixed(2);
        temp_profile.link = "https://google.com"
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

async function find_username_site_special_google_1(uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    helper.log_to_file_queue(uuid, "[Checking] " + helper.get_site_from_url(site.url))
    let driver = new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(new firefox.Options().headless().windowSize({
        width: 640,
        height: 480
      }))
      .build();

    try {
      var timeouts = {
        implicit: 0,
        pageLoad: 10000,
        script: 10000
      };

      var source = "";
      var data = "";
      var text_only = "unavailable";
      var title = "unavailable";
      var temp_profile = Object.assign({}, helper.profile_template);
      var link = "https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&service=mail&sacu=1&rip=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin";
      await driver.manage().setTimeouts(timeouts);
      await driver.get(link);;
      await driver.findElement(By.id('identifierId')).sendKeys(username);
      await driver.findElement(By.xpath("//button[contains(.,'Next')]")).click();
      source = await driver.getPageSource();
      text_only = await driver.findElement(By.tagName("body")).getText();
      await driver.quit()
      if (text_only.includes("Couldn't sign you in") && !text_only.includes("Couldn't find your")) {
        temp_found = "true";
        temp_profile.found += 1
      }
      if (temp_profile.found > 0) {
        temp_profile.text = username + "@gmail.com";
        temp_profile.title = "unavailable";
        temp_profile.rate = "%" + ((temp_profile.found / 1) * 100).toFixed(2);
        temp_profile.link = "https://google.com"
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
  find_username_special
}
