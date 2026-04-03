//  -------------------------------------------------------------
//  author        Giga
//  project       qeeqbox/social-analyzer
//  email         gigaqeeq@gmail.com
//  description   app.py (CLI)
//  licensee      AGPL-3.0
//  -------------------------------------------------------------
//  contributors list qeeqbox/social-analyzer/graphs/contributors
//  -------------------------------------------------------------

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
const yarg_ = yargs(hideBin(process.argv))
const argv = yarg_.usage('Usage: $0 --username "johndoe" --websites "youtube tiktok"\nUsage: $0 "fast" --username "johndoe"')
  .describe('gui', 'Reserved for a gui')
  .default('gui', false)
  .boolean('gui')
  .describe('cli', 'Reserved for a cli (Not needed)')
  .default('cli', false)
  .boolean('cli')
  .describe('username', 'E.g. johndoe, john_doe or johndoe9999')
  .default('username', '')
  .describe('websites', 'A website or websites separated by space E.g. youtube, tiktok or tumblr')
  .default('websites', 'all')
  .describe('mode', 'Analysis mode E.g.fast -> FindUserProfilesFast, slow -> FindUserProfilesSlow or special -> FindUserProfilesSpecial')
  .default('mode', 'fast')
  .describe('output', 'Show the output in the following format: json -> json output for integration or pretty -> prettify the output')
  .default('output', 'pretty')
  .describe('options', 'Show the following when a profile is found: link, rate, title or text')
  .default('options', '')
  .describe('list', 'List all available websites')
  .default('list', false)
  .boolean('list')
  .describe('docker', 'allow docker')
  .default('docker', false)
  .boolean('docker')
  .describe('method', 'find -> show detected profiles, get -> show all profiles regardless detected or not, all -> combine find & get')
  .default('method', 'all')
  .describe('grid', 'grid option, not for CLI')
  .default('grid', '')
  .describe('extract', 'Extract profiles, urls & patterns if possible')
  .default('extract', false)
  .boolean('extract')
  .describe('metadata', 'Extract metadata if possible (pypi QeeqBox OSINT)')
  .default('metadata', false)
  .boolean('metadata')
  .describe('trim', 'Trim long strings')
  .default('trim', false)
  .boolean('trim')
  .describe('filter', 'filter detected profiles by good, maybe or bad, you can do combine them with comma (good,bad) or use all')
  .default('filter', 'good')
  .describe('profiles', 'filter profiles by detected, unknown or failed, you can do combine them with comma (detected,failed) or use all')
  .default('profiles', 'detected')
  .describe('top', 'select top websites as 10, 50 etc...[--websites is not needed]')
  .default('top', '0')
  .describe('type', 'Select websites by type (Adult, Music etc)')
  .default('type', 'all')
  .describe('countries', 'select websites by country or countries separated by space as: us br ru')
  .default('countries', 'all')
  .describe('save', 'save CLI results to a .json or .csv file')
  .default('save', '')
  .describe('recursive-depth', 'recursively search newly discovered usernames from public profile links')
  .default('recursive-depth', 0)
  .number('recursive-depth')
  .describe('recursive-limit', 'maximum new usernames to follow per recursion pass')
  .default('recursive-limit', 10)
  .number('recursive-limit')
  .describe('doctor', 'check selected sites for captcha, waf, timeout or reachability issues')
  .default('doctor', false)
  .boolean('doctor')
  .describe('sync-whatsmyname', 'download and convert the WhatsMyName dataset into importable JSON files')
  .default('sync-whatsmyname', '')
  .help('help')
  .argv

if (argv.output !== 'json') {
  console.log('[init] Detections are updated very often, make sure to get the most up-to-date ones')
}

import semver from 'semver'

if (semver.satisfies(process.version, '>13 || <13')) {
  if (argv.output !== 'json') {
    console.log('[init] NodeJS Version Check')
  }
} else {
  if (argv.output !== 'json') {
    console.log('[Error] NodeJS Version Check')
  }
  process.exit(1)
}

import express from 'express'
import fs from 'fs'
import path from 'path'
import tokenizer from 'wink-tokenizer'
import generatorics from 'generatorics'
import PrettyError from 'pretty-error'

const pe = new PrettyError()
import 'express-async-errors'
//const _tokenizer = tokenizer()

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs')
}

