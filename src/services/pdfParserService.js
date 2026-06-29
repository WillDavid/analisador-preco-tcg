import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'

const Y_TOLERANCE = 5
const HEADER_KEYWORDS = ['ediÇÃo', 'ediÇao', 'edição', 'edicao', 'card en', 'card pt', 'c -', 'v -']

const COLUMN_RANGES = [
  { key: 'edition',  xMax: 80 },
  { key: 'number',   xMax: 132 },
  { key: 'color',    xMax: 156 },
  { key: 'rarity',   xMax: 190 },
  { key: 'quantity', xMax: 207 },
  { key: 'language', xMax: 218 },
  { key: 'condition',xMax: 232 },
  { key: 'namePt',   xMax: 280 },
  { key: 'nameEn',   xMax: 360 },
  { key: 'extra',    xMax: 395 },
  { key: 'buyMin',   xMax: 428 },
  { key: 'buyAvg',   xMax: 452 },
  { key: 'buyMax',   xMax: 478 },
  { key: 'sellMin',  xMax: 510 },
  { key: 'sellAvg',  xMax: 538 },
  { key: 'sellMax',  xMax: 9999 }
]

function cleanStr(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
}

function isHeaderGroup(line) {
  const text = cleanStr(line.items.map(i => i.str).join(' '))
  return HEADER_KEYWORDS.some(kw => text.includes(kw))
}

function isAllNumberItems(items) {
  if (items.length === 0) return false
  return items.every(item => {
    const s = item.str.replace(/\./g, '').replace(',', '.').trim()
    return /^\d+(\.\d+)?$/.test(s)
  })
}

function assignItemsToLine(items) {
  const row = {}
  for (const item of items) {
    const cx = item.x + item.width / 2
    for (const range of COLUMN_RANGES) {
      if (cx <= range.xMax) {
        const existing = row[range.key]
        row[range.key] = existing ? existing + ' ' + item.str : item.str
        break
      }
    }
  }
  return row
}

function hasIdentifierData(row) {
  return row.edition || row.number || row.namePt || row.nameEn
}

function parseNumber(val) {
  if (val === null || val === undefined || val === '') return null
  const str = String(val).trim()
  if (/^\d+x?$/i.test(str)) return parseInt(str.replace('x', '').replace('X', ''), 10)
  const clean = str.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? null : num
}

function createCardFromRow(row) {
  const quantity = parseNumber(row.quantity) || 1
  return {
    edition: (row.edition || '').trim(),
    number: (row.number || '').trim(),
    rarity: (row.rarity || '').trim(),
    quantity,
    language: (row.language || '').trim(),
    condition: (row.condition || '').trim(),
    namePt: (row.namePt || '').trim(),
    nameEn: (row.nameEn || '').trim(),
    extra: (row.extra || '').trim(),
    buyMin: parseNumber(row.buyMin),
    buyAvg: parseNumber(row.buyAvg),
    buyMax: parseNumber(row.buyMax),
    sellMin: parseNumber(row.sellMin),
    sellAvg: parseNumber(row.sellAvg),
    sellMax: parseNumber(row.sellMax),
    _raw: row
  }
}

async function extractTextItems(pdf, pageNum, pageOffset) {
  const page = await pdf.getPage(pageNum)
  const content = await page.getTextContent()
  const viewport = page.getViewport({ scale: 1 })
  const items = []
  for (const item of content.items) {
    if (!item.str || !item.str.trim()) continue
    const tx = item.transform
    items.push({
      str: item.str,
      x: tx[4],
      y: pageOffset + viewport.height - tx[5],
      width: item.width,
      height: item.height,
      page: pageNum
    })
  }
  return items
}

