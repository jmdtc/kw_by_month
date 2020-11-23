// SET UP THE PAGE AND ENABLING OR DISABLING INPUTS
const select = document.getElementById('select')
const select2 = document.getElementById('select2')

fetch("https://sql-dashboard.glitch.me/urls")
  .then(res => res.json())
  .then(urls => {
    for (const url of urls) {
      select.options.add(new Option(url, url))
      select2.options.add(new Option(url, url))
    }
  })

document.getElementById('branded-terms').disabled = true
document.getElementById('check').addEventListener('change', () => {
  const brandInput = document.getElementById('branded-terms')
  document.getElementById('check').checked ? brandInput.disabled = false : brandInput.disabled = true
})

document.getElementById('select2').disabled = true
document.getElementById('second-url').addEventListener('change', () => {
  const secondUrlSelect = document.getElementById('select2')
  document.getElementById('second-url').checked ? secondUrlSelect.disabled = false : secondUrlSelect.disabled = true
})

// FILTERING FUNCTIONS
const fetching = async () => {
  const url = document.getElementById('select').value
  if (!url.includes("BIG")) {
    const d = fetch('https://sql-dashboard.glitch.me/' + url)
      .then(res => res.json())
      .then(data => {
        return data
      })
    return d
  }
  else {
    const d = fetch('https://sql-dashboard.glitch.me/' + url)
      .then(res => res.text())
      .then(data => {
        let JSONobj = ""
        const d = []
        for (const character of data) {
          JSONobj += character
          if (character === "}") {
            //console.log(JSONobj)
            d.push(JSON.parse(JSONobj))
            JSONobj = ""
          }
        }
        return d
      })
    return d
  }
}

const orderByMonth = (arr) => {
  "use strict"
  let months = {}
  for (const el of arr) {
    if (months.hasOwnProperty('$' + el.month)) {
      months['$' + el.month].push(el)
    }
    else {
      months['$' + el.month] = [el]
    }
  }
  return months
}

const orderByDevice = (arr, device) => {
  const sortedByDevice = arr.filter(el => el.device === device)
  return sortedByDevice
}

const orderByPosition = (arr) => {
  const oneThree = arr.filter(el => el.position <= 3.5)
  const fourTen = arr.filter(el => el.position > 3.5 && el.position <= 10.5)
  const tenTwenty = arr.filter(el => el.position > 10.5 && el.position <= 20.5)
  const rest = arr.filter(el => el.position > 20.5)
  return {oneThree: oneThree, fourTen: fourTen, tenTwenty: tenTwenty, rest: rest}
}

const deviceByPosition = (month) => {
  return {mobile: orderByPosition(orderByDevice(month, 'MOBILE')), desktop: orderByPosition(orderByDevice(month, 'DESKTOP'))}
}

const filterByMetrics = (arr, requirements) => {
  let updatedArr = arr
  Object.keys(requirements).forEach(key => {
    updatedArr =
      key === "position" ?
      updatedArr.filter(el => el[key] <= requirements[key]) :
      updatedArr.filter(el => el[key] >= requirements[key])
  })
  return updatedArr
}


const getKwDistrib = (obj) => {
  const kwDistrib = {}
  Object.keys(obj).forEach(key => {
    kwDistrib[key] = deviceByPosition(obj[key])
  })
  return kwDistrib
}

const createARow = (month, monthName, device) => {
  const tr = document.createElement("tr")
  
  const th = document.createElement("th")
  th.scope = "col"
  th.textContent = monthName
  tr.appendChild(th)
  
  const {oneThree, fourTen, tenTwenty, rest} = month[device]
  const arr = [oneThree, fourTen, tenTwenty, rest]
  
  const total = arr.reduce((a,b) => {
    if (typeof a === "object") {
      a = a.length
    }
    return a + b.length
  })
  
  let impressions = 0
  let clicks = 0
  for (const dimension of arr) {
    impressions += dimension.map(el => Number(el.impressions)).reduce((a,b) =>a+b, 0)
    clicks += dimension.map(el => Number(el.clicks)).reduce((a,b) => a+b, 0)
  }
  
  const row = arr.map(el => el.length)
  row.push(total, impressions, clicks)
  
  for (const el of row) {
    const td = document.createElement("td")
    td.textContent = el
    tr.appendChild(td)
  }
  document.getElementById(device + '-t').childNodes[3].appendChild(tr)
}

const createTables = (data) => {
  Object.keys(data).slice().sort().forEach(key => {
    createARow(data[key], key.substring(1), 'mobile')
    createARow(data[key], key.substring(1), 'desktop')
  })
}

const getUniqueKw = (arr) => {
  const uniqueKw = Array.from(new Set(arr.map(el => el.query)))
  console.log(uniqueKw)
  return uniqueKw
}

const countUniqueKw = (arr) => {
  return getUniqueKw(arr).length
}

const getLongTail = (arr, n) => {
  return getUniqueKw(arr.filter(el => {
    const bool = el.query.split(" ").length >= n ? true : false
    return bool
  }))
} 

const sumMetrics = (arr) => {
  const sum = (acc, current) => Number(acc) + Number(current)
  const impressions = arr.map(el => el.impressions).reduce(sum, 0)
  const clicks = arr.map(el => el.clicks).reduce(sum, 0)
  
  const pos = arr.reduce((acc, current) => {
    typeof acc === "object" ? acc = Number(acc.position) * (Number(acc.impressions) / impressions) : acc
    const coeff = Number(current.impressions) / impressions
    return (Number(current.position) * coeff) + acc
  }, 0)
  return {impressions: impressions, clicks: clicks, avgPosition: Math.round(pos*10)/10}
}

