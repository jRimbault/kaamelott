import { setAttributes } from './attributes'
import { NodeDefinition, createNode } from './dom'
import { togglePlay } from './player'
import { Sound, getEpisode } from './sounds'
import { partition, sort } from './utils'

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

export function buildHtmlList(sounds: readonly Sound[]) {
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
              // Tooltip states the action, then the context (who / which
              // episode). The player swaps to the stop title while playing.
              'title': `Écouter — ${sound.character}, ${getEpisode(sound)}`,
              'data-play-title': `Écouter — ${sound.character}, ${getEpisode(
                sound,
              )}`,
              'data-stop-title': 'Arrêter la lecture',
              // Make the play control reachable and operable without a mouse.
              'role': 'button',
              'tabindex': '0',
              'aria-label': `Écouter la réplique : ${sound.quote}`,
            },
            listeners: {
              click: { callback: onPlay(sound) },
              keydown: { callback: onPlayKey(sound) },
            },
          },
        ],
      ],
    },
  ]
}

function buildShareButton(sound: Sound): NodeDefinition {
  return [
    'a',
    {
      classList: ['btn', 'btn-share'],
      attributes: {
        'title': 'Copier le lien du son',
        'role': 'button',
        'tabindex': '0',
        'aria-label': `Copier le lien de la réplique : ${sound.quote}`,
      },
      listeners: {
        click: { callback: onShare(sound) },
        keydown: { callback: onShareKey(sound) },
      },
    },
  ]
}

function getSoundFileUrl(sound: Sound) {
  return `${window.location.href}sounds/${sound.file}`
}

// The play/stop control toggles a single global audio player. `currentTarget`
// is the anchor the listener is bound to, which owns the `playing` state class.
function onPlay(sound: Sound) {
  return ($event: MouseEvent) => {
    togglePlay(sound.file, $event.currentTarget as HTMLElement)
  }
}

function onPlayKey(sound: Sound) {
  return ($event: KeyboardEvent) => {
    if (isActivationKey($event)) {
      $event.preventDefault()
      togglePlay(sound.file, $event.currentTarget as HTMLElement)
    }
  }
}

// Copy the shareable URL and give the otherwise silent action a visible
// confirmation by flashing the button.
function onShare(sound: Sound) {
  return ($event: MouseEvent) => {
    copyAndConfirm(sound, $event.currentTarget as HTMLElement)
  }
}

function onShareKey(sound: Sound) {
  return ($event: KeyboardEvent) => {
    if (isActivationKey($event)) {
      $event.preventDefault()
      copyAndConfirm(sound, $event.currentTarget as HTMLElement)
    }
  }
}

function copyAndConfirm(sound: Sound, button: HTMLElement) {
  navigator.clipboard
    .writeText(getSoundFileUrl(sound))
    .then(() => confirmCopy(button))
    .catch(() => undefined)
}

function confirmCopy(button: HTMLElement) {
  button.classList.add('copied')
  button.setAttribute('title', 'Lien copié !')
  setTimeout(() => {
    button.classList.remove('copied')
    button.setAttribute('title', 'Copier le lien du son')
  }, 1200)
}

function isActivationKey($event: KeyboardEvent): boolean {
  const key = $event.key
  return key === 'Enter' || key === ' ' || key === 'Spacebar'
}
