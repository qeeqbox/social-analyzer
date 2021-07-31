const ixora = require('ixora').QBIxora
const helper = require('./helper.js')

async function visualize_force_graph (req, detected, type) {
  try {
    const graph = new ixora('Social-Analyzer', false)
    const temp_filtered = detected.filter(item => item.status === 'good')
    if (temp_filtered.length > 0) {
      if (req.body.group) {
        graph.add_node(req.body.string, req.body.string, {
          header: req.body.string
        })

        req.body.string.split(',').forEach(username => {
          graph.add_node(username, username, {
            header: username
          })

          graph.add_edge(username, req.body.string, {
            width: 1
          })
        })
      } else {
        graph.add_node(req.body.string, req.body.string, {
          header: req.body.string
        })
      }

      temp_filtered.forEach(site => {
        graph.add_node(site.link, site.link, {
          header: site.link
        })

        graph.add_edge(site.username, site.link, {
          width: 1
        })

        if ('metadata' in site) {
          if (site.metadata !== 'unavailable' && site.metadata.length > 0) {
            site.metadata.forEach(meta => {
              if ('content' in meta) {
                let temp_string = ''
                if ('name' in meta) {
                  temp_string = meta.name + ' -> ' + meta.content
                } else if ('itemprop' in meta) {
                  temp_string = meta.itemprop + ' -> ' + meta.content
                } else if ('property' in meta) {
                  temp_string = meta.property + ' -> ' + meta.content
                }

                if (temp_string.length > 70) {
                  temp_string = temp_string.substring(0, 70).replace(/\r?\n|\r/g, '') + '..'
                } else {
                  temp_string = temp_string.replace(/\r?\n|\r/g, '')
                }

                if (temp_string !== '' && temp_string.length > 0) {
                  graph.add_node(temp_string, temp_string, {
                    header: temp_string
                  })

                  graph.add_edge(site.link, temp_string, {
                    width: 1
                  })
                }
              }
            })
          }
        }
      })
    }

    const ret_graph = graph.create_graph('#ixora-graph', 'Ixora random nodes exmaple', 'Search Box', 'Search in extracted patterns', 'https://github.com/qeeqbox/ixora', 'Qeeqbox-ixora', ['search', 'tooltip'], 10, 100, graph.graph, 'object', undefined, undefined)
    return ret_graph
  } catch (err) {
    helper.verbose && console.log(err)
  }

  return {
    graph: {
      nodes: [],
      links: []
    }
  }
}
module.exports = {
  visualize_force_graph
}
