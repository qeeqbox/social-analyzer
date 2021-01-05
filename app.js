//  -------------------------------------------------------------
//  author        Giga
//  project       qeeqbox/social-analyzer
//  email         gigaqeeq@gmail.com
//  description   app.py (CLI)
//  licensee      AGPL-3.0
//  -------------------------------------------------------------
//  contributors list qeeqbox/social-analyzer/graphs/contributors
//  -------------------------------------------------------------

var google_api_key = "";
var google_api_cs = "";
var grid_url = "";
var verbose = false
var proxy = ""

var header_options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:84.0) Gecko/20100101 Firefox/84.0',
  }
};

console.log('[!] Detections are updated every often, make sure to get the most updated ones');

var semver = require('semver');
if (semver.satisfies(process.version, '>13 || <13')) {
  console.log('[Good] NodeJS Version Check');
} else {
  console.log('[Error] NodeJS Version Check');
  process.exit(1);
}

var argv = require('yargs')
  .alias('c', 'cli')
  .alias('u', 'user')
  .alias('w', 'website')
  .alias('o', 'output')
  .alias('l', 'list')
  .alias('m', 'mode')
  .usage('Usage: $0 -c -m "mode" -u "user" -w "website[s]" -o "output"')
  .example('$0 -c -m "fast" -u "joe" -w "facebook"')
  .example('$0 -c -m "fast" -u "natalie" -w "facebook wordpress"')
  .describe('u', 'a user or stirng')
  .describe('w', 'a website or websites sparated with space')
  .describe('o', 'option output file')
  .describe('l', 'list all available websites')
  .describe('m', 'fast -> FindUserProfilesFast\nslow -> FindUserProfilesSlow\nspecial -> FindUserProfilesSpecial')
  .help('h')
  .alias('h', 'help')
  .argv;

var tmp = require("tmp");
var express = require("express");
var fs = require("fs");
var tokenizer = require("wink-tokenizer");
var WordsNinjaPack = require("wordsninja");
var generatorics = require("generatorics");
var {
  findWord
} = require("most-common-words-by-language");
var tesseract = require("node-tesseract-ocr");
var url = require("url");
var sanitizeHtml = require("sanitize-html");
var firefox = require("selenium-webdriver/firefox");
var {
  Builder,
  By
} = require("selenium-webdriver");
var util = require('util');
var https = require("follow-redirects").https;
var async = require("async");
var HttpsProxyAgent = require('https-proxy-agent');
var PrettyError = require('pretty-error');
var pe = new PrettyError();
require('express-async-errors');
//var jsdom = require('jsdom');
//var dom = new jsdom.JSDOM();
//var window = dom.window;
//var document = window.document;
//var $ = require('jquery')(window);
const {
  htmlToText
} = require('html-to-text');
var _tokenizer = tokenizer();
var parsed_json = JSON.parse(fs.readFileSync("dict.json"));
var parsed_sites = JSON.parse(fs.readFileSync("sites.json"));
var parsed_names_origins = JSON.parse(fs.readFileSync("names.json"));

var app = express();

var WordsNinja = new WordsNinjaPack();
app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(express.static("public"));

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

var logs_queue = Promise.resolve();

function log_to_file_queue(uuid, msg) {
  logs_queue = logs_queue.then(function() {
    return new Promise(function(resolve) {
      fs.appendFile("logs/" + uuid + "_log.txt", msg + "\n", function(err, data) {
        console.log(msg)
        resolve();
      });
    });
  });
}

async function get_url_wrapper_json(url, time) {
  try {
    let http_promise = new Promise((resolve, reject) => {
      var request = https.get(url, header_options, function(res) {
        var body = ""
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          resolve({'data':JSON.parse(body.toString())});
        });
      });
      request.on('error', function(e) {
        reject({'data':''})
      });
      request.on('socket', function(socket) {
        var timeout = (time != 0) ? time * 1000 : 5000;
        socket.setTimeout(timeout, function() {
          request.abort();
        });
      });
    });
    let response_body = await http_promise;
    return response_body
  } catch (error) {
    verbose && console.log('');
  }
}

