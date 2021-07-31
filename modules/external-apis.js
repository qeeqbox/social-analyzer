const helper = require('./helper.js')
const async = require('async')

async function get_words_info (all_words, words_info) {
  const temp_added = []
  for (const all_words_key of Object.keys(all_words)) {
    for (const all_words_word of all_words[all_words_key]) {
      if (!temp_added.includes(all_words_word)) {
        temp_added.push(all_words_word)
        const temp_words_info = {
          word: all_words_word,
          text: '',
          results: []
        }
        try {
          const url1 = 'https://api.duckduckgo.com/?q={0}&format=json&pretty=1&no_html=1&skip_disambig=1'.replace('{0}', all_words_word)
          const url2 = 'https://api.duckduckgo.com/?q={0}&format=json&pretty=1'.replace('{0}', all_words_word)
          const response1 = await helper.get_url_wrapper_json(url1)
          const response2 = await helper.get_url_wrapper_json(url2)
          if (response2.data !== '') {
            if ('RelatedTopics' in response2.data) {
              if (response2.data.RelatedTopics.length > 0) {
                if (response2.data !== '') {
                  if ('AbstractText' in response1.data && response1.data.AbstractText !== '') {
                    temp_words_info.text = response1.data.AbstractText
                  } else if ('Abstract' in response1.data && response1.data.AbstractText !== '') {
                    temp_words_info.text = response1.data.Abstract
                  } else {
                    temp_words_info.text = 'unknown'
                  }
                }
                response2.data.RelatedTopics.forEach(function (item) {
                  if ('Name' in item) {
                    item.Topics.forEach(function (topic) {
                      temp_words_info.results.push({
                        type: item.Name,
                        text: topic.Text,
                        url: topic.FirstURL
                      })
                    })
                  } else {
                    temp_words_info.results.push({
                      type: 'Related',
                      text: item.Text,
                      url: item.FirstURL
                    })
                  }
                })
              }
            }
          }

          if (temp_words_info.results.length > 0) {
            words_info.push(temp_words_info)
          }
        } catch (error) {
          helper.verbose && console.log(error)
        }
      }
    }
  }
}

async function check_engines (req, info) {
  try {
    if (helper.google_api_key === '' || helper.google_api_cs === '') {
      return
    }
    const url = 'https://www.googleapis.com/customsearch/v1?key={0}&cx={1}&q={2}'.replace('{0}', helper.google_api_key).replace('{1}', helper.google_api_cs).replace('{2}', req.body.string)
    const response = await helper.get_url_wrapper_json(url)
    if (response.data !== '') {
      try {
        info.original = response.data.queries.request[0].searchTerms
      } catch (e) {}
      try {
        info.corrected = response.data.spelling.correctedQuery
      } catch (e) {}
      try {
        info.total = response.data.searchInformation.totalResults
      } catch (e) {}
      try {
        response.data.items.forEach(function (item) {
          info.items.push({
            title: item.title,
            snippet: item.snippet
          })
        })
      } catch (e) {}
      try {
        if (info.total === 0 && info.corrected !== '') {
          info.checking = info.original + ' [Error]<br>Try this: ' + info.corrected
        } else if (info.total > 0 && info.corrected !== '') {
          info.checking = info.original + ' [Good]<br>Suggested word: ' + info.corrected + '<br>Total lookups: ' + info.total
        } else if (info.total > 0 && info.corrected === '') {
          info.checking = info.original + ' [Good]<br>Total lookups: ' + info.total
        } else {
          info.checking = 'Using ' + info.original + ' with no lookups'
        }
      } catch (e) {}
    }
  } catch (error) {
    helper.verbose && console.log(error)
  }
}

async function custom_search_ouputs (req) {
  const possible_parameters = ['user', 'profile', 'account']
  const time = new Date()
  const functions = []
  possible_parameters.forEach((key) => {
    functions.push(custom_search_ouputs_website.bind(null, req.body.uuid, req.body.string, key))
  })
  const results = await async.parallelLimit(functions, 6)
  helper.verbose && console.log(`Total time ${new Date() - time}`)
  const merged = [].concat.apply([], results.filter(item => item !== undefined))
  return merged
}

async function custom_search_ouputs_website (uuid, name, key) {
  return new Promise(async (resolve, reject) => {
    try {
      const results = []
      helper.log_to_file_queue(uuid, '[Custom Search Using] ' + key)
      const url = 'https://www.googleapis.com/customsearch/v1?key={0}&cx={1}&q={2}:{3}'.replace('{0}', helper.google_api_key).replace('{1}', helper.google_api_cs).replace('{2}', key).replace('{3}', name)
      const response = await helper.get_url_wrapper_json(url)
      if (response.data !== '') {
        if ('items' in response.data) {
          response.data.items.forEach((key) => {
            results.push({
              site: helper.get_site_from_url(key.link),
              link: key.link,
              snippet: key.snippet
            })
          })
        }
      }
      if (results.length > 0) {
        resolve(results)
      } else {
        resolve(undefined)
      }
    } catch (err) {
      resolve(undefined)
    }
  })
}

module.exports = {
  check_engines,
  get_words_info,
  custom_search_ouputs
}
