const verbose = false
const global_lock = []
const google_api_key = ''
const google_api_cs = ''
const grid_url = ''
const proxy = ''
let tecert_file = ''

const detection_level = {
  extreme: {
    fast: 'normal',
    slow: 'normal,advanced,ocr',
    detections: 'true',
    count: 1,
    found: 2
  },
  high: {
    fast: 'normal',
    slow: 'normal,advanced,ocr',
    detections: 'true,false',
    count: 2,
    found: 1
  },
  current: 'high'
}

const profile_template = {
  found: 0,
  username: '',
  image: '',
  link: '',
  rate: '',
  status: '',
  title: '',
  language: '',
  country: '',
  rank: '',
  text: '',
  type: '',
  metadata: '',
  extracted: '',
  good: '',
  method: ''
}

const detected_websites = {
  normal: 0,
  advanced: 0,
  ocr: 0,
  true: 0,
  false: 0,
  count: 0
}

const header_options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0'
  }
}

const https = require('follow-redirects').https
const fs = require('fs')
const url = require('url')
const franc = require('franc')
const langs = require('langs')
const cheerio = require('cheerio')
const path = require('path')
const slash = require('slash')
const colors = require('colors/safe')
const ixora = require('ixora').QBIxora

const sites_json_path = slash(path.join(__dirname, '..', 'data', 'sites.json'))
const names_json_path = slash(path.join(__dirname, '..', 'data', 'names.json'))
const dict_json_path = slash(path.join(__dirname, '..', 'data', 'dict.json'))
const countries_json_path = slash(path.join(__dirname, '..', 'data', 'names.json'))
const public_graph_path = slash(path.join(__dirname, '..', 'public', 'graph.html'))

let temp_ixora = new ixora('Social-Analyzer', false)
temp_ixora.save_base_html(public_graph_path)
temp_ixora = null

const websites_entries = JSON.parse(fs.readFileSync(sites_json_path)).websites_entries
const shared_detections = JSON.parse(fs.readFileSync(sites_json_path)).shared_detections
const parsed_names_origins = JSON.parse(fs.readFileSync(names_json_path))
const parsed_json = JSON.parse(fs.readFileSync(dict_json_path))
const parsed_countries = JSON.parse(fs.readFileSync(names_json_path))

let logs_queue = Promise.resolve()

const strings_pages = new RegExp('captcha-info|Please enable cookies|Completing the CAPTCHA', 'i')
const strings_titles = new RegExp('not found|blocked|attention required|cloudflare', 'i')
const top_websites = new RegExp('^top([0-9]+)$', 'i')

function get_log_file (uuid) {
  const _uuid = uuid.replace(/[^a-zA-Z0-9\-]+/g, '')
  const _string = slash(path.join('logs', _uuid + '_log.txt'))
  return _string
}

function log_to_file_queue (uuid, msg, table = false, argv = undefined) {
  logs_queue = logs_queue.then(function () {
    return new Promise(function (resolve) {
      const temp_log_file = slash(path.join('logs', uuid + '_log.txt'))
      fs.appendFile(temp_log_file, msg + '\n', function (err, data) {
        if (table) {
          msg.forEach((item, index) => {
            if (index === 0) {
              console.log('-----------------------')
            }
            for (const [key, value] of Object.entries(item)) {
              if (key === 'extracted' || key === 'metadata') {
                if ((key === 'extracted' && argv.extract) || (key === 'metadata' && argv.metadata)) {
                  if (value !== 'unavailable') {
                    try {
                      value.forEach((metadata_item, i) => {
                        let temp_string_meta = key + ' ' + i
                        temp_string_meta = temp_string_meta.padEnd(13)
                        temp_string_meta = colors.blue(temp_string_meta) + ': '
                        for (const [metadata_key, metadata_value] of Object.entries(metadata_item)) {
                          if (metadata_value.length > 80 && argv.trim) {
                            temp_string_meta += colors.blue(metadata_key) + ' : ' + colors.yellow(metadata_value.substring(0, 80).replace(/\r?\n|\r/g, '') + '..') + ' '
                          } else {
                            temp_string_meta += colors.blue(metadata_key) + ' : ' + colors.yellow(metadata_value.replace(/\r?\n|\r/g, '')) + ' '
                          }
                        };
                        console.log(temp_string_meta)
                      })
                    } catch (err) {

                    }
                  } else {
                    console.log(colors.blue(key.padEnd(12)) + ' : ' + colors.yellow(value))
                  }
                }
              } else {
                console.log(colors.blue(key.padEnd(12)) + ' : ' + colors.yellow(value))
              }
            }
            console.log('-----------------------')
          })
        } else {
          console.log(msg)
        }
        resolve()
      })
    })
  })
}