function groupByY(items) {
  const groups = []
  const sorted = [...items].sort((a, b) => b.y - a.y)

  for (const item of sorted) {
    let placed = false
    for (const group of groups) {
      if (Math.abs(group.y - item.y) <= Y_TOLERANCE) {
        group.items.push(item)
        group.y = (group.y * (group.items.length - 1) + item.y) / group.items.length
        group.items.sort((a, b) => a.x - b.x)
        placed = true
        break
      }
    }
    if (!placed) {
      groups.push({ y: item.y, items: [item] })
    }
  }

  groups.sort((a, b) => b.y - a.y)
  return groups
}

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const numPages = pdf.numPages

  const allItems = []
  let pageOffset = 0
  const firstPage = await pdf.getPage(1)
  const vp = firstPage.getViewport({ scale: 1 })

  for (let i = 1; i <= numPages; i++) {
    const items = await extractTextItems(pdf, i, pageOffset)
    allItems.push(...items)
    pageOffset += vp.height
  }

  return allItems
}

export function parseAllItems(allItems) {
  const physicalLines = groupByY(allItems)

  let headerStart = -1
  for (let i = 0; i < physicalLines.length; i++) {
    if (isHeaderGroup(physicalLines[i])) {
      headerStart = i
      break
    }
  }

  if (headerStart < 0) {
    return { cards: [], totals: null, errors: ['Tabela de cartas nao encontrada no PDF'] }
  }

  let headerEnd = headerStart
  for (let i = headerStart + 1; i < Math.min(headerStart + 3, physicalLines.length); i++) {
    const text = cleanStr(physicalLines[i].items.map(it => it.str).join(' '))
    if (isHeaderGroup(physicalLines[i]) || text.includes('menor') || text.includes('medio') || text.includes('maior')) {
      headerEnd = i
    } else {
      break
    }
  }

  const dataLines = []
  for (let i = 0; i < physicalLines.length; i++) {
    if (i >= headerStart && i <= headerEnd) continue
    if (isAllNumberItems(physicalLines[i].items)) continue
    if (isHeaderGroup(physicalLines[i])) continue
    dataLines.push(physicalLines[i])
  }

  const rawRows = []
  for (const line of dataLines) {
    const row = assignItemsToLine(line.items)
    if (Object.keys(row).length === 0) continue

    if (hasIdentifierData(row)) {
      rawRows.push(row)
    } else if (rawRows.length > 0) {
      const prev = rawRows[rawRows.length - 1]
      for (const key of Object.keys(row)) {
        if (row[key]) {
          prev[key] = prev[key] ? prev[key] + ' ' + row[key] : row[key]
        }
      }
    }
  }

  const cards = rawRows
    .map(createCardFromRow)
    .filter(card => card.edition || card.number || card.namePt || card.nameEn)

  const errors = []
  for (const card of cards) {
    const cardErrors = []
    if (!card.edition) cardErrors.push('Edicao ausente')
    if (!card.number) cardErrors.push('Numero ausente')
    if (!card.namePt && !card.nameEn) cardErrors.push('Nome ausente')
    if (cardErrors.length > 0) {
      errors.push({
        card: card.namePt || card.nameEn || card.number || 'Desconhecida',
        errors: cardErrors
      })
    }
  }

  const totals = {
    buyMin: cards.reduce((s, c) => s + ((c.buyMin ?? 0) * (c.quantity || 1)), 0),
    buyAvg: cards.reduce((s, c) => s + ((c.buyAvg ?? 0) * (c.quantity || 1)), 0),
    buyMax: cards.reduce((s, c) => s + ((c.buyMax ?? 0) * (c.quantity || 1)), 0),
    sellMin: cards.reduce((s, c) => s + ((c.sellMin ?? 0) * (c.quantity || 1)), 0),
    sellAvg: cards.reduce((s, c) => s + ((c.sellAvg ?? 0) * (c.quantity || 1)), 0),
    sellMax: cards.reduce((s, c) => s + ((c.sellMax ?? 0) * (c.quantity || 1)), 0)
  }

  return { cards, totals, errors }
}

export async function processPdf(file) {
  const allItems = await extractPdfText(file)
  return parseAllItems(allItems)
}
