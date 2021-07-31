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

async function get_stats (data) {
  let categories = {}
  let countries = {}
  try {
    categories = await get_stats_by_value(data, 'type')
    countries = await get_stats_by_value(data, 'country')
  } catch (error) {
    helper.verbose && console.log(error)
  }

  return { categories: categories, countries: countries }
}

module.exports = {
  get_stats
}
