import { getAttributes, Data } from 'attributes'
import { debounce, createNode } from 'dom'
import { normalizeDiacritics } from 'utils'
import { Sound, fakeDecimalToRoman } from 'sounds'
import { replaceList, filteredList } from 'layout'

export function initFilters(sounds: Sound[]) {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  if (!input) return
  input.setAttribute(
    'title',
    [
      'Recherche avancée :',
      ' personnage : "c:personnage"',
      ' citation : "q:citation"',
      ' titre episode : "t:titre"',
      ' livre : "b:3"',
      ' episode : "n:16"',
    ].join('\n'),
  )
  input.addEventListener('keyup', debounce(filterOnKeyUp(input)))
  attributeFilter(
    sounds,
    '#book-filter',
    s => s.episode.book,
    s => 'Livre ' + fakeDecimalToRoman(parseInt(s)),
    s => s.episode.number,
  )
  attributeFilter(sounds, '#character-filter', s => s.character)
}

function attributeFilter(
  sounds: Sound[],
  buttonId: string,
  get: (s: Sound) => string | number,
  title?: (s: string) => string,
  internalSort?: ((s: Sound) => string) | ((s: Sound) => number),
) {
  const filter = document.querySelector<HTMLButtonElement>('button' + buttonId)
  if (!filter) return
  const list = createNode('div', {
    id: 'list',
    children: filteredList(sounds, get, title, internalSort),
  })
  filter.addEventListener('click', () => replaceList(list))
}

enum DisplayState {
  hide = 'none',
  show = 'inline-block',
}

function filterOnKeyUp(input: HTMLInputElement) {
  const buildFilter = filterBuilder({})
  return () => {
    const list = Array.from(document.querySelectorAll('li'))
    const filter = buildFilter(normalizeDiacritics(input.value))
    for (const node of list) {
      node.style.display = DisplayState.show
      if (!filter(node)) {
        node.style.display = DisplayState.hide
      }
    }
  }
}

function filterBuilder(filters: { [k in string]?: RegExp }) {
  const shortcuts: { [k in string]?: Data } = {
    c: Data.character,
    q: Data.quote,
    t: Data.title,
    b: Data.book,
    n: Data.number,
  }

  return (value: string) => {
    if (value.length === 0) {
      return () => true
    }

    if (value[1] === ':') {
      const field = shortcuts[value[0]]
      if (field) {
        return searchField(value.slice(2), field)
      }
    }

    const pattern = filters[value] ?? (filters[value] = new RegExp(value, 'g'))
    return fullSearch(pattern)
  }
}

function fullSearch(pattern: RegExp) {
  return (node: HTMLLIElement) => {
    return Object.values(getAttributes(node)).some(resetAndTest(pattern))
  }
}

const cache: { [k in Data]: { [k in string]?: RegExp } } = {
  [Data.character]: {},
  [Data.quote]: {},
  [Data.title]: {},
  [Data.book]: {},
  [Data.number]: {},
}

function searchField(value: string, field: Data) {
  const pattern =
    cache[field][value] ?? (cache[field][value] = new RegExp(value, 'g'))
  return (node: HTMLLIElement) => {
    return pattern.test(getAttributes(node, field))
  }
}

function resetAndTest(pattern: RegExp) {
  return (attribute: string) => {
    pattern.lastIndex = 0
    return pattern.test(attribute)
  }
}