app.post("/get_logs", async function(req, res, next) {
  var last_line = "nothinghere"
  if (req.body.uuid != "") {
    req.body.uuid = req.body.uuid.replace(/[^a-zA-Z0-9\-]+/g, '');
    var data = fs.readFileSync("logs/" + req.body.uuid + "_log.txt").toString();
    if (typeof data !== 'undefined' && data) {
      last_line = data.split('\n').slice(-2)[0];
    }
    res.send(last_line)
  }
})

function get_site_from_url(_url) {
  temp = url.parse(_url.replace("{username}", "nothinghere")).hostname
  return temp.replace("nothinghere.", "")
}

async function find_username_special(req) {
  const time = new Date();
  const functions = [];
  parsed_sites.forEach((site) => {
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if ("name" in site) {
      if (site.name == "facebook") {
        if (site.selected == "true") {
          functions.push(find_username_site_special_facebook_1.bind(null, req.body.uuid, req.body.string, site));
        }
      }
    }
  });
  const results = await async.parallelLimit(functions, 5);
  console.log(`Total time ${new Date() - time}`);
  return results.filter(item => item !== undefined)
}

async function find_username_site_special_facebook_1(uuid, username, site) {
  return new Promise(async (resolve, reject) => {
    log_to_file_queue(uuid, "[Checking] " + get_site_from_url(site.url))
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
      var temp_profile = {
        "found": 0,
        "image": "",
        "link": "",
        "rate": "",
        "title": "",
        "text": "",
        "type": ""
      };
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
          verbose && console.log("Driver Session Issue")
        }
      }
      resolve(undefined)
    }
  });
}

async function find_username_advanced(req) {
  const time = new Date();
  const functions = [];
  parsed_sites.forEach((site) => {
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.selected == "true" && site.detections.length > 0) {
      functions.push(find_username_site_new.bind(null, req.body.uuid, req.body.string, req.body.option, site));
    }
  });
  const results = await async.parallelLimit(functions, 8);
  console.log(`Total time ${new Date() - time}`);
  return results.filter(item => item !== undefined)
}

async function find_username_site_new(uuid, username, options, site) {
  return new Promise(async (resolve, reject) => {
    log_to_file_queue(uuid, "[Checking] " + get_site_from_url(site.url))
    let driver = undefined
    if (grid_url == "") {
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
        .usingServer(grid_url)
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

      console.log(timeouts)

      var source = "";
      var data = "";
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
                  verbose && console.log(error.message);
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
        temp_profile.text = sanitizeHtml(text_only);
        temp_profile.title = sanitizeHtml(title);
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
          verbose && console.log("Driver Session Issue")
        }
      }
      resolve(undefined)
    }
  });
}

async function find_username_normal(req) {

  var functions = [];
  var detections_result = [];

  async function find_username_site(uuid, username, options, site, body) {
    try {
      log_to_file_queue(uuid, "[Checking] " + get_site_from_url(site.url))
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
        temp_profile.title = sanitizeHtml(title);
        temp_profile.rate = "%" + ((temp_profile["found"] / detections_count) * 100).toFixed(2);
        temp_profile.link = site.url.replace("{username}", username);
        temp_profile.type = site.type
        return Promise.resolve(temp_profile);
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject();
    }
  }

  async function find_username_sites(uuid, username, options, parsed_sites) {

    await parsed_sites.forEach(site => {
      if ("status" in site) {
        if (site.status == "bad") {
          return;
        }
      }
      if (site.selected == "true" && site.detections.length > 0) {
        functions.push(function(callback) {
          var request = https.get(site.url.replace("{username}", username), header_options, function(res) {
            var body = ""
            res.on("data", function(chunk) {
              body += chunk;
            });
            res.on("end", async function() {
              var results = await find_username_site(uuid, username, options, site, body);
              detections_result.push(results);
              callback(null, "Done!");
            });
          });
          request.on('error', function(e) {
            callback(null, "Done!");
          });
          request.on('socket', function(socket) {
            var timeout = (site.timeout != 0) ? site.timeout * 1000 : 5000;
            socket.setTimeout(timeout, function() {
              request.abort();
            });
          });
        });
      }
    });
  }

  await find_username_sites(req.body.uuid, req.body.string, req.body.option, parsed_sites);
  await async.parallelLimit(functions, 100);
  return detections_result.filter(item => item !== undefined);
}

