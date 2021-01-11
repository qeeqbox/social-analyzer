var helper = require("./helper.js")
var fs = require("fs");
var stringSimilarity = require("string-similarity");

var parsed_names_origins = JSON.parse(fs.readFileSync("names.json"));

async function find_origins(req) {
  var found = []
  for (key in parsed_names_origins) {
    for (name in parsed_names_origins[key]['boy']) {
      if (req.body.string.includes(parsed_names_origins[key]['boy'][name])) {
        found.push({
          "name": parsed_names_origins[key]['boy'][name],
          "origin": key,
          "gender": "boy",
          "matched": parsed_names_origins[key]['boy'][name],
          "similar": ""
        })
      } else {
        var similarity = stringSimilarity.compareTwoStrings(req.body.string, parsed_names_origins[key]['boy'][name]);
        if (similarity > 0.7) {
          found.push({
            "name": req.body.string,
            "origin": key,
            "gender": "boy",
            "matched": "",
            "similar": parsed_names_origins[key]['boy'][name]
          })
        }
      }
    }
    for (name in parsed_names_origins[key]['girl']) {
      if (req.body.string.includes(parsed_names_origins[key]['girl'][name])) {
        found.push({
          "name": parsed_names_origins[key]['girl'][name],
          "origin": key,
          "gender": "girl",
          "matched": parsed_names_origins[key]['girl'][name],
          "similar": ""
        })
      } else {
        var similarity = stringSimilarity.compareTwoStrings(req.body.string, parsed_names_origins[key]['girl'][name]);
        if (similarity > 0.7) {
          found.push({
            "name": req.body.string,
            "origin": key,
            "gender": "girl",
            "matched": "",
            "similar": parsed_names_origins[key]['girl'][name]
          })
        }
      }
    }
    for (name in parsed_names_origins[key]['uni']) {
      if (req.body.string.includes(parsed_names_origins[key]['uni'][name])) {
        found.push({
          "name": parsed_names_origins[key]['uni'][name],
          "origin": key,
          "gender": "uni",
          "matched": parsed_names_origins[key]['uni'][name],
          "similar": ""
        })
      } else {
        var similarity = stringSimilarity.compareTwoStrings(req.body.string, parsed_names_origins[key]['uni'][name]);
        if (similarity > 0.7) {
          found.push({
            "name": req.body.string,
            "origin": key,
            "gender": "uni",
            "matched": "",
            "similar": parsed_names_origins[key]['uni'][name]
          })
        }
      }
    }
  }

  return found
}

module.exports = {
  find_origins
}
