import { setAttributes } from 'attributes'
import { NodeDefinition, createNode } from 'dom'
import { Sound, getEpisode } from 'sounds'
import { partition, sort } from 'utils'

export function initialList(sounds: readonly Sound[]) {
  replaceList(buildHtmlList(sounds))
}

export function filteredList(
  sounds: readonly Sound[],
  get: (s: Sound) => string | number,
  title?: (s: string) => string,
  internalSort?: ((s: Sound) => string) | ((s: Sound) => number),
) {
  const soundGroups = partition(sounds, get)
  const defs: NodeDefinition[] = []
  const sortedGroupsKeys = sort(Object.keys(soundGroups), b => b)
  for (const groupKey of sortedGroupsKeys) {
    const groupedSounds = soundGroups[groupKey]
    if (groupedSounds) {
      defs.push(
        ['h2', { textContent: title ? title(groupKey) : groupKey }],
        [
          'ul',
          {
            children: (internalSort
              ? sort(groupedSounds, internalSort)
              : groupedSounds
            ).map(buildListItem),
          },
        ],
      )
    }
  }
  return defs
}

export function replaceList(newList: HTMLDivElement) {
  const div = document.querySelector('#list')
  if (!div) return
  div.replaceWith(newList)
}

function buildHtmlList(sounds: readonly Sound[]) {
  return createNode('div', {
    id: 'list',
    children: [['ul', { children: sounds.map(buildListItem) }]],
  })
}

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
            textContent: sound.quote,
            attributes: {
              title: [sound.quote, sound.character, getEpisode(sound)].join(
                '\n',
              ),
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
