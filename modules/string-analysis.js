var helper = require('./helper.js')
var {
  findWord
} = require("most-common-words-by-language");
var fs = require("fs");

var WordsNinjaPack = require("wordsninja");
var WordsNinja = new WordsNinjaPack();

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

async function analyze_string(req, all_words) {
  helper.log_to_file_queue(req.body.uuid, "[Starting] String analysis")
  temp_rr_names = []
  string_to_check = req.body.string
  helper.parsed_json.prefix.forEach(function(item, index) {
    if (string_to_check.indexOf(item) == 0 && !all_words.prefix.includes(item)) {
      all_words.prefix.push(item);
      temp = remove_word(string_to_check, item);
      if (temp !== null && temp !== "" && !all_words.unknown.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
        all_words.unknown.push(temp);
      }
    }
  });
  helper.parsed_json.m_names.forEach(function(item, index) {
    if (string_to_check.indexOf(item) >= 0 && !all_words.name.includes(item)) {
      all_words.name.push(item);
      temp = remove_word(string_to_check, item);
      if (temp !== null && temp !== "" && !all_words.unknown.includes(temp) && !all_words.maybe.includes(temp) && temp.length > 1) {
        all_words.unknown.push(temp);
      }
    }
  });
  helper.parsed_json.f_names.forEach(function(item, index) {
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
  helper.log_to_file_queue(req.body.uuid, "[Done] String analysis")
}

async function split_upper_case(req, all_words) {
  try {
    req.body.string.match(/[A-Z][a-z]+/g).forEach((item) => {
      if (item.length > 1 && !all_words.unknown.includes(item) && !all_words.maybe.includes(item)) {
        all_words.unknown.push(item.toLowerCase());
      }
    });
  } catch (err) {}
}

async function split_alphabet_case(req, all_words) {
  try {
    req.body.string.match(/[A-Za-z]+/g).forEach((item) => {
      if (item.length > 1 && !all_words.unknown.includes(item) && !all_words.maybe.includes(item)) {
        all_words.unknown.push(item.toLowerCase());
      }
    });
  } catch (err) {}
}

async function find_symbols(req, all_words) {
  try {
    req.body.string.match(/[ \[\]:"\\|,.<>\/?~`!@#$%^&*()_+\-={};']/gi).forEach((item) => {
      if (item !== " " && !all_words.symbol.includes(item)) {
        all_words.symbol.push(item);
      }
    });
  } catch (err) {}
}

async function find_numbers(req, all_words) {
  try {
    req.body.string.match(/(\d+)/g).forEach((item) => {
      if (!all_words.number.includes(item)) {
        all_words.number.push(item);
      }
    });
  } catch (err) {}
}

async function convert_numbers(req) {
  try {
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
      temp_value += _temp != undefined
        ? numbers_to_letters[req.body.string.charAt(i)]
        : req.body.string.charAt(i);
    }
    req.body.string = temp_value
  } catch (err) {}
}

async function get_maybe_words(req, all_words) {
  await WordsNinja.loadDictionary();
  all_words.maybe = await WordsNinja.splitSentence(req.body.string).filter(function(elem, index, self) {
    return index === self.indexOf(elem);
  }).filter(word => word.length > 1);
}

module.exports = {
  get_maybe_words,
  find_symbols,
  find_numbers,
  convert_numbers,
  split_upper_case,
  split_alphabet_case,
  most_common,
  find_other,
  analyze_string
}
