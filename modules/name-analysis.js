var helper = require('./helper.js')
var fs = require("fs");
var stringSimilarity = require("string-similarity");
async function find_origins(req) {
  var found = []
  for (key in helper.parsed_names_origins) {
    for (name in helper.parsed_names_origins[key]['boy']) {
      if (req.body.string.includes(helper.parsed_names_origins[key]['boy'][name])) {
        found.push({
          "name": helper.parsed_names_origins[key]['boy'][name],
          "origin": key,
          "gender": "boy",
          "matched": helper.parsed_names_origins[key]['boy'][name],
          "similar": ""
        })
      } else {
        var similarity = stringSimilarity.compareTwoStrings(req.body.string, helper.parsed_names_origins[key]['boy'][name]);
        if (similarity > 0.7) {
          found.push({
            "name": req.body.string,
            "origin": key,
            "gender": "boy",
            "matched": "",
            "similar": helper.parsed_names_origins[key]['boy'][name]
          })
        }
      }
    }
    for (name in helper.parsed_names_origins[key]['girl']) {
      if (req.body.string.includes(helper.parsed_names_origins[key]['girl'][name])) {
        found.push({
          "name": helper.parsed_names_origins[key]['girl'][name],
          "origin": key,
          "gender": "girl",
          "matched": helper.parsed_names_origins[key]['girl'][name],
          "similar": ""
        })
      } else {
        var similarity = stringSimilarity.compareTwoStrings(req.body.string, helper.parsed_names_origins[key]['girl'][name]);
        if (similarity > 0.7) {
          found.push({
            "name": req.body.string,
            "origin": key,
            "gender": "girl",
            "matched": "",
            "similar": helper.parsed_names_origins[key]['girl'][name]
          })
        }
      }
    }
    for (name in helper.parsed_names_origins[key]['uni']) {
      if (req.body.string.includes(helper.parsed_names_origins[key]['uni'][name])) {
        found.push({
          "name": helper.parsed_names_origins[key]['uni'][name],
          "origin": key,
          "gender": "uni",
          "matched": helper.parsed_names_origins[key]['uni'][name],
          "similar": ""
        })
      } else {
        var similarity = stringSimilarity.compareTwoStrings(req.body.string, helper.parsed_names_origins[key]['uni'][name]);
        if (similarity > 0.7) {
          found.push({
            "name": req.body.string,
            "origin": key,
            "gender": "uni",
            "matched": "",
            "similar": helper.parsed_names_origins[key]['uni'][name]
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
