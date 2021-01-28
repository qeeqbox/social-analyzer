var verbose = false;
var google_api_key = "";
var google_api_cs = "";
var grid_url = "";
var proxy = "";

var detection_level = {
  "extreme": {
    "fast": "normal",
    "slow": "normal,advanced,ocr",
    "detections": "true",
    "count":1,
    "found":2
  },
  "high": {
    "fast": "normal",
    "slow": "normal,advanced,ocr",
    "detections": "true,false",
    "count":2,
    "found":1
  },
  "current":"high"
}

var profile_template = {
  "found": 0,
  "image": "",
  "link": "",
  "rate": "",
  "title": "",
  "language": "",
  "text": "",
  "type": "",
  "good":"",
  "method":""
};

var detected_websites = {
  "normal":0,
  "advanced":0,
  "ocr":0,
  "true":0,
  "false":0,
  "count":0,
}

var header_options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:84.0) Gecko/20100101 Firefox/84.0',
  }
};

var https = require("follow-redirects").https;
var fs = require("fs");
var url = require("url");
var franc = require('franc');
var langs = require('langs');
var cheerio = require('cheerio');
var path = require('path');
var slash = require('slash');

var sites_json_path = slash(path.join(__dirname,'..','data', 'sites.json'))
var names_json_path = slash(path.join(__dirname,'..','data', 'names.json'))
var dict_json_path = slash(path.join(__dirname,'..','data', 'dict.json'))

var websites_entries = JSON.parse(fs.readFileSync(sites_json_path))['websites_entries'];
var shared_detections = JSON.parse(fs.readFileSync(sites_json_path))['shared_detections'];
var parsed_names_origins = JSON.parse(fs.readFileSync(names_json_path));
var parsed_json = JSON.parse(fs.readFileSync(dict_json_path));

var logs_queue = Promise.resolve();

function get_log_file(uuid) {
  _uuid = uuid.replace(/[^a-zA-Z0-9\-]+/g, '');
  _string = slash(path.join('logs', _uuid + "_log.txt"))
  return _string
}

function log_to_file_queue(uuid, msg, json=false) {
  logs_queue = logs_queue.then(function() {
    return new Promise(function(resolve) {
      temp_log_file = slash(path.join('logs', uuid + "_log.txt"))
      fs.appendFile(temp_log_file, msg + "\n", function(err, data) {
        if (json){
          console.log(JSON.stringify(msg, null, 2))
        }
        else{
          console.log(msg)
        }
        resolve();
      });
    });
  });
}

function get_language_by_parsing(body) {
  var language = "unavailable"
  try {
    var $ = cheerio.load(body);
    var code = $("html").attr("lang")
    if (code != "") {
      if ('undefined' !== langs.where("1", code) && langs.where("1", code)){
        language = langs.where("1", code).name
      }
    }
  } catch (err) {
    verbose && console.log(err);
  }
  return language
}

function get_language_by_guessing(text) {
  var language = "unavailable"
  try {
    if (text != "unavailable" && text != "") {
      var code = franc(text);
      if (code !== 'und') {
        if ('undefined' !== langs.where("3", code) && langs.where("3", code))
        {
          language = langs.where("3", code).name + " (Maybe)"
        }
      }
    }
  } catch (err) {
    verbose && console.log(err);
  }

  return language
}

function get_site_from_url(_url) {
  temp = url.parse(_url.replace("{username}", "nothinghere")).hostname
  return temp.replace("nothinghere.", "")
}

async function get_url_wrapper_json(url, time = 5) {
  try {
    let http_promise = new Promise((resolve, reject) => {
      var request = https.get(url, header_options, function(res) {
        var body = ""
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          resolve({
            'data': JSON.parse(body.toString())
          });
        });
      });
      request.on('error', function(e) {
        reject({
          'data': ''
        })
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
  } catch (err) {
    verbose && console.log(err);
  }
}

async function get_url_wrapper_text(url, time = 5) {
  response_body = "error-get-url"
  try {
    let http_promise = new Promise((resolve, reject) => {
      var request = https.get(url, header_options, function(res) {
        var body = ""
        res.on("data", function(chunk) {
          body += chunk;
        });
        res.on("end", function() {
          resolve(body);
        });
      });
      request.on('error', function(e) {
        reject({
          'data': ''
        })
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
  } catch (err) {
    verbose && console.log(err);
    return response_body
  }
}

module.exports = {
  get_log_file,
  profile_template,
  detection_level,
  detected_websites,
  shared_detections,
  get_language_by_parsing,
  get_language_by_guessing,
  websites_entries,
  parsed_names_origins,
  parsed_json,
  verbose,
  google_api_key,
  google_api_cs,
  grid_url,
  header_options,
  proxy,
  get_site_from_url,
  log_to_file_queue,
  get_url_wrapper_text,
  get_url_wrapper_json
}