async function find_username_advanced_2(username, options) {

  var detections_result = [];

  async function find_username_site(username, options, driver, site) {
    try {
      if ("status" in site) {
        if (site.status == "bad") {
          return Promise.resolve();
        }
      }
      if (site.selected == "true" && site.detections.length > 0 || site.selected == "true" && options.includes("ShowUserProfilesSlow")) {
        var source = "";
        var data = "";
        var text_only = "unavailable";
        var title = "unavailable";
        var temp_profile = {
          "found": 0,
          "image": "",
          "link": "",
          rate: "",
          title: "",
          text: ""
        };
        var link = site.url.replace("{username}", username);
        await driver.get(link);;
        source = await driver.getPageSource();
        data = await driver.takeScreenshot();
        title = await driver.getTitle();
        text_only = await driver.findElement(By.tagName("body")).getText();
        if (options.includes("ShowUserProfilesSlow")) {
          temp_profile["image"] = "data:image/png;base64,{image}".replace("{image}", data);
        }
        if (site.selected == "true" && site.detections.length > 0 && options.includes("FindUserProfilesSlow")) {
          await Promise.all(site.detections.map(async detection => {
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
                  verbose && console.log(error.message);
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
            }
          }));
        }
        if (temp_profile.found > 0 || temp_profile.image != "") {
          temp_profile.text = sanitizeHtml(text_only);
          temp_profile.title = sanitizeHtml(title);
          temp_profile.rate = "%" + ((temp_profile.found / site.detections.length) * 100).toFixed(2);
          temp_profile.link = site.url.replace("{username}", username);
          return Promise.resolve(temp_profile);
        }
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.reject();
    }
  }

  async function find_username_sites(username, options, driver, parsed_sites) {
    for (var site of parsed_sites) {
      var result = await find_username_site(username, options, driver, site);
      detections_result.push(result);
    }

    return detections_result;
  }

  let driver = new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(new firefox.Options().headless().windowSize({
      width: 640,
      height: 480
    }))
    .build();

  var timeouts = {
    implicit: 0,
    pageLoad: 10000,
    script: 10000
  };

  await driver.manage().setTimeouts(timeouts);
  var results = await find_username_sites(username, options, driver, parsed_sites);
  await driver.quit();
  return results.filter(item => item !== undefined);
}

app.get("/get_settings", async function(req, res, next) {
  temp_list = [];
  temp_list = await Promise.all(parsed_sites.map(async (site, index) => {
    var temp_url = "";
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.detections.length > 0) {
      temp_url = url.parse(site.url.replace("{username}", "nothinghere")).hostname
      temp_url = temp_url.replace("nothinghere.", "");
      if (temp_url != "nothinghere") {
        temp_selected = "false";
        if ("selected" in site) {
          if (site.selected == "true") {
            temp_selected = "true";
          }
        }
        return Promise.resolve({
          "index": index,
          "url": temp_url,
          "selected": temp_selected
        });
      }
    }

    return Promise.resolve();
  }));

  temp_list = temp_list.filter(item => item !== undefined);
  temp_list.sort(function(a, b) {
    var keyA = a.url,
      keyB = b.url;
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
  });
  res.json({
    proxy:proxy,
    user_agent: header_options['headers']['User-Agent'],
    google: [google_api_key.substring(0, 10) + "******", google_api_cs.substring(0, 10) + "******"],
    detections: temp_list
  });
});

