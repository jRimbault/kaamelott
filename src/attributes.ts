import { Sound } from 'sounds'
import { normalizeDiacritics } from 'utils'

export enum Data {
  character = 'data-character',
  quote = 'data-quote',
  title = 'data-title',
  book = 'data-book',
  number = 'data-number',
}

interface CustomAttributes {
  readonly character: string
  readonly quote: string
  readonly title: string
  readonly book: string
  readonly number: string
}

export function getAttributes(node: HTMLLIElement): CustomAttributes
export function getAttributes(node: HTMLLIElement, field: Data): string
export function getAttributes(node: HTMLLIElement, field?: Data) {
  if (field !== undefined) {
    return node.getAttribute(field) ?? ''
  }
  const character = node.getAttribute(Data.character) ?? ''
  const quote = node.getAttribute(Data.quote) ?? ''
  const title = node.getAttribute(Data.title) ?? ''
  const book = node.getAttribute(Data.book) ?? ''
  const number = node.getAttribute(Data.number) ?? ''
  return { character, quote, title, book, number }
}

export function setAttributes(sound: Sound) {
  return {
    [Data.character]: normalizeDiacritics(sound.character),
    [Data.quote]: normalizeDiacritics(sound.quote),
    [Data.title]: normalizeDiacritics(sound.episode.title),
    [Data.book]: sound.episode.book.toString(),
    [Data.number]: sound.episode.number.toString(),
  } as const
}