function get_language_by_parsing (body) {
  let language = 'unavailable'
  try {
    const $ = cheerio.load(body)
    const code = $('html').attr('lang')
    if (code !== '') {
      if (langs.where('1', code) !== 'undefined' && langs.where('1', code)) {
        language = langs.where('1', code).name
      }
    }
  } catch (err) {
    verbose && console.log(err)
  }
  return language
}

function get_language_by_guessing (text) {
  let language = 'unavailable'
  try {
    if (text !== 'unavailable' && text !== '') {
      const code = franc(text)
      if (code !== 'und') {
        if (langs.where('3', code) !== 'undefined' && langs.where('3', code)) {
          language = langs.where('3', code).name + ' (Maybe)'
        }
      }
    }
  } catch (err) {
    verbose && console.log(err)
  }

  return language
}

function get_site_from_url (_url) {
  const temp = url.parse(_url.replace('{username}', 'nothinghere')).hostname
  return temp.replace('nothinghere.', '')
}

async function get_url_wrapper_json (url, time = 5) {
  try {
    const http_promise = new Promise((resolve, reject) => {
      const request = https.get(url, header_options, function (res) {
        let body = ''
        res.on('data', function (chunk) {
          body += chunk
        })
        res.on('end', function () {
          resolve({
            data: JSON.parse(body.toString())
          })
        })
      })
      request.on('error', function (e) {
        reject({
          data: ''
        })
      })
      request.on('socket', function (socket) {
        const timeout = (time !== 0) ? time * 1000 : 5000
        socket.setTimeout(timeout, function () {
          request.abort()
        })
      })
    })
    const response_body = await http_promise
    return response_body
  } catch (err) {
    verbose && console.log(err)
  }
}

async function get_url_wrapper_text (url, time = 5) {
  const response_body = 'error-get-url'
  try {
    const http_promise = new Promise((resolve, reject) => {
      const request = https.get(url, header_options, function (res) {
        let body = ''
        res.on('data', function (chunk) {
          body += chunk
        })
        res.on('end', function () {
          resolve(body)
        })
      })
      request.on('error', function (e) {
        reject({
          data: ''
        })
      })
      request.on('socket', function (socket) {
        const timeout = (time !== 0) ? time * 1000 : 5000
        socket.setTimeout(timeout, function () {
          request.abort()
        })
      })
    })
    const response_body = await http_promise
    return response_body
  } catch (err) {
    verbose && console.log(err)
    return response_body
  }
}

function compare_objects (object1, object2, key) {
  try {
    if (object1[key] === '') {
      object1[key] = '%0.0'
    }
    if (object2[key] === '') {
      object2[key] = '%0.0'
    }
    if (parseInt(object1[key].replace('%', '')) > parseInt(object2[key].replace('%', ''))) {
      return -1
    } else if (parseInt(object1[key].replace('%', '')) < parseInt(object2[key].replace('%', ''))) {
      return 1
    } else {
      return 0
    }
  } catch (err) {
    return 0
  }
}

function find_country (code) {
  let ctr = ''
  try {
    if (code.toUpperCase() in parsed_countries) {
      ctr = parsed_countries[code.toUpperCase()]
    }
  } catch (error) {

  }
  return ctr
}

async function setup_tecert () {
  if (!fs.existsSync('eng.traineddata')) {
    const file = fs.createWriteStream('eng.traineddata')
    const http_promise = new Promise((resolve, reject) => {
      const request = https.get('https://raw.githubusercontent.com/tesseract-ocr/tessdata/master/eng.traineddata', function (response) {
        response.pipe(file)
        resolve(1)
        request.setTimeout(12000, function () {
          request.abort()
        })
        file.on('finish', function () {
          file.close()
        })
        resolve(0)
      })
    })

    const get_eng = await http_promise
    if (get_eng === 1) {
      if (fs.existsSync('eng.traineddata')) {
        tecert_file = path.resolve(__dirname, 'eng.traineddata')
      }
    }
  } else {
    if (tecert_file === '') {
      if (fs.existsSync('eng.traineddata')) {
        tecert_file = path.resolve(__dirname, 'eng.traineddata')
      }
    }
  }
}

module.exports = {
  strings_pages,
  strings_titles,
  top_websites,
  tecert_file,
  setup_tecert,
  compare_objects,
  get_log_file,
  find_country,
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
  global_lock,
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
