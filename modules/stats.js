const helper = require('./helper.js')

function group_by_value (list, key) {
  return list.reduce(function (x, y) {
    (x[y[key]] = x[y[key]] || []).push(y)
    return x
  }, {})
};

async function get_stats_by_value (data, value) {
  const temp_array = {}
  try {
    const grouped = group_by_value(data, value)
    const temp_found = {
      good: 0,
      maybe: 0,
      bad: 0,
      all: 0
    }
    await Object.keys(grouped).forEach(async function (key) {
      await ['good', 'maybe', 'bad', 'all'].forEach(async function (item, index) {
        if (Object.keys(grouped[key]).length > 0) {
          const len = grouped[key].filter((_item) => _item.status === item).length
          if (len > 0) {
            temp_found[item] += len
            if (item in temp_array) {
              temp_array[item].push([key, len])
            } else {
              temp_array[item] = [
                [key, len]
              ]
            }
          }
        }
      })
    })

    await Object.keys(temp_array).forEach(async function (key) {
      await temp_array[key].forEach(async function (item, index) {
        temp_array[key][index][1] = ((temp_array[key][index][1] / temp_found[key]) * 100).toFixed(2)
      })
    })
  } catch (error) {
    helper.verbose && console.log(error)
  }
  return temp_array
}

async function get_metadata(data, type){
  const temp_array = []
  try {
    const temp_filtered = data.filter(item => item.status === type)
    await temp_filtered.forEach(site => {
      if ('metadata' in site) {
        if (site.metadata !== 'unavailable' && site.metadata.length > 0) {
          site.metadata.forEach(meta => {
            if ('content' in meta) {
              let temp_content = ''
              if ('name' in meta) {
                temp_content = meta.content
              } else if ('itemprop' in meta) {
                temp_content = meta.content
              } else if ('property' in meta) {
                temp_content = meta.content
              }

              if (temp_content != ''){
                const entry = temp_array.find( x => x[1] === temp_content);
                if (entry) {
                    ++entry[0];
                } else {
                    temp_array.push([1,temp_content]);
                }
              }
            }
          })
        }
      }
    })
  }
  catch(error){
    helper.verbose && console.log(error)
  }

  if (temp_array.length >0) {
    temp_array.sort(function(a,b) {return b[0]-a[0]})
  }

  return temp_array
}

async function get_stats (req, data) {
  let categories = {}
  let countries = {}
  let metadata = []
  try {
    if (req.body.option.includes('CategoriesStats')) {
      categories = await get_stats_by_value(data, 'type')
      countries = await get_stats_by_value(data, 'country')
    }
    if (req.body.option.includes('ExtractMetadata') && req.body.option.includes('MetadataStats')){
      metadata = await get_metadata(data, 'good')
    }
  } catch (error) {
    helper.verbose && console.log(error)
  }

  return { categories: categories, countries: countries, metadata: metadata}
}

module.exports = {
  get_stats
}
