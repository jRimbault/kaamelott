#!/usr/bin/env node
import fs = require('fs')
import path = require('path')

const SOUNDS_DIR = path.join(__dirname, '..', 'sounds')
const INDEX_FILE = path.join(SOUNDS_DIR, 'sounds.json')
const META_FIELDS = ['character', 'quote', 'episode', 'number', 'book'] as const

interface Sound {
  readonly character: string
  readonly episode: {
    readonly book: number
    readonly number: number
    readonly title: string
  }
  readonly file: string
  readonly quote: string
}

function main() {
  const files = fs
    .readdirSync(SOUNDS_DIR)
    .filter(name => name.endsWith('.mp3'))
    .sort()

  const sounds = files.map(readMeta)

  fs.writeFileSync(INDEX_FILE, JSON.stringify(sounds, null, 2) + '\n')
  console.log(
    `wrote ${sounds.length} entries to ${path.relative(process.cwd(), INDEX_FILE)}`,
  )
}

function readMeta(file: string): Sound {
  const metaPath = path.join(SOUNDS_DIR, `${file}.meta`)
  if (!fs.existsSync(metaPath)) {
    throw new Error(`missing sidecar: ${metaPath}`)
  }

  const lines = fs.readFileSync(metaPath, 'utf8').split('\n')
  if (lines[lines.length - 1] === '') lines.pop()

  if (lines.length !== META_FIELDS.length) {
    throw new Error(
      `${metaPath}: expected ${META_FIELDS.length} lines, got ${lines.length}`,
    )
  }

  const values = {} as Record<typeof META_FIELDS[number], string>
  META_FIELDS.forEach((field, i) => {
    const line = lines[i]
    // A field may carry a value ("field: value") or be intentionally empty for
    // sounds whose episode/number/book is unknown ("field:", no trailing space).
    if (line === `${field}:`) {
      values[field] = ''
      return
    }
    const prefix = `${field}: `
    if (!line.startsWith(prefix)) {
      throw new Error(
        `${metaPath}:${i + 1}: expected line to start with "${field}:", got "${line}"`,
      )
    }
    values[field] = line.slice(prefix.length)
  })

  return {
    character: values.character,
    file,
    quote: values.quote,
    episode: {
      title: values.episode,
      number: parseInteger(values.number, `${metaPath}: number`),
      book: parseInteger(values.book, `${metaPath}: book`),
    },
  }
}

// Parse an integer field. An empty value is allowed for episode-less sounds and
// maps to 0, which the frontend renders safely (unlike null, on which
// `book.toString()` would throw).
function parseInteger(value: string, context: string): number {
  if (value === '') {
    return 0
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`${context}: expected an integer, got "${value}"`)
  }
  return Number.parseInt(value, 10)
}

main()
