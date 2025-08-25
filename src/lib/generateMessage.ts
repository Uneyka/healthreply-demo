type Categories = {
  schlaf?: 'gut'|'mittel'|'schlecht'
  essen?: 'gut'|'okay'|'wenig'
  aktivitaet?: string[]
  stimmung?: 'fröhlich'|'ruhig'|'angespannt'
  note?: string
}

export function generateMessage(name: string, c: Categories) {
  const parts: string[] = []
  if (c.essen) parts.push(`${name} hat heute ${c.essen} gegessen`)
  if (c.aktivitaet?.length) parts.push(`war bei ${c.aktivitaet.join(' und ')} dabei`)
  if (c.schlaf) parts.push(`und hat ${c.schlaf} geschlafen`)
  let text = parts.join(' ')
  if (c.stimmung) text += `. Die Stimmung war ${c.stimmung}.`
  if (!text) text = `${name} hatte heute einen ruhigen Tag.`
  if (c.note) text += ` Hinweis: ${sanitizeNote(c.note)}`
  return text.replace(/\s+\./g, '.').trim()
}

function sanitizeNote(s: string) {
  return s.length > 250 ? s.slice(0, 247) + '…' : s
}
