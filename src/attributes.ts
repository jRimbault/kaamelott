import { Sound, getEpisode } from 'sounds'
import { normalizeDiacritics } from 'utils'

export enum Data {
  episode = 'data-episode',
  character = 'data-character',
  title = 'data-title',
}

export function getAttributes(
  node: HTMLLIElement,
): { [k in keyof Omit<Sound, 'file'>]: string }
export function getAttributes(node: HTMLLIElement, field: Data): string
export function getAttributes(node: HTMLLIElement, field?: Data) {
  if (field !== undefined) {
    return node.getAttribute(field) ?? ''
  }
  const character = node.getAttribute(Data.character) ?? ''
  const title = node.getAttribute(Data.title) ?? ''
  const episode = node.getAttribute(Data.episode) ?? ''
  return { character, title, episode } as const
}

export function setAttributes(sound: Sound) {
  return {
    [Data.title]: normalizeDiacritics(sound.title),
    [Data.character]: normalizeDiacritics(sound.character),
    [Data.episode]: normalizeDiacritics(getEpisode(sound)),
  } as const
}