app.post("/save_settings", async function(req, res, next) {
  await parsed_sites.forEach(function(value, i) {
    parsed_sites[i].selected = "false"
  });
  if ("detections" in req.body) {
    if (req.body.detections.length > 0) {
      await req.body.detections.split(',').forEach(item => {
        parsed_sites[Number(item)].selected = "true";
      });
    }
  }
  if (req.body.google_key != google_api_key.substring(0, 10) + "******") {
    google_api_key = req.body.google_key;
  }
  if (req.body.google_cv != google_api_cs.substring(0, 10) + "******") {
    google_api_cs = req.body.google_cv;
  }
  if (req.body.user_agent != header_options['headers']['User-Agent']) {
    header_options['headers']['User-Agent'] = req.body.user_agent;
  }
  if (req.body.proxy != proxy) {
      proxy = req.body.proxy;
  }

  if (proxy != "") {
      header_options['agent'] = HttpsProxyAgent(proxy)
  }
  else{
    if ('agent' in header_options){
      delete header_options['agent'];
    }
  }

  res.json("Done");
});

app.get("/generate", async function(req, res, next) {
  var list_of_combinations = []
  if (req.body.option == "Generate") {
    if (req.body.words != undefined && req.body.words.length > 1 && req.body.words.length < 8) {
      for (var perm of generatorics.permutationCombination(req.body.words)) {
        if (perm.join("") !== "") {
          list_of_combinations.push(perm.join(""));
        }
      }
    }
  }
  res.json({
    combinations: list_of_combinations
  });

});

async function find_origins(req) {
  var found = []
  for (key in parsed_names_origins) {
    for (name in parsed_names_origins[key]['boy']) {
      if (req.body.string.includes(parsed_names_origins[key]['boy'][name])) {
        found.push({
          "name": parsed_names_origins[key]['boy'][name],
          "origin": key,
          "gender": "boy"
        })
      }
    }
    for (name in parsed_names_origins[key]['girl']) {
      if (req.body.string.includes(parsed_names_origins[key]['girl'][name])) {
        found.push({
          "name": parsed_names_origins[key]['girl'][name],
          "origin": key,
          "gender": "girl"
        })
      }
    }
    for (name in parsed_names_origins[key]['uni']) {
      if (req.body.string.includes(parsed_names_origins[key]['uni'][name])) {
        found.push({
          "name": parsed_names_origins[key]['uni'][name],
          "origin": key,
          "gender": "uni"
        })
      }
    }
  }

  return found
}

async function get_words_info(all_words, words_info) {
  var temp_added = []
  for (let all_words_key of Object.keys(all_words)) {
    for (let all_words_word of all_words[all_words_key]) {
      if (!temp_added.includes(all_words_word)) {
        temp_added.push(all_words_word);
        var temp_words_info = {
          "word": all_words_word,
          "text": "",
          "results": []
        }
        try {
          var url1 = "https://api.duckduckgo.com/?q={0}&format=json&pretty=1&no_html=1&skip_disambig=1".replace("{0}", all_words_word);
          var url2 = "https://api.duckduckgo.com/?q={0}&format=json&pretty=1".replace("{0}", all_words_word);
          var response1 = await get_url_wrapper_json(url1);
          var response2 = await get_url_wrapper_json(url2);
          if (response2.data != '') {
            if ("RelatedTopics" in response2.data) {
              if (response2.data.RelatedTopics.length > 0) {
                if (response2.data != '') {
                  if ("AbstractText" in response1.data && response1.data.AbstractText != "") {
                    temp_words_info.text = response1.data.AbstractText;
                  } else if ("Abstract" in response1.data && response1.data.AbstractText != "") {
                    temp_words_info.text = response1.data.Abstract;
                  } else {
                    temp_words_info.text = "unknown";
                  }
                }
                response2.data.RelatedTopics.forEach(function(item) {
                  if ("Name" in item) {
                    item.Topics.forEach(function(topic) {
                      temp_words_info.results.push({
                        "type": item.Name,
                        "text": topic.Text,
                        "url": topic.FirstURL
                      });
                    });
                  } else {
                    temp_words_info.results.push({
                      "type": "Related",
                      "text": item.Text,
                      "url": item.FirstURL
                    });
                  }
                });
              }
            }
          }

          if (temp_words_info.results.length > 0) {
            words_info.push(temp_words_info);
          }
        } catch (error) {
          verbose && console.log(error);
        }
      }
    }
  }
}