import helper from './modules/helper.js'
import fastScan from './modules/fast-scan.js'
import slowScan from './modules/slow-scan.js'
import specialScan from './modules/special-scan.js'
import externalApis from './modules/external-apis.js'
import stringAnalysis from './modules/string-analysis.js'
import nameAnalysis from './modules/name-analysis.js'
import visualize from './modules/visualize.js'
import stats from './modules/stats.js'
import { serialize_results_to_csv, serialize_results_to_json } from './modules/export-results.js'
import { serialize_results_to_html } from './modules/html-report.js'
import { collect_recursive_candidates } from './modules/recursive-search.js'
import { classify_site_response } from './modules/site-doctor.js'
import { sync_whatsmyname_dataset } from './modules/wmn-sync.js'
import { apply_site_filters, restore_site_selection, snapshot_site_selection } from './modules/site-selection.js'
import { build_analysis_summary } from './modules/ui-summary.js'

const app = express()
app.set('etag', false)
app.use(express.urlencoded({
  extended: true
}))
app.use(express.json())
app.use(express.static('public'))

app.post('/get_logs', async function (req, res, next) {
  let last_line = 'nothinghere'
  if (req.body.uuid !== '') {
    const temp_log_file = helper.get_log_file(req.body.uuid)
    if (fs.existsSync(temp_log_file)) {
      const data = fs.readFileSync(temp_log_file).toString()
      if (typeof data !== 'undefined' && data) {
        last_line = data.split('\n').slice(-2)[0]
      }
    } else {
      last_line = 'nothing_here_error'
    }
    res.send(last_line)
  }
})

app.get('/get_settings', async function (req, res, next) {
  let temp_list = await Promise.all(helper.websites_entries.map(async (site, index) => {
    let temp_url = ''
    if ('status' in site) {
      if (site.status === 'bad') {
        return Promise.resolve()
      }
    }
    if (site.detections.length > 0) {
      temp_url = helper.get_site_from_url(site.url)
      if (temp_url !== 'nothinghere') {
        let temp_selected = 'false'
        if ('selected' in site) {
          if (site.selected === 'true') {
            temp_selected = 'true'
          }
        }
        return Promise.resolve({
          index: index,
          url: temp_url,
          selected: temp_selected,
          global_rank: site.global_rank
        })
      }
    }

    return Promise.resolve()
  }))

  temp_list = temp_list.filter(item => item !== undefined)
  temp_list.sort(function (a, b) {
    const keyA = a.url
    const keyB = b.url
    // Compare the 2 dates
    if (keyA < keyB) return -1
    if (keyA > keyB) return 1
    return 0
  })
  res.json({
    proxy: helper.proxy,
    user_agent: helper.header_options.headers['User-Agent'],
    google: [helper.google_api_key.substring(0, 10) + '******', helper.google_api_cs.substring(0, 10) + '******'],
    websites: temp_list
  })
})

app.post('/save_settings', async function (req, res, next) {
  await helper.websites_entries.forEach(function (value, i) {
    helper.websites_entries[i].selected = 'false'
  })
  if ('websites' in req.body) {
    if (req.body.websites.length > 0) {
      await req.body.websites.split(',').forEach(item => {
        helper.websites_entries[Number(item)].selected = 'true'
      })
    }
  }
  if (req.body.google_key !== helper.google_api_key.substring(0, 10) + '******') {
    helper.google_api_key = req.body.google_key
  }
  if (req.body.google_cv !== helper.google_api_cs.substring(0, 10) + '******') {
    helper.google_api_cs = req.body.google_cv
  }
  if (req.body.user_agent !== helper.header_options.headers['User-Agent']) {
    helper.header_options.headers['User-Agent'] = req.body.user_agent
  }
  if (req.body.proxy !== helper.proxy) {
    helper.proxy = req.body.proxy
  }

  res.json('Done')
})

function normalize_scope_value (value, fallback = 'all') {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim()
  return normalized === '' ? fallback : normalized
}

function request_has_custom_scope (body = {}) {
  return normalize_scope_value(body.websites) !== 'all' ||
    normalize_scope_value(body.countries) !== 'all' ||
    normalize_scope_value(body.type) !== 'all' ||
    Number(body.top || 0) > 0
}

function resolve_scan_mode (body = {}) {
  const mode = (body.scan_mode || '').toLowerCase()
  if (['fast', 'slow', 'special'].includes(mode)) {
    return mode
  }
  if ((body.option || '').includes('FindUserProfilesSlow') || (body.option || '').includes('ShowUserProfilesSlow')) {
    return 'slow'
  }
  if ((body.option || '').includes('FindUserProfilesSpecial')) {
    return 'special'
  }
  return 'fast'
}

