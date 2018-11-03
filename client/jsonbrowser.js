(function() {
  "use strict"
  var bind, emit, expand;

  const parse = (item) => {
    let obj = {}
    item.text.split("\n").forEach(line => {
      const [keyword, ...rest] = line.split(/\s+/)
      switch(keyword) {
      case 'SOURCE':
        obj.source = rest[0]
        break
      case 'FILTER':
        const [key, comparison, value] = rest
        if (! obj.filters)
          obj.filters = []
        obj.filters.push(obj => {
          // all comparisons are treated as equals for now
          return obj[key] === value
        })
        break
      }
    })
    return obj
  }

  const loadJson = async url => (await (await fetch(url)).json())

  const $jsonsources = $item =>
        $(`.item:lt(${$('.item').index($item)})`)
        .filter('.jsonsource')

  expand = text => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  };

  emit = async ($item, item) => {
    const el = $item.get(0)
    let obj = parse(item)

    $item.append(`
      <p style="background-color:#eee;padding:15px;">
        ${expand(item.text)}
      </p>`)

    if (obj.source) {
      $item.addClass('jsonsource')
      el.jsonsource = async () => {
        if (obj.json)
          return obj.json
        obj.json = await loadJson(obj.source)
        $item.trigger('loaded')
        return obj.json
      }
      setTimeout(el.jsonsource, 500)
      return $item
    }

    if (obj.filters) {
      $item.addClass('jsonfilter')

      const appendJson = _.once((json) => {
        $item.find('p').css({'margin-bottom': 0})
        $item.append(`
            <pre style="background-color:#eee;margin-top: 0;padding:0 15px; overflow: scroll;">
${expand(JSON.stringify(json, null, 2))}
            </pre>`)
      })

      el.jsonfilters = () => obj.filters
      el.jsonsource = async () => {
        const sourceEl = $jsonsources($item).get(0)
        if (sourceEl) {
          const json = await sourceEl.jsonsource()
          return json.filter(it => el.jsonfilters().every(fn => fn(it)))
        } else {
          console.log({error: `jsonbrowser FILTER item must have a preceding SOURCE item`})
          return []
        }
      }
      $jsonsources($item)
        .on('loaded', async () => appendJson(await el.jsonsource()))

    }

    return $item
  };

  bind = function($item, item) {
    return $item.dblclick(() => {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.jsonbrowser = {emit, bind};
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);
