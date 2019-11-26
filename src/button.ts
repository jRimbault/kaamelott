import { setAttributes } from 'attributes'
import { Sound } from 'sounds'
import { createNode } from 'dom'

const listenToClick = (sound: Sound) => () => play(sound.file)
const play = (file: string) => new Audio(`sounds/${file}`).play()
const soundUrl = (sound: Sound) => `${window.location.href}sounds/${sound.file}`
const toClipboard = (sound: Sound) => () => navigator.clipboard.writeText(soundUrl(sound))

export function buildListItem(sound: Sound) {
  return createNode('li', {
    attributes: { ...setAttributes(sound) },
    children: [buildPlayButton(sound), buildShareButton(sound)],
  })
}

function buildPlayButton(sound: Sound) {
  return createNode('div', {
    children: [
      createNode('a', {
        classList: ['btn', 'btn-play'],
        textContent: sound.title,
        attributes: {
          title: [sound.title, sound.character, sound.episode].join('\n'),
        },
      }),
    ],
    listeners: {
      click: { callback: listenToClick(sound) },
    },
  })
}

function buildShareButton(sound: Sound) {
  return createNode('a', {
    classList: ['btn', 'btn-share'],
    attributes: { title: soundUrl(sound) },
    listeners: {
      click: { callback: toClipboard(sound) },
    },
  })
}