async function build_sites_doctor_report () {
  const probe_username = '__social_analyzer_probe__'
  const selected_sites = helper.websites_entries.filter((item) => item.selected === 'true')
  const report = []

  for (const site of selected_sites) {
    const target_url = site.url.replace('{username}', probe_username)
    const [status_code, response_body] = await helper.get_url_wrapper_text(target_url, site.timeout || 5)
    const summary = classify_site_response(status_code, response_body)
    report.push({
      site: helper.get_site_from_url(site.url),
      url: target_url,
      status: summary.status,
      reason: summary.reason,
      http_status: status_code
    })
  }

  return report
}

app.post('/export_results', async function (req, res, next) {
  const format = (req.body.format || 'json').toLowerCase()
  const results = req.body.results || {}
  const serialized = format === 'csv'
    ? serialize_results_to_csv(results)
    : format === 'html'
      ? serialize_results_to_html(results)
      : serialize_results_to_json(results)

  if (format === 'csv') {
    res.type('text/csv')
  } else if (format === 'html') {
    res.type('text/html')
  } else {
    res.type('application/json')
  }

  res.send(serialized)
})

app.post('/doctor_sites', async function (req, res, next) {
  const selection_snapshot = snapshot_site_selection(helper.websites_entries)

  try {
    if (request_has_custom_scope(req.body)) {
      apply_site_filters(helper.websites_entries, {
        websites: normalize_scope_value(req.body.websites),
        countries: normalize_scope_value(req.body.countries),
        type: normalize_scope_value(req.body.type),
        top: Number(req.body.top || 0)
      }, helper.find_country)
    }

    const report = await build_sites_doctor_report()
    const totals = report.reduce((accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] || 0) + 1
      return accumulator
    }, {})

    res.json({
      summary: Object.assign({
        total: report.length,
        ok: 0,
        blocked: 0,
        captcha: 0,
        timeout: 0
      }, totals),
      report
    })
  } finally {
    restore_site_selection(helper.websites_entries, selection_snapshot)
  }
})

app.get('/generate', async function (req, res, next) {
  const list_of_combinations = []
  if (req.body.option === 'Generate') {
    if (req.body.words !== undefined && req.body.words.length > 1 && req.body.words.length < 8) {
      for (const perm of generatorics.permutationCombination(req.body.words)) {
        if (perm.join('') !== '') {
          list_of_combinations.push(perm.join(''))
        }
      }
    }
  }
  res.json({
    combinations: list_of_combinations
  })
})

app.post('/cancel', async function (req, res, next) {
  if (req.body.option === 'on' && req.body.uuid !== '') {
    const temp_uuid = req.body.uuid.replace(/[^a-zA-Z0-9\-]+/g, '')
    if (!helper.global_lock.includes(temp_uuid)) {
      helper.log_to_file_queue(req.body.uuid, '[Canceling] task: ' + req.body.uuid)
      helper.global_lock.push(temp_uuid)
    }
  }
  res.json('Done')
})

