//  -------------------------------------------------------------
//  author        Giga
//  project       qeeqbox/social-analyzer
//  email         gigaqeeq@gmail.com
//  description   app.py (CLI)
//  licensee      AGPL-3.0
//  -------------------------------------------------------------
//  contributors list qeeqbox/social-analyzer/graphs/contributors
//  -------------------------------------------------------------

var argv = require('yargs')
  .usage('Usage: $0 --cli --mode "fast" --username "johndoe" --websites "youtube tiktok"\nUsage: $0 --cli --mode "fast" --username "johndoe"')
  .describe('cli', 'a user or stirng')
  .default("cli", false)
  .boolean('cli')
  .describe('username', 'E.g. johndoe, john_doe or johndoe9999')
  .default("username", "")
  .describe('websites', 'Website or websites separated by space E.g. youtube, tiktok or tumblr')
  .default("websites", "all")
  .describe('mode', 'Analysis mode E.g.fast -> FindUserProfilesFast, slow -> FindUserProfilesSlow or special -> FindUserProfilesSpecial')
  .default("mode", "")
  .describe('output', 'arg_parser_optional.add_argument("--output", help="Show the output in the following format: json -> json output for integration or pretty -> prettify the output')
  .default("output", "")
  .describe('options', 'Show the following when a profile is found: link, rate, title or text')
  .default("options", "")
  .describe('list', 'List all available websites')
  .default("list", false)
  .boolean('list')
  .describe('docker', 'allow docker')
  .default("docker", false)
  .boolean('docker')
  .describe('grid', 'grid option, not for CLI')
  .default("grid", "")
  .help('help')
  .argv;

if (argv.output != "json") {
  console.log('[!] Detections are updated every often, make sure to get the most updated ones');
}

var semver = require('semver');
if (semver.satisfies(process.version, '>13 || <13')) {
  if (argv.output != "json") {
    console.log('[Good] NodeJS Version Check');
  }
} else {
  if (argv.output != "json") {
    console.log('[Error] NodeJS Version Check');
  }
  process.exit(1);
}

var express = require("express");
var fs = require("fs");
var tokenizer = require("wink-tokenizer");
var generatorics = require("generatorics");
var HttpsProxyAgent = require('https-proxy-agent');
var PrettyError = require('pretty-error');
var pe = new PrettyError();
require('express-async-errors');
var _tokenizer = tokenizer();

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

var helper = require("./modules/helper.js")
var fastScan = require("./modules/fast-scan.js")
var slowScan = require("./modules/slow-scan.js")
var specialScan = require("./modules/special-scan.js")
var externalApis = require("./modules/external-apis.js")
var stringAnalysis = require("./modules/string-analysis.js")
var nameAnalysis = require("./modules/name-analysis.js")

var app = express();

app.use(express.urlencoded({
  extended: true
}));
app.use(express.json());
app.use(express.static("public"));

app.post("/get_logs", async function(req, res, next) {
  var last_line = "nothinghere"
  if (req.body.uuid != "") {
    temp_log_file = helper.get_log_file(req.body.uuid)
    var data = fs.readFileSync(temp_log_file).toString();
    if (typeof data !== 'undefined' && data) {
      last_line = data.split('\n').slice(-2)[0];
    }
    res.send(last_line)
  }
})

