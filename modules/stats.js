var helper = require('./helper.js');

async function get_stats(data) {
  var temp_found = {
    "good": {},
    "maybe": {},
    "bad": {},
    "all": {}
  }
  var found = {
    "good": [],
    "maybe": [],
    "bad": [],
    "all": []
  }
  try {
    await data.forEach(async function(site, index) {
      if (site.status == "good") {
        temp_found["good"][site.type] = (temp_found["good"][site.type] || 0) + 1
      } else if (site.status == "maybe") {
        temp_found["maybe"][site.type] = (temp_found["maybe"][site.type] || 0) + 1
      } else {
        temp_found["bad"][site.type] = (temp_found["bad"][site.type] || 0) + 1
      }
      temp_found["all"][site.type] = (temp_found["all"][site.type] || 0) + 1
    });

    await ["good", "maybe", "bad", "all"].forEach(async function(item, index) {
      const sum = Object.values(temp_found[item]).reduce((a, b) => a + b, 0);
      await Object.keys(temp_found[item]).forEach(async function(key) {
        found[item].push([key, ((temp_found[item][key] / sum) * 100).toFixed(2)])
      });
    });

    await ["good", "maybe", "bad", "all"].forEach(async function(item, index) {
      found[item].sort(function compare(a, b) {
        return b[1] - a[1]
      })
    });

  } catch (error) {
    helper.verbose && console.log(error);
  }

  return found
}

module.exports = {
  get_stats
}
