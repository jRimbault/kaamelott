import { initFilter, normalizeDiacritics } from "filter"
import { Sound, AttrData } from "sounds"
import { createNode } from "utils"

async function main() {
  const sounds = await (await fetch<Sound[]>('sounds/sounds.json')).json()
  const list = buildHtmlList(sounds.sort(localeSortBy(s => s.title)))
  document.body.appendChild(list)
}

const play = (file: string) => new Audio(`sounds/${file}`).play()
const listenToClick = (sound: Sound) => () => play(sound.file)
const soundUrl = (sound: Sound) => `${window.location.href}sounds/${sound.file}`
const toClipboard = (sound: Sound) => () => navigator.clipboard.writeText(soundUrl(sound))

function buildHtmlList(sounds: readonly Sound[]) {
  return createNode('div', {
    id: 'list',
    children: [
      createNode('ul', { children: sounds.map(buildListItem) })
    ]
  })
}

function buildListItem(sound: Sound) {
  return createNode('li', {
    attributes: {
      [AttrData.title]: normalizeDiacritics(sound.title),
      [AttrData.character]: normalizeDiacritics(sound.character),
      [AttrData.episode]: normalizeDiacritics(sound.episode),
    },
    children: [
      createNode('div', {
        children: [
          createNode('a', {
            classList: ['btn', 'btn-play'],
            textContent: sound.title,
            attributes: { title: [sound.title, sound.character, sound.episode].join('\n') }
          }),
        ],
        listeners: {
          click: { callback: listenToClick(sound) }
        },
      }),
      createNode('a', {
        classList: ['btn', 'btn-share'],
        attributes: { title: soundUrl(sound) },
        listeners: {
          click: { callback: toClipboard(sound) }
        }
      }),
    ],
  })
}

function localeSortBy<T>(selector: (value: T) => string) {
  return (a: T, b: T) => {
    return selector(a).localeCompare(selector(b))
  }
}

window.onload = async () => {
  await main()
  initFilter()
}
