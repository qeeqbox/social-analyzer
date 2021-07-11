var ixora = require('ixora').QBIxora
var helper = require('./helper.js');

async function visualize_force_graph(username, detected, type) {
  try {
    var graph = new ixora('Social-Analyzer', false);
    filter_items = "good"
    temp_filtered = []
    temp_filtered = detected.filter(item => filter_items.includes(item.status))
    if (temp_filtered.length > 0) {

      graph.add_node(username, search = username, _set = {
        'header': username
      })

      temp_filtered.forEach(site => {

        graph.add_node(site.link, search = site.link, _set = {
          'header': site.link
        })

        graph.add_edge(username, site.link, {
          'width': 1
        })
        if ("metadata" in site) {
          if (site.metadata != "unavailable" && site.metadata.length > 0) {
            site.metadata.forEach(meta => {
              if ("content" in meta) {
                temp_string = ""
                if ("name" in meta) {
                  temp_string = meta.name + " -> " + meta.content
                } else if ("itemprop" in meta) {
                  temp_string = meta.itemprop + " -> " + meta.content
                } else if ("property" in meta) {
                  temp_string = meta.property + " -> " + meta.content
                }

                if (temp_string.length > 50) {
                  temp_string = temp_string.substring(0, 50).replace(/\r?\n|\r/g, "") + ".."
                } else {
                  temp_string = temp_string.replace(/\r?\n|\r/g, "")
                }

                if (temp_string != "" && temp_string.length > 0) {
                  graph.add_node(temp_string, search = temp_string, _set = {
                    'header': temp_string,
                  })

                  graph.add_edge(site.link, temp_string, {
                    'width': 1
                  })
                }
              }
            })
          }
        }
      });
    }

    x = graph.create_graph("#ixora-graph", window_title = "Ixora random nodes exmaple", search_title = "Search Box", search_msg = "Search in extracted patterns", copyright_msg = "https://github.com/qeeqbox/ixora", copyright_link = "Qeeqbox-ixora", tools = ['search', 'tooltip'], collide = 10, distance = 100, data = graph.graph, method = 'object', save_to = undefined, open_file = undefined)
    return x
  } catch (err) {
    helper.verbose && console.log(err)
  }

  return {
    "graph": {
      "nodes": [],
      "links": []
    }
  }

}
module.exports = {
  visualize_force_graph
}