const filterByKw = (arr, kw) => {
  const check = document.getElementById('check').checked
  if (kw === "" && !check) return arr
  const radio = document.querySelector('input[name="kwFilterType"]:checked').value
  const branded = document.getElementById('branded-terms').value.split(",")
  const containsFilter = el => el.query.includes(kw.toLowerCase())
  const exactMatchFilter = el => el.query === kw.toLowerCase()
  const brandedFilter = el => !branded.some(brandTerm => el.query.includes(brandTerm))
  const filterType = radio === "contains" ? containsFilter : exactMatchFilter
  
  const result = check ?
        arr.filter(el => filterType(el) && brandedFilter(el)) :
        arr.filter(el => filterType(el))
  return result
}

const getDeviation = (tf1, tf2) => {
  const percentage = (tf2 / tf1) * 100 - 100
  return Math.round(percentage * 10) / 10
}

const getPosDeviation = (tf1, tf2) => {
  const percentage = 100 - (tf2 / tf1) * 100
  return Math.round(percentage * 10) / 10
}

const getProperJson = (text) => {
  let JSONobj = ""
  const d = []
  for (const character of text) {
    JSONobj += character
    if (character === "}") {
      d.push(JSON.parse(JSONobj))
      JSONobj = ""
    }
  }
  return d
}

const getPeriodMetrics = (filteredData, filters, kw) => {
  const uniqueKw = countUniqueKw(filteredData)
  const metricsObject = sumMetrics(filteredData)
  
  document.getElementById('kw-count').textContent = uniqueKw
  document.getElementById('pos-avg').textContent = metricsObject.avgPosition
  document.getElementById('imp-t').textContent = metricsObject.impressions
  document.getElementById('clicks-t').textContent = metricsObject.clicks
  
  if (document.getElementById('second-url').checked) {
    const url = document.getElementById('select2').value
    const total2Div = document.getElementById('total-2')
    const deviationDiv = document.getElementById('deviation')
    
    if (!url.includes("BIG")) {
      fetch('https://sql-dashboard.glitch.me/' + url)
      .then(res => res.json())
      .then(data => {
        const filteredDataByMetrics = filterByMetrics(data, filters)
        const filteredByKw = filterByKw(filteredDataByMetrics, kw)
        const {avgPosition, impressions, clicks} = sumMetrics(filteredByKw)
        const metrics2 = [countUniqueKw(filteredByKw), avgPosition, impressions, clicks]
        const deviations = [getDeviation(metrics2[0], uniqueKw),
                             getPosDeviation(avgPosition, metricsObject.avgPosition),
                             getDeviation(impressions, metricsObject.impressions),
                             getDeviation(clicks, metricsObject.clicks)]

        for (const metric of metrics2) {
          const span = document.createElement('span')
          span.textContent = metric
          total2Div.appendChild(span)
        }

        for (const deviation of deviations) {
          const span = document.createElement('span')
          span.textContent = deviation + ' %'
          deviationDiv.appendChild(span)
        }
      })
    }
    else {
      fetch('https://sql-dashboard.glitch.me/' + url)
        .then(res => res.text())
        .then(data => {
          const df = getProperJson(data)
          const filteredDataByMetrics = filterByMetrics(df, filters)
          const filteredByKw = filterByKw(filteredDataByMetrics, kw)
          const {avgPosition, impressions, clicks} = sumMetrics(filteredByKw)
          const metrics2 = [countUniqueKw(filteredByKw), avgPosition, impressions, clicks]
          const deviations = [getDeviation(metrics2[0], uniqueKw),
                               getPosDeviation(avgPosition, metricsObject.avgPosition),
                               getDeviation(impressions, metricsObject.impressions),
                               getDeviation(clicks, metricsObject.clicks)]

          for (const metric of metrics2) {
            const span = document.createElement('span')
            span.textContent = metric
            total2Div.appendChild(span)
          }

          for (const deviation of deviations) {
            const span = document.createElement('span')
            span.textContent = deviation + ' %'
            deviationDiv.appendChild(span)
          }
        })
    }
  }
}

// google search console API


// ADD TO A BUTTON EVENTLISTENER
document.getElementById('butt').addEventListener('click', () => {
  document.getElementById('total-2').innerHTML = "Data is loading..."
  document.getElementById('kw-count').textContent = ""
  document.getElementById('pos-avg').textContent = ""
  document.getElementById('imp-t').textContent = ""
  document.getElementById('clicks-t').textContent = ""
  
  
  fetching().then(data => {
    document.getElementById('desktop-t').childNodes[3].innerHTML = ""
    document.getElementById('mobile-t').childNodes[3].innerHTML = ""
    document.getElementById('deviation').innerHTML = ""
    document.getElementById('total-2').innerHTML = ""
    
    const getFiltersValues = () => {
      const form = document.getElementById('filtersForm')
      const filters = {}
      for (const el of form) {
        el.value !== "" && Number(el.value) ? filters[el.name] = Number(el.value) : null
      }
      return  filters
    }
    const kw = document.getElementById('main-kw').value
    const filters = getFiltersValues()
    
    const filteredDataByMetrics = filterByMetrics(data, filters)
    const filteredByKw = filterByKw(filteredDataByMetrics, kw)
    //console.log(filteredByKw)
    
    const months = orderByMonth(filteredByKw)
    const kwDistrib = getKwDistrib(months)
    console.log(kwDistrib)
    
    createTables(kwDistrib)
    getPeriodMetrics(filteredByKw, filters, kw)
  })
})
