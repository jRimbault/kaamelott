import { getAttributes } from 'attributes'
import { normalizeDiacritics } from 'utils'

export function initFilter() {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  const list = Array.from(document.querySelectorAll('li'))
  if (input === null || list.length === 0) {
    return
  }
  input.addEventListener('keyup', filterOnKeyUp(input, list))
}

enum DisplayState {
  hide = 'none',
  show = 'inline-block',
}

function filterOnKeyUp(input: HTMLInputElement, list: readonly HTMLLIElement[]) {
  const buildFilter = filterBuilder({})
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
      return Object.values(getAttributes(node)).some(resetAndTest(pattern))
    }
  }
}

function resetAndTest(pattern: RegExp) {
  return (attribute: string) => {
    pattern.lastIndex = 0
    return pattern.test(attribute)
  }
}
