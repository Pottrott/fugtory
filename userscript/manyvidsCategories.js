const getYamlResource = id => {
  return jsyaml.load(GM_getResourceText(id))
  }

  let favorites

const addStyle = css => {
  const element = document.createElement("style");
  element.setAttribute("type", "text/css");
  const node = document.createTextNode(css)
  element.appendChild(node);
  document.body.appendChild(element);
}

const processProfilePage = () => {
addStyle(`
#favoriteCategories {
display: flex;
flex-wrap: wrap;
}

#favoriteCategories>a {
margin: 1px;
padding-top: 3px;
padding-bottom: 3px;
padding-left: 9px;
padding-right: 9px;
background: #8d79ff;
color: white;
border-radius: 2px;
font-size: 80%;
z-index: 100;
cursor: pointer;
}
`)
  const vidsButton = document.querySelector(".mv-submenu")
  vidsButton.insertAdjacentHTML("beforeBegin", "<div id=favoriteCategories />")
  const container = document.querySelector("#favoriteCategories")

  const categoryElements = Array.from(document.querySelectorAll("div.drop-down-list .filter-panel__item"))
  const categories = []
  for (const categoryElement of categoryElements) {
  const elementText = categoryElement.textContent
  const regexResult = /(?<name>.*?)\((?<count>[0-9]+)\)/.exec(elementText)
  if (!regexResult) {
  continue
  }
  if (!favorites.includes(regexResult.groups.name.toLowerCase())) {
   continue
  }
  categories.push({
    categoryElement,
    name: regexResult.groups.name,
    count: Number(regexResult.groups.count)
  })
}
const categoriesSorted = _.orderBy(categories, ["count", "name"], "desc")
for (const category of categoriesSorted) {
  if (category.count > 1)
  category.name = category.name + " (" + category.count + ")"
  const button = document.createElement("a")
  button.innerText = category.name
  button.addEventListener("click", () => {
  category.categoryElement.click()
  })
  container.appendChild(button)
}
}

const processCategoriesPage = () => {
  addStyle(`
.favoriteCategory > a {
opacity: 0.3;
}
.lowCount {
  display: none;
}
`)

  const elements = Array.from(document.querySelectorAll(".category-submenu .mb-1"))
  for (const categoryElement of elements) {
    const elementText = categoryElement.textContent
    const regexResult = /(?<name>.*?) ?\((?<count>[0-9]+)\)/.exec(elementText)
    if (!regexResult) {
      continue
      }
      if (!favorites.includes(regexResult.groups.name.toLowerCase())) {
        if (regexResult.groups.count < 50) {
          categoryElement.classList.add("lowCount")
        }
       continue
      }
      console.dir(regexResult)
      categoryElement.classList.add("favoriteCategory")
  }
}

window.main = () => {
  favorites = getYamlResource("manyvidsCategories")
if (window.location.pathname.startsWith("/Accepted-Categories")) {
  return processCategoriesPage()
}
processProfilePage()
}