async function check_engines(req, info) {
  try {
    if (google_api_key == "" || google_api_cs == "") {
      return
    }
    var url = "https://www.googleapis.com/customsearch/v1?key={0}&cx={1}&q={2}".replace("{0}", google_api_key).replace("{1}", google_api_cs).replace("{2}", req.body.string);
    var response = await get_url_wrapper_json(url);
    if (response.data != '') {
      try {
        info.original = response.data.queries.request[0].searchTerms
      } catch (e) {}
      try {
        info.corrected = response.data.spelling.correctedQuery
      } catch (e) {}
      try {
        info.total = response.data.searchInformation.totalResults
      } catch (e) {}
      try {
        response.data.items.forEach(function(item) {
          info["items"].push({
            "title": item.title,
            "snippet": item.snippet
          });
        });
      } catch (e) {}
      try {
        if (info.total == 0 && info.corrected != "") {
          info.checking = info.original + " [Error]<br>Try this: " + info.corrected;
        } else if (info.total > 0 && info.corrected != "") {
          info.checking = info.original + " [Good]<br>Suggested word: " + info.corrected + "<br>Total lookups: " + info.total;
        } else if (info.total > 0 && info.corrected == "") {
          info.checking = info.original + " [Good]<br>Total lookups: " + info.total;
        } else {
          info.checking = "Using " + info.original + " with no lookups";
        }
      } catch (e) {}
    }
  } catch (error) {
    verbose && console.log(error);
  }
}

function most_common1(all_words, temp_words) {
  var temp_list = []
  Object.keys(all_words).forEach(function(key) {
    all_words[key].forEach(function(item) {
      if (!temp_list.includes(item) && item.length > 1) {
        temp_list.push(item);
        var temp = findWord(item);
        if (Object.keys(temp).length != 0) {
          var languages = Object.keys(temp).map(function(key) {
            return [key, temp[key]];
          });
          languages.sort(function(first, second) {
            return second[1] - first[1]
          }).reverse();
          temp_words.push({
            "word": item,
            "languages": languages.map(e => e.join(":")).join("  ")
          });
        }
      }
    });
  });
}

async function most_common(all_words, temp_words) {
  var temp_list = []
  Object.keys(all_words).forEach(function(key) {
    all_words[key].forEach(function(item) {
      if (!temp_list.includes(item) && item.length > 1) {
        temp_list.push(item);
        var temp = findWord(item);
        if (Object.keys(temp).length != 0) {
          var languages = Object.keys(temp).map(function(key) {
            return [key, temp[key]];
          });
          languages.sort(function(first, second) {
            return second[1] - first[1]
          }).reverse();
          temp_words.push({
            "word": item,
            "languages": languages.map(e => e[0]).join(", ")
          });
        }
      }
    });
  });
}

function find_other(all_words) {
  var words = WordsNinja.splitSentence(req.body.string);

  words.forEach(function(word) {
    var value = false
    Object.keys(all_words).forEach(function(key) {
      if (all_words[key].includes(word)) {
        value = true
      }
    });

    if (!value && !all_words.maybe.includes(word)) {
      all_words.maybe.push(word);
    }
  });
}

function remove_word(str, sub_string) {
  part1 = str.substring(0, str.indexOf(sub_string));
  part2 = str.substring(str.indexOf(sub_string) + sub_string.length, str.length);
  temp = (part1 + part2).replace(/[ \[\]:"\\|,.<>\/?~`!@#$%^&*()_+\-={};"]/gi, "");
  return temp;
}

