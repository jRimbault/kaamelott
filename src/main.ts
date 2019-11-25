import { createNode } from "utils"
import { Sound } from "sounds"


const play = (file: string) => new Audio(`sounds/${file}`).play()

const listenToClick = (sound: Sound) => () => play(sound.file)

const soundUrl = (sound: Sound) => `${window.location.href}sounds/${sound.file}`
const toClipboard = (sound: Sound) => () =>
  navigator.clipboard.writeText(soundUrl(sound))

function makeListItem(sound: Sound) {
  return createNode('li', {
    attributes: {
      'data-title': sound.title.toLocaleLowerCase(),
      'data-character': sound.character.toLocaleLowerCase(),
      'data-episode': sound.episode.toLocaleLowerCase(),
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

function checkNode(value: string) {
  return (node: HTMLLIElement) => {
    if (value.length === 0) {
      return true
    }
    const title = node.getAttribute('data-title')
    const character = node.getAttribute('data-character')
    const episode = node.getAttribute('data-episode')
    if (!title || !character || !episode) {
      return false
    }
    return character.includes(value)
      || title.includes(value)
      || episode.includes(value)
  }
}

function insertList(listNodes: readonly HTMLLIElement[]) {
  const listDiv = createNode('div', {
    id: 'list',
    children: [
      createNode('ul', { children: listNodes })
    ]
  })
  document.body.appendChild(listDiv)
}

function localeSort<T>(selector: (value: T) => string) {
  return (a: T, b: T) => {
    return selector(a).localeCompare(selector(b))
  }
}

async function main() {
  const sounds = await (await fetch<Sound[]>('sounds/sounds.json')).json()
  insertList(sounds.sort(localeSort(s =>  s.title)).map(makeListItem))
}

function initFilter() {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  const list = Array.from(document.querySelectorAll('li'))
  if (!input || !list) {
    return
  }
  input.addEventListener('keyup', () => {
    const filtering = checkNode(input.value.toLocaleLowerCase())
    for (const el of list) {
      el.style.display = 'inline-block'
      if (!filtering(el)) {
        el.style.display = 'none'
      }
    }
  })
}

window.onload = async () => {
  await main()
  setTimeout(initFilter, 0)
}
