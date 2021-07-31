const helper = require('./helper.js')
const cheerio = require('cheerio')
const strings_meta = new RegExp('regionsAllowed|width|height|color|rgba\\(|charset|viewport|refresh|equiv', 'i')
async function extract_metadata (site, source) {
  try {
    const $ = cheerio.load(source)
    const meta = $('meta')
    const temp_metadata_list = []
    const temp_metadata_for_checking = []
    Object.keys(meta).forEach(function (key) {
      if (meta[key].attribs) {
        if (!temp_metadata_for_checking.includes(meta[key].attribs) && !strings_meta.test(JSON.stringify(meta[key].attribs))) {
          temp_metadata_for_checking.push(meta[key].attribs)
          const temp_dict = {}
          let add = true

          if (meta[key].attribs.property) {
            temp_dict.property = meta[key].attribs.property
          }
          if (meta[key].attribs.name) {
            temp_dict.name = meta[key].attribs.name
          }
          if (meta[key].attribs.itemprop) {
            temp_dict.itemprop = meta[key].attribs.itemprop
          }
          if (meta[key].attribs.content) {
            if (meta[key].attribs.content.replace('\n', '').replace('\t', '').replace('\r', '').trim() !== '') {
              temp_dict.content = meta[key].attribs.content
            }
          }

          ['property', 'name', 'itemprop'].forEach((item, i) => {
            if (temp_dict[item]) {
              temp_metadata_list.forEach((_item, i) => {
                if (_item[item]) {
                  if (_item[item] === temp_dict[item]) {
                    temp_metadata_list[i].content += ', ' + temp_dict.content
                    add = false
                  }
                }
              })
            }
          })

          if (add && Object.keys(temp_dict).length !== 0) {
            temp_metadata_list.push(temp_dict)
          }
        }
      }
    })
    return temp_metadata_list
  } catch (err) {
    helper.verbose && console.log(err)
    return []
  }
}

async function extract_patterns (site, source) {
  try {
    const temp_patterns_list = []
    const temp_patterns_for_checking = []
    if ('extract' in site) {
      site.extract.forEach((item, i) => {
        const regex_pattern = new RegExp(item.regex, 'g')
        let found = null
        while (found = regex_pattern.exec(source)) {
          if (!temp_patterns_for_checking.includes(found[1])) {
            temp_patterns_for_checking.push(found[1])
            if (item.type === 'link') {
              found[1] = decodeURIComponent(found[1])
            }
            temp_patterns_list.push({
              type: item.type,
              matched: found[1]
            })
          }
        }
      })
    }
    return temp_patterns_list
  } catch (err) {
    helper.verbose && console.log(err)
    return []
  }
}

module.exports = {
  extract_patterns,
  extract_metadata
}