app.post('/analyze_string', async function (req, res, next) {
  let username = ''
  let temp_uuid = ''
  const info = {
    items: [],
    original: '',
    corrected: '',
    total: 0,
    checking: 'Using ' + req.body.string + ' with no lookups'
  }
  const user_info_normal = {
    data: [],
    type: 'all'
  }
  const user_info_advanced = {
    data: [],
    type: 'all'
  }
  const user_info_special = {
    data: [],
    type: 'all'
  }
  const all_words = {
    prefix: [],
    name: [],
    number: [],
    symbol: [],
    unknown: [],
    maybe: []
  }
  let ages = []
  let names_origins = []
  const words_info = []
  const temp_words = []
  let custom_search = []
  let logs = ''
  let fast = false
  let recursive_results = []
  let graph = {
    graph: {
      nodes: [],
      links: []
    }
  }

  let stats_default = {
    categories: {},
    countries: {}
  }

  if (req.body.string === 'test_user_2021_2022_') {
    if (fs.existsSync('test.json')) {
      res.json(JSON.parse(fs.readFileSync('test.json', 'utf8')))
    } else {
      res.json('Error')
    }
  } else if (req.body.string === null || req.body.string === '') {
    res.json('Error')
  } else {
    const selection_snapshot = snapshot_site_selection(helper.websites_entries)
    try {
      const scan_mode = resolve_scan_mode(req.body)
      const recursive_depth = Number(req.body.recursive_depth || 0)
      const recursive_limit = Number(req.body.recursive_limit || 10)

      if (request_has_custom_scope(req.body)) {
        apply_site_filters(helper.websites_entries, {
          websites: normalize_scope_value(req.body.websites),
          countries: normalize_scope_value(req.body.countries),
          type: normalize_scope_value(req.body.type),
          top: Number(req.body.top || 0)
        }, helper.find_country)
      }

      username = req.body.string
      req.body.uuid = req.body.uuid.replace(/[^a-zA-Z0-9\-]+/g, '')
      temp_uuid = req.body.uuid

      helper.log_to_file_queue(req.body.uuid, '[Setting] Log file name: ' + req.body.uuid)

      if (req.body.string.includes(',')) {
        req.body.group = true
        helper.log_to_file_queue(req.body.uuid, '[Setting] Multiple usernames: ' + req.body.string)
      } else {
        req.body.group = false
        helper.log_to_file_queue(req.body.uuid, '[Setting] Username: ' + req.body.string)
      }

      if (req.body.option.includes('FindUserProfilesFast') || req.body.option.includes('GetUserProfilesFast') || scan_mode === 'fast') {
        fast = true
        helper.log_to_file_queue(req.body.uuid, '[Starting] Checking user profiles normal')
        if (req.body.group) {
          const old_string_1 = req.body.string
          const all_usernames = req.body.string.split(',').map(async item => {
            req.body.string = item
            const temp_arr = await fastScan.find_username_normal(req)
            user_info_normal.data.push(...temp_arr)
          })
          await Promise.all(all_usernames)
          req.body.string = old_string_1
        } else {
          user_info_normal.data = await fastScan.find_username_normal(req)
        }

        helper.log_to_file_queue(req.body.uuid, '[Done] Checking user profiles normal')
        if (req.body.option.includes('CategoriesStats') || req.body.option.includes('MetadataStats')) {
          helper.log_to_file_queue(req.body.uuid, '[Starting] Generate stats')
          stats_default = await stats.get_stats(req, user_info_normal.data)
          helper.log_to_file_queue(req.body.uuid, '[Done] Generate stats')
        }
      }

      const run_special_scan = req.body.option.includes('FindUserProfilesSpecial') || scan_mode === 'special' || scan_mode === 'fast'
      if (run_special_scan) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Checking user profiles special')
        user_info_special.data = await specialScan.find_username_special(req)
        helper.log_to_file_queue(req.body.uuid, '[Done] Checking user profiles special')
      }

      const wants_slow_find = req.body.option.includes('FindUserProfilesSlow') || scan_mode === 'slow'
      const wants_slow_show = req.body.option.includes('ShowUserProfilesSlow')

      if (wants_slow_find && fast) {
        helper.log_to_file_queue(req.body.uuid, '[Warning] FindUserProfilesFast with FindUserProfilesSlow')
        helper.log_to_file_queue(req.body.uuid, '[Skipping] FindUserProfilesSlow')
      }

      if (wants_slow_show && fast) {
        helper.log_to_file_queue(req.body.uuid, '[Warning] FindUserProfilesFast with ShowUserProfilesSlow')
        helper.log_to_file_queue(req.body.uuid, '[Skipping] ShowUserProfilesSlow')
      }

      if ((wants_slow_find && !fast) || (wants_slow_show && !fast)) {
        if (!wants_slow_find) {
          user_info_advanced.type = 'show'
        } else if (!wants_slow_show) {
          user_info_advanced.type = 'noshow'
        }
        helper.log_to_file_queue(req.body.uuid, '[Starting] Checking user profiles advanced')

        if (req.body.group) {
          const old_string_2 = req.body.string
          const all_usernames = req.body.string.split(',').map(async item => {
            req.body.string = item
            const temp_arr = await slowScan.find_username_advanced(req)
            user_info_advanced.data.push(...temp_arr)
          })
          await Promise.all(all_usernames)
          req.body.string = old_string_2
        } else {
          user_info_advanced.data = await slowScan.find_username_advanced(req)
        }

        helper.log_to_file_queue(req.body.uuid, '[Done] Checking user profiles advanced')
      }

      if (!req.body.group) {
        if (req.body.option.includes('LookUps')) {
          helper.log_to_file_queue(req.body.uuid, '[Starting] Lookup')
          await externalApis.check_engines(req, info)
          helper.log_to_file_queue(req.body.uuid, '[Done] Lookup')
        }
        if (req.body.option.includes('CustomSearch')) {
          helper.log_to_file_queue(req.body.uuid, '[Starting] Custom Search')
          custom_search = await externalApis.custom_search_ouputs(req)
          helper.log_to_file_queue(req.body.uuid, '[Done] Custom Search')
        }
        if (req.body.option.includes('FindOrigins')) {
          helper.log_to_file_queue(req.body.uuid, '[Starting] Finding Origins')
          names_origins = await nameAnalysis.find_origins(req)
          helper.log_to_file_queue(req.body.uuid, '[Done] Finding Origins')
        }
      } else {
        if (req.body.option.includes('FindOrigins')) {
          const old_string_2 = req.body.string
          const all_usernames = req.body.string.split(',').map(async item => {
            helper.log_to_file_queue(req.body.uuid, '[Starting] Finding Origins: ' + item)
            req.body.string = item
            const temp_arr = await nameAnalysis.find_origins(req)
            names_origins.push(...temp_arr)
            helper.log_to_file_queue(req.body.uuid, '[Done] Finding Origins: ' + item)
          })
          await Promise.all(all_usernames)
          req.body.string = old_string_2
        }

        await stringAnalysis.split_comma(req, all_words)
      }

      if (req.body.option.includes('SplitWordsByUpperCase')) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Split by UpperCase')
        await stringAnalysis.split_upper_case(req, all_words)
        helper.log_to_file_queue(req.body.uuid, '[Done] Split by UpperCase')
      }
      if (req.body.option.includes('SplitWordsByAlphabet')) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Split by Alphabet')
        await stringAnalysis.split_alphabet_case(req, all_words)
        helper.log_to_file_queue(req.body.uuid, '[Done] Split by Alphabet')
      }
      if (req.body.option.includes('FindSymbols')) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Finding Symbols')
        await stringAnalysis.find_symbols(req, all_words)
        helper.log_to_file_queue(req.body.uuid, '[Done] Finding Symbols')
      }
      if (req.body.option.includes('FindNumbers')) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Finding Numbers')
        await stringAnalysis.find_numbers(req, all_words)
        helper.log_to_file_queue(req.body.uuid, '[Done] Finding Numbers')
      }
      if (req.body.option.includes('FindAges')) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Finding Ages')
        ages = await stringAnalysis.guess_age_from_string(req)
        helper.log_to_file_queue(req.body.uuid, '[Done] Finding Ages')
      }

      req.body.string = req.body.string.toLowerCase()

      if (req.body.option.includes('ConvertNumbers')) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Convert Numbers')
        await stringAnalysis.convert_numbers(req, all_words)
        helper.log_to_file_queue(req.body.uuid, '[Done] Convert Numbers')
      }

      if (req.body.option.includes('LookUps') ||
        req.body.option.includes('WordInfo') ||
        req.body.option.includes('MostCommon') ||
        req.body.option.includes('SplitWordsByUpperCase') ||
        req.body.option.includes('SplitWordsByAlphabet') ||
        req.body.option.includes('FindSymbols') ||
        req.body.option.includes('FindNumbers') ||
        req.body.option.includes('ConvertNumbers')) {
        await stringAnalysis.get_maybe_words(req, all_words)
        await stringAnalysis.analyze_string(req, all_words)

        Object.keys(all_words).forEach((key) => (all_words[key].length === 0) && delete all_words[key])

        if (req.body.option.includes('MostCommon')) {
          await stringAnalysis.most_common(all_words, temp_words)
        }
        if (req.body.option.includes('WordInfo')) {
          await externalApis.get_words_info(all_words, words_info)
        }
      } else if (req.body.option.includes('NormalAnalysis@@')) {
        /*
        // var maybe_words = WordsNinja.splitSentence(req.body.string);
        all_words.maybe = maybe_words.filter(function (elem, index, self) {
          return index === self.indexOf(elem)
        })
        list_of_tokens = _tokenizer.tokenize(req.body.string)
        list_of_tokens.forEach(function (item, index) {
          if (item.tag in all_words) {
            all_words[item.tag].push(item.token)
          } else {
            all_words[item.tag] = []
            all_words[item.tag].push(item.token)
          }
        })

        Object.keys(all_words).forEach((key) => (all_words[key].length === 0) && delete all_words[key])
        */
      }

      if (req.body.option.includes('NetworkGraph')) {
        if ('data' in user_info_normal) {
          if (user_info_normal.data.length > 0) {
            if (req.body.option.includes('ExtractMetadata')) {
              helper.log_to_file_queue(req.body.uuid, '[Starting] Network Graph')
              graph = await visualize.visualize_force_graph(req, user_info_normal.data, 'fast')
              helper.log_to_file_queue(req.body.uuid, '[Done] Network Graph')
            } else {
              helper.log_to_file_queue(req.body.uuid, '[Warning] NetworkGraph needs ExtractMetadata')
            }
          }
        }
      }

      recursive_results = await run_recursive_cli_scan({
        mode: scan_mode,
        'recursive-depth': recursive_depth,
        'recursive-limit': recursive_limit
      }, req, [
        ...user_info_normal.data,
        ...user_info_advanced.data,
        ...user_info_special.data
      ])

      try {
        logs = fs.readFileSync(helper.get_log_file(req.body.uuid), 'utf8')
      } catch {

      }

      helper.log_to_file_queue(req.body.uuid, '[Finished] Analyzing: ' + req.body.string + ' Task: ' + req.body.uuid)

      const response_payload = {
        username: username,
        uuid: temp_uuid,
        scope: {
          mode: scan_mode,
          countries: normalize_scope_value(req.body.countries),
          websites: normalize_scope_value(req.body.websites),
          type: normalize_scope_value(req.body.type),
          top: String(Number(req.body.top || 0))
        },
        info,
        ages: ages,
        table: all_words,
        common: temp_words,
        words_info: words_info,
        user_info_normal: user_info_normal,
        user_info_advanced: user_info_advanced,
        user_info_special: user_info_special,
        names_origins: names_origins,
        custom_search: custom_search,
        recursive_results: recursive_results,
        graph: graph,
        stats: stats_default,
        logs: logs
      }

      response_payload.summary = build_analysis_summary(response_payload)
      res.json(response_payload)
    } finally {
      restore_site_selection(helper.websites_entries, selection_snapshot)
    }
  }
})

