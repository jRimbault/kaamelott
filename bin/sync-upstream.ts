#!/usr/bin/env node
import child_process = require('child_process')
import fs = require('fs')
import path = require('path')

const UPSTREAM_REMOTE = 'upstream'
const UPSTREAM_REF = `${UPSTREAM_REMOTE}/master`
const SOUNDS_DIR = path.join(__dirname, '..', 'sounds')

interface UpstreamSound {
  readonly character: string
  readonly episode: string
  readonly file: string
  readonly title: string
}

interface Episode {
  readonly number: number
  readonly book: number
  readonly title: string
}

const ROMAN_BOOKS: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
}

// Upstream episode strings look like "Livre II, 03 - Le Dialogue de Paix",
// occasionally missing the comma. A handful of entries (teasers, malformed
// data) don't match at all and are kept as freeform titles.
const EPISODE_PATTERN = /^Livre ([IVX]+),?\s+(\d+)\s*-\s*(.*)$/

function main() {
  fetchUpstream()

  const newFiles = findNewFiles()
  if (newFiles.length === 0) {
    console.log(`nothing to sync, up to date with ${UPSTREAM_REF}`)
    return
  }

  const byFile = new Map(readUpstreamSounds().map(s => [s.file, s]))
  const skipped: string[] = []

  for (const file of newFiles) {
    const sound = byFile.get(file)
    if (!sound) {
      skipped.push(file)
      continue
    }
    writeSoundFile(file)
    writeMetaFile(file, sound)
  }

  console.log(`imported ${newFiles.length - skipped.length} new sounds`)
  if (skipped.length > 0) {
    console.warn(`skipped ${skipped.length} file(s) with no metadata entry:`)
    skipped.forEach(file => console.warn(`  ${file}`))
  }

  child_process.execFileSync('npx', ['tsx', 'bin/build-index.ts'], {
    stdio: 'inherit',
  })
}

function fetchUpstream() {
  child_process.execFileSync('git', ['fetch', UPSTREAM_REMOTE, 'master'], {
    stdio: 'inherit',
  })
}

function findNewFiles(): readonly string[] {
  const upstreamFiles = new Set(
    child_process
      .execFileSync(
        'git',
        ['ls-tree', '-r', UPSTREAM_REF, '--name-only', '--', 'sounds/'],
        { encoding: 'utf8' },
      )
      .split('\n')
      .filter(name => name.endsWith('.mp3'))
      .map(name => path.basename(name)),
  )
  const localFiles = new Set(
    fs.readdirSync(SOUNDS_DIR).filter(name => name.endsWith('.mp3')),
  )
  return [...upstreamFiles].filter(name => !localFiles.has(name)).sort()
}

function readUpstreamSounds(): readonly UpstreamSound[] {
  const raw = child_process.execFileSync(
    'git',
    ['show', `${UPSTREAM_REF}:sounds/sounds.json`],
    { encoding: 'utf8' },
  )
  return JSON.parse(raw)
}

function writeSoundFile(file: string) {
  const buffer = child_process.execFileSync(
    'git',
    ['show', `${UPSTREAM_REF}:sounds/${file}`],
    { maxBuffer: 10 * 1024 * 1024 },
  )
  fs.writeFileSync(path.join(SOUNDS_DIR, file), buffer)
}

function writeMetaFile(file: string, sound: UpstreamSound) {
  const episode = parseEpisode(sound.episode)
  const lines = [
    `character: ${sound.character}`,
    `quote: ${sound.title}`,
    episode.title === '' ? 'episode:' : `episode: ${episode.title}`,
    episode.number === 0 ? 'number:' : `number: ${episode.number}`,
    episode.book === 0 ? 'book:' : `book: ${episode.book}`,
  ]
  fs.writeFileSync(
    path.join(SOUNDS_DIR, `${file}.meta`),
    lines.join('\n') + '\n',
  )
}

function parseEpisode(episode: string): Episode {
  if (episode === '') {
    return { number: 0, book: 0, title: '' }
  }
  const match = EPISODE_PATTERN.exec(episode)
  if (!match) {
    return { number: 0, book: 0, title: episode }
  }
  const [, roman, number, title] = match
  const book = ROMAN_BOOKS[roman]
  if (book === undefined) {
    return { number: 0, book: 0, title: episode }
  }
  return { number: Number.parseInt(number, 10), book, title }
}

main()
