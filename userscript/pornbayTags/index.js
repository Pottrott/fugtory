const removeSnatched = () => {
  GM_addStyle(`
  .torrent:has(a:visited) {
    display: none;
  }
  .torrent:has(.icon_disk_grabbed, .icon_disk_snatched, .icon_disk_leech, .icon_warning) {
    display: none;
  }
  `)
}

window.main = () => {
  document.querySelector("#filter_slidetoggle").insertAdjacentHTML("afterEnd", "<div id=pottrott><div id=searchPresets></div><div id=foundTags></div></div>")

  const compilation = true
  const puke = true
  const highQuality = "graceful"
  const allow720p = false
  const images = true
  const vr = false
  const audio = false

  let base = "!censored"

  if (window.location.host === "pornbay.org") {
    base += " & !invalid.tag"
  }

  if (!audio) {
    base += " & !audio"
  }

  if (!vr) {
    base += " & !vr & !vr.porn & !virtual.reality"
  }

  if (highQuality === "strict") {
    base += " & (1080p | 1440p | 2160p | 2880p | 4320p | full.hd | 4k | 8k"
    if (allow720p)  {
      base += " | 720p"
    }
    base += ")"
  } else if (highQuality === "graceful") {
    base += " & !sd & !144p & !240p & !320p & !480p & !540p"
    if (!allow720p) {
      base += " & !720p"
    }
  }

  if (!puke) {
    base += " & !puke & !vomit"
  }

  if (!compilation) {
    base += " & !megapack & !compilation & !siterip"
  }

  if (!images) {
    base += " & !images"
  }

  const usedTagsRegex = /[^!](?<tag>[^\s&()|]+)/gm

  const getYamlResource = id => {
    return jsyaml.load(GM_getResourceText(id))
  }

  const segments = getYamlResource("searchSnippets")
  segments.defaultFilters = base

  const resolveQuery = query => {
    return Handlebars.compile(query)({
      ...segments,
    })
  }

  const resolveQueryRecursive = query => {
    let result = query
    while (result.includes("{{{")) {
      result = resolveQuery(result)
    }
    return result
  }

  const searchPresets = getYamlResource("searchPresets")

  const urlParams = Object.fromEntries(new URLSearchParams(window.location.search))
  if (urlParams.preset) {
    const needle = urlParams.preset.replaceAll(" ", "").toLowerCase()
    console.log("Searching preset " + needle)
    for (const searchPreset of searchPresets) {
      if (searchPreset.name.replaceAll(" ", "").toLowerCase() === needle) {
        const rawUrl = new URL(`https://${location.host}/torrents.php`)
        rawUrl.searchParams.append("taglist", resolveQueryRecursive(searchPreset.query))
        rawUrl.searchParams.append("action", "advanced")
        rawUrl.searchParams.append("order_by", "time")
        rawUrl.searchParams.append("order_way", "desc")
        window.location = rawUrl.toString()
        return
      }
    }
  }

  const tagInput = document.querySelector("form[name=filter]").querySelector("textarea")
  if (!tagInput)
  return
  tagInput.addEventListener("keyup", event => { // Doesn't work for some reason
    console.dir(event)
    if (event.keyCode === 13) {
      event.preventDefault()
      event.target.form.submit()
    }
  })

  const addSuggestion = searchPreset => {
    const rawQuery = resolveQueryRecursive(searchPreset.query)
    const queryWithDefaults = resolveQueryRecursive(`${searchPreset.query} & {{{defaultFilters}}}`)
    const rawUrl = new URL(`https://${location.host}/torrents.php`)
    rawUrl.searchParams.append("taglist", rawQuery)
    rawUrl.searchParams.append("action", "advanced")
    rawUrl.searchParams.append("order_by", "time")
    rawUrl.searchParams.append("order_way", "desc")
    const rawHref = rawUrl.href
    // rawUrl.searchParams.set("taglist", queryWithDefaults)
    // const defaultsHref = rawUrl.href
    // const tagSection = document.querySelector("#cat_list ~table tr:last-child > td:last-child")
    let link = ""
    if (searchPreset.link) {
      link = `<a href=${searchPreset.link}>????</a> `
    }
    document.querySelector("#searchPresets").insertAdjacentHTML("beforeend", `<div>${link}<a title='${rawQuery}' href=${rawHref}>${searchPreset.name}</a></div>`)
  }

  const searchPresetsSorted = _.sortBy(searchPresets, "name")
  searchPresetsSorted.unshift({
    name: "Current",
    query: tagInput.value,
  })

  for (const searchPreset of searchPresetsSorted) {
    if (searchPreset.name.toLowerCase() !== "current")
    addSuggestion(searchPreset)
    addSuggestion({
      name: searchPreset.name + " (filtered)",
      query: `${searchPreset.query} & {{{defaultFilters}}}`
    })
  }

  const foundTags = {}
  const tagElements = [...document.querySelectorAll(".torrent .tags > a")]
  for (const tagElement of tagElements) {
    const tagName = tagElement.innerText
    if (foundTags[tagName]) {
      foundTags[tagName]++
    } else {
      foundTags[tagName] = 1
    }
  }

  const foundTagsSorted = Object.entries(foundTags).sort(([, a], [, b]) => b - a)

  for (const foundTag of foundTagsSorted) {
    const tagLink = `https://femdomcult.org/torrents.php?action=advanced&taglist=${foundTag[0]}`
    if (foundTag[1] > 1) {
      document.querySelector("#foundTags").insertAdjacentHTML("beforeEnd", `<div><a href='${tagLink}'>${foundTag[0]}</a> ??? ${foundTag[1]}x</div>`)
    }
    //   else
    // document.querySelector("#foundTags").insertAdjacentHTML("beforeEnd", `<div><a href='${tagLink}'>${foundTag[0]}</a></div>`)


  }

  const css = `
#searchPresets {
margin-bottom: 12px;
}

#foundTags, #searchPresets {
display: flex;
flex-wrap: wrap;
font-size: 12px;
}

#foundTags>div, #searchPresets>div {
margin: 1px;
padding-top: 3px;
  padding-bottom: 3px;
padding-left: 9px;
padding-right: 9px;
background: black;
color: #cccccc;
}

#foundTags a {
background: black;
color: #a4a4ff;
}
`

  GM_addStyle(css)

  removeSnatched()

}