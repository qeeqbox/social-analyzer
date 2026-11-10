import helper from './helper.js'

function group_by_value(list, key) {
  return list.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item)
    return acc
  }, {})
}

async function get_stats_by_value(data, value) {
  const temp_array = {}
  try {
    const grouped = group_by_value(data, value)
    const temp_found = {
      good: 0,
      maybe: 0,
      bad: 0,
      all: 0
    }

    for (const key of Object.keys(grouped)) {
      ['good', 'maybe', 'bad', 'all'].forEach(item => {
        if (grouped[key].length > 0) {
          const len = grouped[key].filter(_item => _item.status === item).length
          if (len > 0) {
            temp_found[item] += len
            if (item in temp_array) {
              temp_array[item].push([key, len])
            } else {
              temp_array[item] = [[key, len]]
            }
          }
        }
      })
    }

    for (const key of Object.keys(temp_array)) {
      temp_array[key] = temp_array[key].map(([k, count]) => [k, ((count / temp_found[key]) * 100).toFixed(2)])
    }
  } catch (error) {
    helper.verbose && console.log(error)
  }

  return temp_array
}

async function get_metadata(data, type) {
  const temp_array = []
  try {
    const temp_filtered = data.filter(item => item.status === type)
    for (const site of temp_filtered) {
      if (site.metadata && site.metadata !== 'unavailable' && site.metadata.length > 0) {
        for (const meta of site.metadata) {
          if ('content' in meta) {
            let temp_content = meta.content || ''
            if (temp_content) {
              const entry = temp_array.find(x => x[1] === temp_content)
              if (entry) {
                ++entry[0]
              } else {
                temp_array.push([1, temp_content])
              }
            }
          }
        }
      }
    }
  } catch (error) {
    helper.verbose && console.log(error)
  }

  return temp_array.length > 0 ? temp_array.sort((a, b) => b[0] - a[0]) : temp_array
}

async function get_stats(req, data) {
  let categories = {}
  let countries = {}
  let metadata = []

  try {
    if (req.body.option.includes('CategoriesStats')) {
      categories = await get_stats_by_value(data, 'type')
      countries = await get_stats_by_value(data, 'country')
    }

    if (req.body.option.includes('ExtractMetadata') && req.body.option.includes('MetadataStats')) {
      metadata = await get_metadata(data, 'good')
    }
  } catch (error) {
    helper.verbose && console.log(error)
  }

  return { categories, countries, metadata }
}

export default {
  get_stats
}
