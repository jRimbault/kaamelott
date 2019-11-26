import { Sound } from 'sounds'
import { normalizeDiacritics } from 'utils'

enum Data {
  episode = 'data-episode',
  character = 'data-character',
  title = 'data-title',
}

export function getAttributes(node: HTMLLIElement) {
  const character = node.getAttribute(Data.character) ?? ''
  const title = node.getAttribute(Data.title) ?? ''
  const episode = node.getAttribute(Data.episode) ?? ''
  return { character, title, episode } as const
}

export function setAttributes(sound: Sound) {
  return {
    [Data.title]: normalizeDiacritics(sound.title),
    [Data.character]: normalizeDiacritics(sound.character),
    [Data.episode]: normalizeDiacritics(sound.episode),
  } as const
}
