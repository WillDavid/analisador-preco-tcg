import * as cheerio from 'cheerio'

export async function scrapeCollection(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const cards = []
  const seen = new Set()

  const lines = $('.col-mob-precos').toArray()
  for (const el of lines) {
    const container = $(el).parent().parent()
    if (!container.length) continue

    const cardId = container.find('a[href*="view=cards/card"]').first().attr('href') || ''
    const idMatch = cardId.match(/card=([^&]+)/)
    const cardName = idMatch ? decodeURIComponent(idMatch[1].replace(/\+/g, ' ').replace(/\(\d+.*?\)/, '').trim()) : ''
    if (!cardName) continue

    const parts = container.text().split('\n').map(s => s.trim()).filter(Boolean)
    const editionEl = container.find('img[title]').first()
    const edition = editionEl.attr('title') || ''
    const numberText = parts.find(p => /^\d{1,4}\/\d{1,4}$/.test(p)) || parts.find(p => /^\d+\/\w+/.test(p)) || ''
    const rarityEl = container.find('[class*="raridade"], td:contains("RD"), td:contains("SR"), td:contains("IR"), td:contains("RU"), td:contains("C"), td:contains("RA"), td:contains("PB")')
    const rarity = rarityEl.length ? rarityEl.text().trim().match(/^(RD|SR|IR|RU|RA|RR|UR|C|U|R|PB|AS|S|ACE SPEC)$/)?.[0] || '' : ''

    const langEl = container.find('img[alt*="Portugu"], img[alt*="Ingl"], img[alt*="Japon"], img[alt*="Espanh"], img[alt*="Alem"], img[alt*="Franc"], img[alt*="Italia"], img[alt*="Chin"], img[alt*="Corea"]')
    let language = 'Português'
    if (langEl.length) {
      const alt = langEl.attr('alt') || langEl.attr('title') || ''
      const langMatch = alt.match(/(Português|Inglês|Japonês|Espanhol|Alemão|Francês|Italiano|Chinês|Coreano|Tailandês)/)
      if (langMatch) language = langMatch[0]
    }

    const condText = parts.filter(p => /^(NM|M|SP|MP|HP|D)$/.test(p))
    const condition = condText[0] || 'NM'

    const qtyMatch = container.text().match(/(\d+)x/)
    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1

    const foilEl = container.find('font[color="red"] b, td:contains("Foil"), td:contains("Reverse")')
    const extra = foilEl.length ? 'Foil' : ''

    const pricesCompra = container.find('.col-pr-compra div').toArray().map(d => parsePrice($(d).text()))
    const pricesVenda = container.find('.col-pr-venda div').toArray().map(d => parsePrice($(d).text()))

    const buyMin = pricesCompra[0] ?? null
    const buyAvg = pricesCompra[1] ?? null
    const buyMax = pricesCompra[2] ?? null
    const sellMin = pricesVenda[0] ?? null
    const sellAvg = pricesVenda[1] ?? null
    const sellMax = pricesVenda[2] ?? null

    const key = `${cardName}|${numberText}|${edition}|${language}|${condition}|${extra}`
    if (seen.has(key)) continue
    seen.add(key)

    cards.push({
      edition,
      number: numberText,
      namePt: cardName,
      nameEn: '',
      rarity,
      quantity,
      language,
      condition,
      extra,
      buyMin,
      buyAvg,
      buyMax,
      sellMin,
      sellAvg,
      sellMax
    })
  }

  if (cards.length === 0) {
    const rows = $('tr[id^="cc_card_"]').toArray()
    for (const row of rows) {
      const $row = $(row)
      const id = $row.attr('id')
      if (!id) continue
      const tds = $row.find('td').toArray().map(td => $(td).text().trim())
      if (tds.length < 9) continue

      const qtyMatch = tds[0].match(/(\d+)x/)
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1
      const number = tds[1]
      const edition = $row.find('td.col-ed-txt img').attr('title') || ''
      const namePt = $row.find('a[target="_blank"]').first().text().trim()
      const nameEnEl = $row.find('a[style*="italic"], a[style*="font-size:0.9em"]').last()
      const nameEn = nameEnEl.length ? nameEnEl.text().trim() : ''
      const rarity = tds[5] || ''
      const condition = tds[6] || 'NM'
      const langImg = $row.find('img[alt*="Portugu"], img[alt*="Ingl"], img[alt*="Japon"]')
      let language = 'Português'
      if (langImg.length) {
        const alt = langImg.attr('alt') || ''
        const langMatch = alt.match(/(Português|Inglês|Japonês|Espanhol|Alemão|Francês|Italiano)/)
        if (langMatch) language = langMatch[0]
      }
      const extra = $row.find('font[color="red"]').length ? 'Foil' : ''

      const buyMin = parsePrice(tds[9] || '')
      const sellMin = parsePrice(tds[10] || '')

      cards.push({
        edition,
        number,
        namePt,
        nameEn,
        rarity,
        quantity,
        language,
        condition,
        extra,
        buyMin,
        buyAvg: buyMin,
        buyMax: buyMin,
        sellMin,
        sellAvg: sellMin,
        sellMax: sellMin
      })
    }
  }

  const totals = {
    buyMin: parseFloat($('input[name="pgC"]').val() || '0'),
    buyAvg: parseFloat($('input[name="pgD"]').val() || '0'),
    buyMax: parseFloat($('input[name="pgE"]').val() || '0'),
    sellMin: parseFloat($('input[name="pgF"]').val() || '0'),
    sellAvg: parseFloat($('input[name="pgG"]').val() || '0'),
    sellMax: parseFloat($('input[name="pgH"]').val() || '0')
  }

  return { cards, totals }
}

function parsePrice(text) {
  const cleaned = (text || '').replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}
