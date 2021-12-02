//  -------------------------------------------------------------
//  author        Giga
//  project       qeeqbox/social-analyzer
//  email         gigaqeeq@gmail.com
//  description   app.py (CLI)
//  licensee      AGPL-3.0
//  -------------------------------------------------------------
//  contributors list qeeqbox/social-analyzer/graphs/contributors
//  -------------------------------------------------------------

const argv = require('yargs')
  .usage('Usage: $0 --username "johndoe" --websites "youtube tiktok"\nUsage: $0 "fast" --username "johndoe"')
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
  .help('help')
  .argv

if (argv.output !== 'json') {
  console.log('[init] Detections are updated very often, make sure to get the most up-to-date ones')
}

const semver = require('semver')
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

const express = require('express')
const fs = require('fs')
const tokenizer = require('wink-tokenizer')
const generatorics = require('generatorics')
const HttpsProxyAgent = require('https-proxy-agent')
const PrettyError = require('pretty-error')
const pe = new PrettyError()
require('express-async-errors')
//const _tokenizer = tokenizer()

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs')
}

const helper = require('./modules/helper.js')
const fastScan = require('./modules/fast-scan.js')
const slowScan = require('./modules/slow-scan.js')
const specialScan = require('./modules/special-scan.js')
const externalApis = require('./modules/external-apis.js')
const stringAnalysis = require('./modules/string-analysis.js')
const nameAnalysis = require('./modules/name-analysis.js')
const visualize = require('./modules/visualize.js')
const stats = require('./modules/stats.js')

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

  if (helper.proxy !== '') {
    helper.header_options.agent = HttpsProxyAgent(helper.proxy)
  } else {
    if ('agent' in helper.header_options) {
      delete helper.header_options.agent
    }
  }

  res.json('Done')
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

    if (req.body.option.includes('FindUserProfilesFast') || req.body.option.includes('GetUserProfilesFast')) {
      fast = true
      helper.log_to_file_queue(req.body.uuid, '[Starting] Checking user profiles normal')
      if (req.body.group) {
        const old_string_1 = req.body.string
        const all_usernames = req.body.string.split(',').map(async item => {
          req.body.string = item
          let temp_arr = await fastScan.find_username_normal(req)
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
        stats_default = await stats.get_stats(req,user_info_normal.data)
        helper.log_to_file_queue(req.body.uuid, '[Done] Generate stats')
      }
    }

    if (req.body.option.includes('FindUserProfilesSpecial')) {
      if (!fast) {
        helper.log_to_file_queue(req.body.uuid, '[Starting] Checking user profiles special')
        user_info_special.data = await specialScan.find_username_special(req)
        helper.log_to_file_queue(req.body.uuid, '[Done] Checking user profiles special')
      } else {
        helper.log_to_file_queue(req.body.uuid, '[Warning] FindUserProfilesFast with FindUserProfilesSpecial')
        helper.log_to_file_queue(req.body.uuid, '[Skipping] FindUserProfilesSpecial')
      }
    }

    if (req.body.option.includes('FindUserProfilesSlow') && fast) {
      helper.log_to_file_queue(req.body.uuid, '[Warning] FindUserProfilesFast with FindUserProfilesSlow')
      helper.log_to_file_queue(req.body.uuid, '[Skipping] FindUserProfilesSlow')
    }

    if (req.body.option.includes('ShowUserProfilesSlow') && fast) {
      helper.log_to_file_queue(req.body.uuid, '[Warning] FindUserProfilesFast with ShowUserProfilesSlow')
      helper.log_to_file_queue(req.body.uuid, '[Skipping] ShowUserProfilesSlow')
    }

    if ((req.body.option.includes('FindUserProfilesSlow') && !fast) || (req.body.option.includes('ShowUserProfilesSlow') && !fast)) {
      if (!req.body.option.includes('FindUserProfilesSlow')) {
        user_info_advanced.type = 'show'
      } else if (!req.body.option.includes('ShowUserProfilesSlow')) {
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
      if (req.body.option.includes("FindOrigins")) {
        helper.log_to_file_queue(req.body.uuid, "[Starting] Finding Origins")
        names_origins = await nameAnalysis.find_origins(req);
        helper.log_to_file_queue(req.body.uuid, "[Done] Finding Origins")
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

    try {
      logs = fs.readFileSync(helper.get_log_file(req.body.uuid), 'utf8')
    } catch {

    }

    helper.log_to_file_queue(req.body.uuid, '[Finished] Analyzing: ' + req.body.string + ' Task: ' + req.body.uuid)

     /*fs.writeFileSync('./test.json', JSON.stringify({
     username: username,
     uuid: temp_uuid,
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
     graph: graph,
     stats: stats_default,
     logs: logs
    }, null, 2) , 'utf-8');*/

    res.json({
      username: username,
      uuid: temp_uuid,
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
      graph: graph,
      stats: stats_default,
      logs: logs
    })
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

function search_and_change (site, _dict) {
  if (helper.websites_entries.includes(site)) {
    const item = helper.websites_entries.indexOf(site)
    if (item !== -1) {
      helper.websites_entries[item] = Object.assign({}, helper.websites_entries[item], _dict)
    }
  }
}

async function check_user_cli (argv) {
  let ret = []
  const random_string = Math.random().toString(36).substring(2)
  let temp_options = 'GetUserProfilesFast,FindUserProfilesFast'
  if (argv.method !== '') {
    if (argv.method === 'find') {
      temp_options = ',FindUserProfilesFast,'
    } else if (argv.method === 'get') {
      temp_options = ',GetUserProfilesFast,'
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

  await helper.websites_entries.forEach(async function (value, i) {
    helper.websites_entries[i].selected = 'false'
  })

  if (argv.websites === 'all') {
    if (argv.countries != 'all') {
      let list_of_countries = argv.countries.toLowerCase().split(' ')
      await helper.websites_entries.forEach(async function (value, i) {
        if (helper.websites_entries[i].country.toLowerCase() !== '' && list_of_countries.includes(helper.websites_entries[i].country.toLowerCase())) {
          helper.websites_entries[i].selected = 'true'
        } else {
          helper.websites_entries[i].selected = 'false'
        }
      })
    } else {
      await helper.websites_entries.forEach(async function (value, i) {
        helper.websites_entries[i].selected = 'true'
      })
    }
    
    if (argv.type != 'all') {
      let websites_entries_filtered = helper.websites_entries.filter((item) => item.selected === 'true')
      websites_entries_filtered = websites_entries_filtered.filter((item) => item.type.toLowerCase().includes(argv.type.toLowerCase()))

      await websites_entries_filtered.forEach(async function (value, i) {
        await search_and_change(websites_entries_filtered[i], {
          selected: 'pendding'
        })
      })
      await helper.websites_entries.forEach(async function (value, i) {
        if (helper.websites_entries[i].selected === 'pendding') {
          helper.websites_entries[i].selected = 'true'
        } else {
          helper.websites_entries[i].selected = 'false'
        }
      })
    }
    
    if (argv.top != 0) {
      let websites_entries_filtered = helper.websites_entries.filter((item) => item.selected === 'true')
      websites_entries_filtered = websites_entries_filtered.filter((item) => item.global_rank !== 0)
      websites_entries_filtered.sort(function (a, b) {
        return a.global_rank - b.global_rank
      })
      for (let i = 0; i < argv.top; i++) {
        await search_and_change(websites_entries_filtered[i], {
          selected: 'pendding'
        })
      }
      await helper.websites_entries.forEach(async function (value, i) {
        if (helper.websites_entries[i].selected === 'pendding') {
          helper.websites_entries[i].selected = 'true'
        } else {
          helper.websites_entries[i].selected = 'false'
        }
      })
    }
  } else {
    await helper.websites_entries.forEach(async function (value, i) {
      if (argv.websites.length > 0) {
        await argv.websites.split(' ').forEach(item => {
          if (helper.websites_entries[i].url.toLowerCase().includes(item.toLowerCase())) {
            helper.websites_entries[i].selected = 'true'
          }
        })
      }
    })
  }

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
      req.body.string = item
      let temp_arr = await fastScan.find_username_normal(req)
      ret.push(...temp_arr)
    })
    await Promise.all(all_usernames)
    req.body.string = old_string_1
  } else {
    ret = await fastScan.find_username_normal(req)
  }

  if (typeof ret === 'undefined' || ret === undefined || ret.length === 0) {
    helper.log_to_file_queue(req.body.uuid, 'User does not exist (try FindUserProfilesSlow or FindUserProfilesSpecial)')
  } else {
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
  if (argv.list) {
    list_all_websites()
  } else if (argv.mode === 'fast') {
    if (argv.cli) {
      console.log('[Warning] --cli is not needed and will be removed later on')
    }
    if (argv.username !== '' && argv.websites !== '') {
      check_user_cli(argv)
    }
  }
}
