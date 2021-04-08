var helper = require('./helper.js');

async function visualize_force_graph(username, detected, type) {
  graph = {
    "nodes": [],
    "links": []
  }

  try {
    filter_items = "good"
    temp_filtered = []
    temp_filtered = detected.filter(item => filter_items.includes(item.status))
    if (temp_filtered.length > 0) {
      graph.nodes.push({
        "id": username
      })
      temp_filtered.forEach(site => {
        graph.nodes.push({
          "id": site.link
        })
        graph.links.push({
          "source": username,
          "target": site.link
        })
        if ("metadata" in site){
          if (site.metadata.length > 0) {
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
                  var index = undefined;
                  graph.nodes.some(function(item, i) {
                    if (item.id == temp_string) {
                      index = i;
                      return true;
                    }
                  });

                  if (index != undefined) {

                  } else {
                    graph.nodes.push({
                      "id": temp_string
                    })
                  }

                  if (graph.links.some(v => v.source == temp_string && v.target == site.link) || graph.links.some(v => v.source == site.link && v.target == temp_string)) {

                  } else {
                    graph.links.push({
                      "source": site.link,
                      "target": temp_string
                    })
                  }
                }
              }
            })
          }
        }
      });
    }
  } catch {

  }

  return graph
}

module.exports = {
  visualize_force_graph
}
