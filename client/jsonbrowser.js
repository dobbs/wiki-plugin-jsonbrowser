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
      case 'PRETTY-SELECT':
        obj.pretty = true
      case 'SELECT':
        const keys = rest
        obj.selectFn = items => items.map(_.partial(_.pick, _, ...keys))
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

    $item.attr('style', 'background-color:#eee;padding:15px;margin:15px 0')
    const plainRender = () =>
          $item.append(`
        <p style="margin:0;">
          ${expand(item.text)}
        </p>
        <pre style="margin:0;overflow:auto;"></pre>`)

    const plainInsertJson = _.once(json => $item.find('pre')
                              .html(expand(JSON.stringify(json, null, 2))))

    const prettyRender = () => $item

    const prettyInsertJson = _.once(json => {
      json.forEach(obj => {
        // this code assumes keys are ordered
        Object.keys(obj)
          .forEach(key => $item.append(
            `<p style="margin:0;">${obj[key]}</p>`))
      })
    })

    let render, insertJson
    if (obj.pretty)
      [render, insertJson] = [prettyRender, prettyInsertJson]
    else
      [render, insertJson] = [plainRender, plainInsertJson]

    render()

    if (obj.source) {
      $item.addClass('jsonsource')
      el.jsonsource = async () => {
        if (obj.json)
          return obj.json
        obj.json = await loadJson(obj.source)
        return obj.json
      }
      el.jsonsource() // start loading
      return $item
    }

    if (!obj.selectFn)
      obj.selectFn = xs => xs

    if (obj.filters) {
      $item.addClass('jsonfilter')

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

      // TODO: allow SELECT without FILTER
      el.jsonsource().then(json => insertJson(obj.selectFn(json)))
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