async function analyze_name(req, all_words) {
  log_to_file_queue(req.body.uuid, "[Starting] String analysis")
  temp_rr_names = []
  string_to_check = req.body.string
  parsed_json.prefix.forEach(function(item, index) {
    if (string_to_check.indexOf(item) == 0 && !all_words.prefix.includes(item)) {
      all_words.prefix.push(item);
      temp = remove_word(string_to_check, item);
      if (temp !== null && temp !== "" && !all_words.unknown.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
        all_words.unknown.push(temp);
      }
    }
  });
  parsed_json.m_names.forEach(function(item, index) {
    if (string_to_check.indexOf(item) >= 0 && !all_words.name.includes(item)) {
      all_words.name.push(item);
      temp = remove_word(string_to_check, item);
      if (temp !== null && temp !== "" && !all_words.unknown.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
        all_words.unknown.push(temp);
      }
    }
  });
  parsed_json.f_names.forEach(function(item, index) {
    if (string_to_check.indexOf(item) >= 0 && !all_words.name.includes(item)) {
      all_words.name.push(item);
      temp = remove_word(string_to_check, item);
      if (temp !== null && temp !== "" && !all_words.unknown.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
        all_words.unknown.push(temp);
      }
    }
  });

  all_words.prefix.forEach(function(h_item, index) {
    all_words.unknown.forEach(function(r_item, index) {
      if (r_item.indexOf(h_item) == 0) {
        temp = remove_word(r_item, h_item);
        if (temp !== null && temp !== "" && !temp_rr_names.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
          temp_rr_names.push(temp);
        }
      }
    });
  });

  var temp_r_concat = all_words.unknown.concat(temp_rr_names.filter((item) => all_words.unknown.indexOf(item) < 0));

  all_words.unknown = temp_r_concat
  temp_rr_names = []

  all_words.number.forEach(function(n_item, index) {
    all_words.unknown.forEach(function(r_item, index) {
      if (r_item.indexOf(n_item) >= 0) {
        temp = remove_word(r_item, n_item);
        if (temp !== null && temp !== "" && !temp_rr_names.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
          temp_rr_names.push(temp);
        }
      }
    });
  });

  var temp_r_concat = all_words.unknown.concat(temp_rr_names.filter((item) => all_words.unknown.indexOf(item) < 0));
  all_words.unknown = temp_r_concat
  log_to_file_queue(req.body.uuid, "[Done] String analysis")
}

