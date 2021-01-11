var verbose = false
var google_api_key = "";
var google_api_cs = "";
var grid_url = "";
var proxy = ""

var header_options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:84.0) Gecko/20100101 Firefox/84.0',
  }
};

var https = require("follow-redirects").https;
var fs = require("fs");
var url = require("url");

var parsed_sites = JSON.parse(fs.readFileSync("sites.json"));
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
  }
}

module.exports = {
  parsed_sites,
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