app.use((err, req, res, next) => {
  helper.verbose && console.log(' --- Global Error ---')
  helper.verbose && console.log(pe.render(err))
  res.json('Error')
})

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

process.on('uncaughtException', function (err) {
  helper.verbose && console.log(' --- Uncaught Error ---')
  helper.verbose && console.log(pe.render(err))
})

process.on('unhandledRejection', function (err) {
  helper.verbose && console.log(' --- Uncaught Rejection ---')
  helper.verbose && console.log(pe.render(err))
})

function delete_keys (object, temp_keys) {
  temp_keys.forEach((key) => {
    try {
      delete object[key]
    } catch (err) {}
  })
  return object
}

function clean_up_item (object, temp_keys_str) {
  delete object.image
  if (temp_keys_str === '') {} else {
    Object.keys(object).forEach((key) => {
      try {
        if (!temp_keys_str.includes(key)) {
          delete object[key]
        }
      } catch (err) {}
    })
  }
  return object
}

async function select_sites_for_cli (argv) {
  apply_site_filters(helper.websites_entries, {
    websites: argv.websites,
    countries: argv.countries,
    type: argv.type,
    top: argv.top
  }, helper.find_country)
}

async function run_cli_scan_for_username (argv, req, username, discovered_from = '') {
  const old_string = req.body.string
  req.body.string = username
  let results = []
  if (argv.mode === 'slow') {
    results = await slowScan.find_username_advanced(req)
  } else if (argv.mode === 'special') {
    results = await specialScan.find_username_special(req)
  } else {
    results = await fastScan.find_username_normal(req)
    results.push(...await specialScan.find_username_special(req))
  }
  req.body.string = old_string

  if (discovered_from !== '') {
    results = results.map(item => Object.assign({}, item, {
      discovered_from: discovered_from
    }))
  }
  return results
}

