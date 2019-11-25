import { AttrData } from "sounds"

export function initFilter() {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  const list = Array.from(document.querySelectorAll('li'))
  if (input === null || list.length === 0) {
    return
  }
  input.addEventListener('keyup', filterOnKeyUp(input, list))
}

export function normalizeDiacritics(value: string) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

enum DisplayState {
  hide = 'none',
  show = 'inline-block',
}

function filterOnKeyUp(input: HTMLInputElement, list: readonly HTMLLIElement[]) {
  const buildFilter = filterBuilder({});
  return () => {
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
  return (value: string) => {
    const pattern = filters[value] ?? (filters[value] = new RegExp(value, 'gi'))
    return (node: HTMLLIElement) => {
      if (value.length === 0) {
        return true
      }
      return getAttributes(node).some(resetAndTest(pattern))
    }
  }
}

function getAttributes(node: HTMLLIElement) {
  const character = node.getAttribute(AttrData.character) ?? ''
  const title = node.getAttribute(AttrData.title) ?? ''
  const episode = node.getAttribute(AttrData.episode) ?? ''
  return [character, title, episode]
}

function resetAndTest(pattern: RegExp) {
  return (attribute: string) => {
    pattern.lastIndex = 0
    return pattern.test(attribute)
  }
}