app.post("/url", async function(req, res, next) {
  await WordsNinja.loadDictionary();
  var info = {
    "items": [],
    "original": "",
    "corrected": "",
    "total": 0,
    "checking": "Using " + req.body.string + " with no lookups"
  }
  var user_info_normal = {
    data: {},
    type: "all"
  }
  var user_info_advanced = {
    data: {},
    type: "all"
  }
  var user_info_special = {
    data: {},
    type: "all"
  }
  var all_words = {
    "prefix": [],
    "name": [],
    "number": [],
    "symbol": [],
    "unknown": [],
    "maybe": []
  }
  var names_origins = []
  var words_info = []
  var temp_words = []
  if (req.body.string == null || req.body.string == "") {
    res.json("Error");
  } else {
    req.body.uuid = req.body.uuid.replace(/[^a-zA-Z0-9\-]+/g, '');
    if (req.body.option.includes("FindUserProfilesSpecial")) {
      log_to_file_queue(req.body.uuid, "[Starting] Checking user profiles special")
      user_info_special.data = await find_username_special(req);
      log_to_file_queue(req.body.uuid, "[Done] Checking user profiles special")
    }
    if (req.body.option.includes("FindUserProfilesFast")) {
      log_to_file_queue(req.body.uuid, "[Starting] Checking user profiles normal")
      user_info_advanced.data = await find_username_normal(req);
      log_to_file_queue(req.body.uuid, "[Done] Checking user profiles normal")
    }
    if (req.body.option.includes("FindUserProfilesSlow") || req.body.option.includes("ShowUserProfilesSlow")) {
      if (!req.body.option.includes("FindUserProfilesSlow")) {
        user_info_normal.type = "show"
      } else if (!req.body.option.includes("ShowUserProfilesSlow")) {
        user_info_normal.type = "noshow"
      }
      log_to_file_queue(req.body.uuid, "[Starting] Checking user profiles advanced")
      user_info_normal.data = await find_username_advanced(req);
      log_to_file_queue(req.body.uuid, "[Done] Checking user profiles advanced")
    }
    if (req.body.option.includes("LookUps")) {
      log_to_file_queue(req.body.uuid, "[Starting] Lookup")
      await check_engines(req, info);
      log_to_file_queue(req.body.uuid, "[Done] Lookup")
    }
    if (req.body.option.includes("SplitWordsByUpperCase")) {
      try {
        req.body.string.match(/[A-Z][a-z]+/g).forEach((item) => {
          if (item.length > 1 && !all_words.unknown.includes(item) && !all_words.maybe.includes(item)) {
            all_words.unknown.push(item.toLowerCase());
          }
        });
        log_to_file_queue(req.body.uuid, "[Done] Split by UpperCase")
      } catch (err) {}
    }

    if (req.body.option.includes("SplitWordsByAlphabet")) {
      try {
        req.body.string.match(/[A-Za-z]+/g).forEach((item) => {
          if (item.length > 1 && !all_words.unknown.includes(item) && !all_words.maybe.includes(item)) {
            all_words.unknown.push(item.toLowerCase());
          }
        });
        log_to_file_queue(req.body.uuid, "[Done] Split by Alphabet")
      } catch (err) {}
    }

    if (req.body.option.includes("FindOrigins")) {
      log_to_file_queue(req.body.uuid, "[Starting] Finding Origins")
      names_origins = await find_origins(req);
      log_to_file_queue(req.body.uuid, "[Done] Finding Origins")
    }

    req.body.string = req.body.string.toLowerCase();

    if (req.body.option.includes("ConvertNumbers")) {
      numbers_to_letters = {
        "4": "a",
        "8": "b",
        "3": "e",
        "1": "l",
        "0": "o",
        "5": "s",
        "7": "t",
        "2": "z"
      }

      temp_value = ""
      for (i = 0; i < req.body.string.length; i++) {
        _temp = numbers_to_letters[req.body.string.charAt(i)]
        if (_temp != undefined) {
          temp_value += numbers_to_letters[req.body.string.charAt(i)];
        } else {
          temp_value += req.body.string.charAt(i);
        }
      }
      req.body.string = temp_value
      log_to_file_queue(req.body.uuid, "[Done] Convert numbers to letters")
    }

    if (req.body.option.includes("LookUps") ||
      req.body.option.includes("WordInfo") ||
      req.body.option.includes("MostCommon") ||
      req.body.option.includes("SplitWordsByUpperCase") ||
      req.body.option.includes("SplitWordsByAlphabet") ||
      req.body.option.includes("FindSymbols") ||
      req.body.option.includes("FindNumbers") ||
      req.body.option.includes("ConvertNumbers")) {
      if (req.body.option.includes("FindNumbers")) {
        try {
          req.body.string.match(/(\d+)/g).forEach((item) => {
            if (!all_words.number.includes(item)) {
              all_words.number.push(item);
            }
          });
        } catch (err) {}
      }

      if (req.body.option.includes("FindSymbols")) {
        try {
          req.body.string.match(/[ \[\]:"\\|,.<>\/?~`!@#$%^&*()_+\-={};']/gi).forEach((item) => {
            if (item !== " " && !all_words.symbol.includes(item)) {
              all_words.symbol.push(item);
            }
          });
        } catch (err) {}
      }

      if (req.body.option.includes("SplitUpperCase")) {
        req.body.string = req.body.string.replace(/([A-Z]+)/g, " $1");
        if (req.body.string.startsWith(" ")) {
          req.body.string = req.body.string.substring(1);
        }
      }
      all_words.maybe = WordsNinja.splitSentence(req.body.string).filter(function(elem, index, self) {
        return index === self.indexOf(elem);
      }).filter(word => word.length > 1);
      await analyze_name(req, all_words);
      //find_other(all_words)
      Object.keys(all_words).forEach((key) => (all_words[key].length == 0) && delete all_words[key]);

      if (req.body.option.includes("MostCommon")) {
        await most_common(all_words, temp_words);
      }
      if (req.body.option.includes("WordInfo")) {
        await get_words_info(all_words, words_info);
      }
    } else if (req.body.option.includes("NormalAnalysis@@")) {
      var maybe_words = WordsNinja.splitSentence(req.body.string);
      all_words.maybe = maybe_words.filter(function(elem, index, self) {
        return index === self.indexOf(elem);
      });
      list_of_tokens = _tokenizer.tokenize(req.body.string);
      list_of_tokens.forEach(function(item, index) {
        if (item.tag in all_words) {
          all_words[item.tag].push(item.token);
        } else {
          all_words[item.tag] = []
          all_words[item.tag].push(item.token);
        }
      });

      Object.keys(all_words).forEach((key) => (all_words[key].length == 0) && delete all_words[key]);
    }
    res.json({
      info,
      table: all_words,
      common: temp_words,
      words_info: words_info,
      user_info_normal: user_info_normal,
      user_info_advanced: user_info_advanced,
      user_info_special: user_info_special,
      names_origins: names_origins
    });
  }
});