function dedupe_profiles (profiles) {
  const seen = new Set()
  return profiles.filter(item => {
    const key = [item.username || '', item.link || '', item.method || '', item.discovered_from || ''].join('::')
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

async function run_recursive_cli_scan (argv, req, initial_results) {
  if (argv['recursive-depth'] <= 0 || req.body.group) {
    return []
  }

  const queried = new Set([req.body.string.toLowerCase()])
  let frontier = collect_recursive_candidates(initial_results, Array.from(queried)).slice(0, argv['recursive-limit'])
  const recursive_results = []

  for (let depth = 1; depth <= argv['recursive-depth']; depth++) {
    if (frontier.length === 0) {
      break
    }

    const next_frontier = []
    for (const candidate of frontier) {
      const normalized = candidate.username.toLowerCase()
      if (queried.has(normalized)) {
        continue
      }
      queried.add(normalized)
      const candidate_results = await run_cli_scan_for_username(argv, req, candidate.username, candidate.discovered_from)
      recursive_results.push(...candidate_results)
      const discovered = collect_recursive_candidates(candidate_results, Array.from(queried))
      discovered.forEach(item => {
        if (!queried.has(item.username.toLowerCase())) {
          next_frontier.push(item)
        }
      })
    }

    frontier = dedupe_profiles(next_frontier.map(item => ({
      username: item.username,
      link: item.source_url,
      method: '',
      discovered_from: item.discovered_from
    }))).map(item => ({
      username: item.username,
      discovered_from: item.discovered_from,
      source_url: item.link
    })).slice(0, argv['recursive-limit'])
  }

  return recursive_results
}

function save_cli_results (results, output_path) {
  const absolute_path = path.resolve(output_path)
  const extension = path.extname(absolute_path).toLowerCase()
  const serialized = extension === '.csv'
    ? serialize_results_to_csv(results)
    : serialize_results_to_json(results)
  fs.mkdirSync(path.dirname(absolute_path), { recursive: true })
  fs.writeFileSync(absolute_path, serialized)
  return absolute_path
}

async function run_sites_doctor_cli (argv) {
  await select_sites_for_cli(argv)
  const report = await build_sites_doctor_report()

  if (argv.output === 'json') {
    console.log(JSON.stringify(report, null, 2))
  } else {
    report.forEach(item => {
      console.log(`[doctor] ${item.site} -> ${item.status} (${item.reason})`)
    })
  }

  if (argv.save !== '') {
    const saved_path = save_cli_results({ doctor: report }, argv.save)
    console.log(`[save] ${saved_path}`)
  }
}

async function check_user_cli (argv) {
  let ret = []
  const random_string = Math.random().toString(36).substring(2)
  let temp_options = 'GetUserProfilesFast,FindUserProfilesFast,FindUserProfilesSpecial'
  if (argv.mode === 'slow') {
    temp_options = ',FindUserProfilesSlow,'
  } else if (argv.mode === 'special') {
    temp_options = ',FindUserProfilesSpecial,'
  } else if (argv.method !== '') {
    if (argv.method === 'find') {
      temp_options = ',FindUserProfilesFast,FindUserProfilesSpecial,'
    } else if (argv.method === 'get') {
      temp_options = ',GetUserProfilesFast,'
    } else if (argv.method === 'all') {
      temp_options = 'GetUserProfilesFast,FindUserProfilesFast,FindUserProfilesSpecial'
    }
  }
  if (argv.extract) {
    temp_options += ',ExtractPatterns,'
  }
  if (argv.metadata) {
    temp_options += ',ExtractMetadata,'
  }
  const req = {
    body: {
      uuid: random_string,
      string: argv.username,
      option: temp_options + argv.output
    }
  }

  await select_sites_for_cli(argv)

  if (req.body.string.includes(',')) {
    req.body.group = true
    helper.log_to_file_queue(req.body.uuid, '[Setting] Multiple usernames: ' + req.body.string)
  } else {
    req.body.group = false
    helper.log_to_file_queue(req.body.uuid, '[Setting] Username: ' + req.body.string)
  }

  if (req.body.group) {
    const old_string_1 = req.body.string
    const all_usernames = req.body.string.split(',').map(async item => {
      const temp_arr = await run_cli_scan_for_username(argv, req, item)
      ret.push(...temp_arr)
    })
    await Promise.all(all_usernames)
    req.body.string = old_string_1
  } else {
    ret = await run_cli_scan_for_username(argv, req, req.body.string)
    ret.push(...await run_recursive_cli_scan(argv, req, ret))
  }

  if (typeof ret === 'undefined' || ret === undefined || ret.length === 0) {
    helper.log_to_file_queue(req.body.uuid, 'User does not exist (try FindUserProfilesSlow or FindUserProfilesSpecial)')
  } else {
    const special_site_hosts = helper.websites_entries
      .filter(item => item.selected === 'true' && item.detections.some(detection => detection.type === 'special'))
      .map(item => helper.get_site_from_url(item.url))

    ret = ret.map(item => {
      if (!('method' in item) || item.method === '') {
        item.method = 'find'
      }
      return item
    })
    if (argv.mode === 'fast' && special_site_hosts.length > 0) {
      ret = ret.filter(item => {
        if (!item.link || item.method === 'find') {
          return true
        }
        return !special_site_hosts.includes(helper.get_site_from_url(item.link))
      })
    }
    const temp_detected = {
      detected: [],
      unknown: [],
      failed: []
    }
    await ret.forEach(item => {
      if (item.method === 'all') {
        if (item.good === 'true') {
          item = delete_keys(item, ['method', 'good'])
          item = clean_up_item(item, argv.options)
          temp_detected.detected.push(item)
        } else {
          item = delete_keys(item, ['found', 'rate', 'status', 'method', 'good', 'text', 'extracted', 'metadata'])
          item = clean_up_item(item, argv.options)
          temp_detected.unknown.push(item)
        }
      } else if (item.method === 'find') {
        if (item.good === 'true') {
          item = delete_keys(item, ['method', 'good'])
          item = clean_up_item(item, argv.options)
          temp_detected.detected.push(item)
        }
      } else if (item.method === 'get') {
        item = delete_keys(item, ['found', 'rate', 'status', 'method', 'good', 'text', 'extracted', 'metadata'])
        item = clean_up_item(item, argv.options)
        temp_detected.unknown.push(item)
      } else if (item.method === 'failed') {
        item = delete_keys(item, ['found', 'rate', 'status', 'method', 'good', 'text', 'language', 'title', 'type', 'extracted', 'metadata'])
        item = clean_up_item(item, argv.options)
        temp_detected.failed.push(item)
      }
    })

    if (temp_detected.detected.length === 0) {
      delete temp_detected.detected
    } else {
      if (argv.profiles.includes('all') || argv.profiles.includes('detected')) {
        if (argv.filter.includes('all')) {

        } else {
          temp_detected.detected = temp_detected.detected.filter(item => argv.filter.includes(item.status))
        }

        if (temp_detected.detected.length === 0) {
          delete temp_detected.detected
        }
      } else {
        delete temp_detected.detected
      }
    }

    if (temp_detected.unknown.length === 0) {
      delete temp_detected.unknown
    } else {
      if (argv.profiles.includes('all') || argv.profiles.includes('unknown')) {

      } else {
        delete temp_detected.unknown
      }
    }

    if (temp_detected.failed.length === 0) {
      delete temp_detected.failed
    } else {
      if (argv.profiles.includes('all') || argv.profiles.includes('failed')) {

      } else {
        delete temp_detected.failed
      }
    }

    if (argv.output === 'pretty' || argv.output === '') {
      if ('detected' in temp_detected) {
        helper.log_to_file_queue(req.body.uuid, '[Detected] ' + temp_detected.detected.length + ' Profile[s]')
        helper.log_to_file_queue(req.body.uuid, temp_detected.detected, true, argv)
      }
      if ('unknown' in temp_detected) {
        helper.log_to_file_queue(req.body.uuid, '[Unknown] ' + temp_detected.unknown.length + ' Profile[s]')
        helper.log_to_file_queue(req.body.uuid, temp_detected.unknown, true, argv)
      }
      if ('failed' in temp_detected) {
        helper.log_to_file_queue(req.body.uuid, '[failed] ' + temp_detected.failed.length + ' Profile[s]')
        helper.log_to_file_queue(req.body.uuid, temp_detected.failed, true, argv)
      }
    }

    if (argv.output === 'json') {
      console.log(JSON.stringify(temp_detected, null, 2))
    }

    if (argv.save !== '') {
      const saved_path = save_cli_results(temp_detected, argv.save)
      console.log('[save] ' + saved_path)
    }
  }
};

async function list_all_websites () {
  const temp_arr = []
  await helper.websites_entries.forEach(item => {
    temp_arr.push(helper.get_site_from_url(item.url))
  })

  console.log('[Listing] Available websites\n' + temp_arr.join('\n'))
}

let server_host = 'localhost'
const server_port = process.env.PORT || 9005

if (argv.grid !== '') {
  helper.grid_url = argv.grid
}
if (argv.docker) {
  server_host = '0.0.0.0'
}
if (argv.gui) {
  app.listen(server_port, server_host, function () {
    // helper.setup_tecert()
    console.log('Server started at http://%s:%s/app.html', server_host, server_port)
  })
} else {
  if (argv['sync-whatsmyname'] !== '') {
    const summary = await sync_whatsmyname_dataset(argv['sync-whatsmyname'])
    console.log(JSON.stringify(summary, null, 2))
  } else if (argv.list) {
    list_all_websites()
  } else if (argv.doctor) {
    await run_sites_doctor_cli(argv)
  } else if (['fast', 'slow', 'special'].includes(argv.mode)) {
    if (argv.cli) {
      console.log('[Warning] --cli is not needed and will be removed later on')
    }
    if (argv.username !== '' && argv.websites !== '') {
      await check_user_cli(argv)
    }
  }
}
