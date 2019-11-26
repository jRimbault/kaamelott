import { setAttributes } from 'attributes'
import { NodeDefinition } from 'dom'
import { Sound } from 'sounds'

export function buildListItem(sound: Sound): NodeDefinition {
  return [
    'li',
    {
      attributes: { ...setAttributes(sound) },
      children: [buildPlayButton(sound), buildShareButton(sound)],
    },
  ]
}

function buildPlayButton(sound: Sound): NodeDefinition {
  return [
    'div',
    {
      children: [
        [
          'a',
          {
            classList: ['btn', 'btn-play'],
            textContent: sound.title,
            attributes: {
              title: [sound.title, sound.character, sound.episode].join('\n'),
            },
          },
        ],
      ],
      listeners: {
        click: { callback: listenToClick(sound) },
      },
    },
  ]
}

function buildShareButton(sound: Sound): NodeDefinition {
  return [
    'a',
    {
      classList: ['btn', 'btn-share'],
      attributes: { title: getSoundFileUrl(sound) },
      listeners: {
        click: { callback: toClipboard(sound) },
      },
    },
  ]
}

function getSoundFileUrl(sound: Sound) {
  return `${window.location.href}sounds/${sound.file}`
}

function toClipboard(sound: Sound) {
  return () => navigator.clipboard.writeText(getSoundFileUrl(sound))
}

function listenToClick(sound: Sound) {
  return () => play(sound.file)
}

function play(file: string) {
  return new Audio(`sounds/${file}`).play()
}