app.use((err, req, res, next) => {
  verbose && console.log(" --- Global Error ---")
  verbose && console.log(pe.render(err));
  res.json("Error");
});

process.on('uncaughtException', function(err) {
  verbose && console.log(" --- Uncaught Error ---")
  verbose && console.log(pe.render(err));
})


process.on('unhandledRejection', function(err) {
  verbose && console.log(" --- Uncaught Rejection ---")
  verbose && console.log(pe.render(err));
})

const server_host = '0.0.0.0';
const server_port = process.env.PORT || 9005;


async function check_user_cli(username, websites) {
  var ret = []
  var random_string = Math.random().toString(36).substring(2);
  var req = {
    'body': {
      'uuid': random_string,
      'string': username,
      'option': 'FindUserProfilesFast'
    }
  }
  await parsed_sites.forEach(async function(value, i) {
    parsed_sites[i].selected = "false"
    if (websites.length > 0) {
      await websites.split(' ').forEach(item => {
        if (parsed_sites[i].url.toLowerCase().includes(item.toLowerCase())) {
          parsed_sites[i].selected = "true"
        }
      });
    }
  });
  ret = await find_username_normal(req)
  if (typeof ret === 'undefined' || ret === undefined || ret.length == 0) {
    log_to_file_queue(req.body.uuid, 'User does not exist (try FindUserProfilesSlow or FindUserProfilesSpecial)');
  } else {
    await ret.forEach(item => {
      delete item['title']
      delete item['image']
      delete item['text']
      item['link'] = get_site_from_url(item['link'])
      log_to_file_queue(req.body.uuid, item);
    });
  }
};

async function list_all_websites() {
  var temp_arr = []
  await parsed_sites.forEach(item => {
    temp_arr.push(get_site_from_url(item.url))
  });
  console.log('[Listing] Available websites\n' + temp_arr.join('\n'))
}

if ('grid' in argv) {
  grid_url = argv.grid
}

if ('cli' in argv) {
  if ('list' in argv) {
    list_all_websites();
  } else if ('mode' in argv) {
    if (argv.mode == 'fast') {
      if ('user' in argv && 'website' in argv) {
        if (argv.user != "" && argv.website != "") {
          check_user_cli(argv.user, argv.website)
        } else {
          console.log("user or website is empty, use -h for help")
        }
      }
    }
  }
} else {
  var server = app.listen(server_port, server_host, function() {
    console.log("Server started at http://%s:%s/app.html", server_host, server_port);
  });
}