app.get("/get_settings", async function(req, res, next) {
  temp_list = [];
  temp_list = await Promise.all(helper.parsed_sites.map(async (site, index) => {
    var temp_url = "";
    if ("status" in site) {
      if (site.status == "bad") {
        return Promise.resolve();
      }
    }
    if (site.detections.length > 0) {
      temp_url = helper.get_site_from_url(site.url)
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
    proxy: helper.proxy,
    user_agent: helper.header_options['headers']['User-Agent'],
    google: [helper.google_api_key.substring(0, 10) + "******", helper.google_api_cs.substring(0, 10) + "******"],
    websites: temp_list
  });
});

app.post("/save_settings", async function(req, res, next) {
  await helper.parsed_sites.forEach(function(value, i) {
    helper.parsed_sites[i].selected = "false"
  });
  if ("websites" in req.body) {
    if (req.body.websites.length > 0) {
      await req.body.websites.split(',').forEach(item => {
        helper.parsed_sites[Number(item)].selected = "true";
      });
    }
  }
  if (req.body.google_key != helper.google_api_key.substring(0, 10) + "******") {
    helper.google_api_key = req.body.google_key;
  }
  if (req.body.google_cv != helper.google_api_cs.substring(0, 10) + "******") {
    helper.google_api_cs = req.body.google_cv;
  }
  if (req.body.user_agent != helper.header_options['headers']['User-Agent']) {
    helper.header_options['headers']['User-Agent'] = req.body.user_agent;
  }
  if (req.body.proxy != helper.proxy) {
    helper.proxy = req.body.proxy;
  }

  if (helper.proxy != "") {
    helper.header_options['agent'] = HttpsProxyAgent(helper.proxy)
  } else {
    if ('agent' in helper.header_options) {
      delete helper.header_options['agent'];
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

app.post("/analyze_string", async function(req, res, next) {

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
  var custom_search = []
  if (req.body.string == null || req.body.string == "") {
    res.json("Error");
  } else {
    req.body.uuid = req.body.uuid.replace(/[^a-zA-Z0-9\-]+/g, '');
    if (req.body.option.includes("FindUserProfilesSpecial")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Checking user profiles special")
      user_info_special.data = await specialScan.find_username_special(req);
      helper.log_to_file_queue(req.body.uuid, "[Done] Checking user profiles special")
    }
    if (req.body.option.includes("FindUserProfilesFast")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Checking user profiles normal")
      user_info_advanced.data = await fastScan.find_username_normal(req);
      helper.log_to_file_queue(req.body.uuid, "[Done] Checking user profiles normal")
    }
    if (req.body.option.includes("FindUserProfilesSlow") || req.body.option.includes("ShowUserProfilesSlow")) {
      if (!req.body.option.includes("FindUserProfilesSlow")) {
        user_info_normal.type = "show"
      } else if (!req.body.option.includes("ShowUserProfilesSlow")) {
        user_info_normal.type = "noshow"
      }
      helper.log_to_file_queue(req.body.uuid, "[Starting] Checking user profiles advanced")
      user_info_normal.data = await slowScan.find_username_advanced(req);
      helper.log_to_file_queue(req.body.uuid, "[Done] Checking user profiles advanced")
    }
    if (req.body.option.includes("LookUps")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Lookup")
      await externalApis.check_engines(req, info);
      helper.log_to_file_queue(req.body.uuid, "[Done] Lookup")
    }
    if (req.body.option.includes("CustomSearch")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Custom Search")
      custom_search = await externalApis.custom_search_ouputs(req);
      helper.log_to_file_queue(req.body.uuid, "[Done] Custom Search")
    }
    if (req.body.option.includes("FindOrigins")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Finding Origins")
      names_origins = await nameAnalysis.find_origins(req);
      helper.log_to_file_queue(req.body.uuid, "[Done] Finding Origins")
    }
    if (req.body.option.includes("SplitWordsByUpperCase")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Split by UpperCase")
      await stringAnalysis.split_upper_case(req,all_words)
      helper.log_to_file_queue(req.body.uuid, "[Done] Split by UpperCase")
    }
    if (req.body.option.includes("SplitWordsByAlphabet")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Split by Alphabet")
      await stringAnalysis.split_alphabet_case(req,all_words)
      helper.log_to_file_queue(req.body.uuid, "[Done] Split by Alphabet")
    }
    if (req.body.option.includes("FindSymbols")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Finding Symbols")
      await stringAnalysis.find_symbols(req,all_words)
      helper.log_to_file_queue(req.body.uuid, "[Done] Finding Symbols")
    }
    if (req.body.option.includes("FindNumbers")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Finding Numbers")
      await stringAnalysis.find_numbers(req,all_words)
      helper.log_to_file_queue(req.body.uuid, "[Done] Finding Numbers")
    }
    req.body.string = req.body.string.toLowerCase();

    if (req.body.option.includes("ConvertNumbers")) {
      helper.log_to_file_queue(req.body.uuid, "[Starting] Convert Numbers")
      await stringAnalysis.convert_numbers(req,all_words)
      helper.log_to_file_queue(req.body.uuid, "[Done] Convert Numbers")
    }

    if (req.body.option.includes("LookUps") ||
      req.body.option.includes("WordInfo") ||
      req.body.option.includes("MostCommon") ||
      req.body.option.includes("SplitWordsByUpperCase") ||
      req.body.option.includes("SplitWordsByAlphabet") ||
      req.body.option.includes("FindSymbols") ||
      req.body.option.includes("FindNumbers") ||
      req.body.option.includes("ConvertNumbers")) {

      await stringAnalysis.get_maybe_words(req, all_words)
      await stringAnalysis.analyze_string(req, all_words);

      Object.keys(all_words).forEach((key) => (all_words[key].length == 0) && delete all_words[key]);

      if (req.body.option.includes("MostCommon")) {
        await stringAnalysis.most_common(all_words, temp_words);
      }
      if (req.body.option.includes("WordInfo")) {
        await externalApis.get_words_info(all_words, words_info);
      }
    } else if (req.body.option.includes("NormalAnalysis@@")) {
      //var maybe_words = WordsNinja.splitSentence(req.body.string);
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
      names_origins: names_origins,
      custom_search: custom_search
    });
  }
});

app.use((err, req, res, next) => {
  helper.verbose && console.log(" --- Global Error ---")
  helper.verbose && console.log(pe.render(err));
  res.json("Error");
});

process.on('uncaughtException', function(err) {
  helper.verbose && console.log(" --- Uncaught Error ---")
  helper.verbose && console.log(pe.render(err));
})


process.on('unhandledRejection', function(err) {
  helper.verbose && console.log(" --- Uncaught Rejection ---")
  helper.verbose && console.log(pe.render(err));
})

async function check_user_cli(argv) {
  var ret = []
  var random_string = Math.random().toString(36).substring(2);
  var req = {
    'body': {
      'uuid': random_string,
      'string': argv.username,
      'option': 'FindUserProfilesFast,' + argv.output
    }
  }

  if (argv.websites == "all"){
    await helper.parsed_sites.forEach(async function(value, i) {
            helper.parsed_sites[i].selected = "true"
    });
  }
  else{
    await helper.parsed_sites.forEach(async function(value, i) {
      helper.parsed_sites[i].selected = "false"
      if (argv.websites.length > 0) {
        await argv.websites.split(' ').forEach(item => {
          if (helper.parsed_sites[i].url.toLowerCase().includes(item.toLowerCase())) {
            helper.parsed_sites[i].selected = "true"
          }
        });
      }
    });
  }

  ret = await fastScan.find_username_normal(req)
  if (typeof ret === 'undefined' || ret === undefined || ret.length == 0) {
    helper.log_to_file_queue(req.body.uuid, 'User does not exist (try FindUserProfilesSlow or FindUserProfilesSpecial)');
  } else {
    var temp_detected = []
    await ret.forEach(item => {
      var temp_keys = {"found": 0,"link": "","rate": "","title": "","text": "","image":""};
      if (argv.options == "")
      {
        delete item['text']
        delete item['image']
      }
      else{
        for (var key in temp_keys) {
          if (!argv.options.includes(key)){
            delete item[key]
          }
        }
      }

      temp_detected.push(item)

      if (argv.output == "pretty"){
        helper.log_to_file_queue(req.body.uuid, item);
      }
      else if (argv.output == ""){
        helper.log_to_file_queue(req.body.uuid, item);
      }
    });

    if (argv.output == "json"){
      console.log(JSON.stringify(temp_detected, null, 2))
    }
  }
};

async function list_all_websites() {
  var temp_arr = []
  await helper.parsed_sites.forEach(item => {
    temp_arr.push(helper.get_site_from_url(item.url))
  });

  console.log('[Listing] Available websites\n' + temp_arr.join('\n'))
}

var server_host = 'localhost';
var server_port = process.env.PORT || 9005;

if (argv.grid != "") {
  helper.grid_url = argv.grid
}
if (argv.docker) {
  server_host = '0.0.0.0'
}
if (argv.cli) {
  if (argv.list) {
    list_all_websites();
  } else if (argv.mode == "fast") {
    if (argv.usernmae != "" && argv.websites != "") {
      check_user_cli(argv)
    }
  }
} else {
  var server = app.listen(server_port, server_host, function() {
    console.log("Server started at http://%s:%s/app.html", server_host, server_port);
  });
}
