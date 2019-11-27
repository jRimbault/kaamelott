import { getAttributes } from 'attributes'
import { normalizeDiacritics } from 'utils'

export function initFilter() {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  const list = Array.from(document.querySelectorAll('li'))
  input?.addEventListener('keyup', debounce(filterOnKeyUp(input, list)))
}

enum DisplayState {
  hide = 'none',
  show = 'inline-block',
}

function filterOnKeyUp(
  input: HTMLInputElement,
  list: readonly HTMLLIElement[],
) {
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
    if (value.length === 0) {
      return () => true
    }
    const pattern = filters[value] ?? (filters[value] = new RegExp(value, 'g'))
    return (node: HTMLLIElement) => {
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

export function debounce<F extends Function>(
  eventHandler: F,
  milliseconds = 500,
): F {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (function(this: unknown, ...args: unknown[]) {
    if (timer !== undefined) {
      clearTimeout(timer)
    }
    timer = setTimeout(eventHandler.bind(this, ...args), milliseconds)
  } as unknown) as F
}
