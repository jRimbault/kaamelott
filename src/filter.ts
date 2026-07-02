import { getAttributes, Data } from './attributes'
import { debounce, createNode } from './dom'
import { normalizeDiacritics } from './utils'
import { Sound, fakeDecimalToRoman } from './sounds'
import { replaceList, filteredList } from './layout'

export function initFilters(sounds: Sound[]) {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  if (!input) return
  const runFilter = filterOnKeyUp(input)
  input.addEventListener('keyup', debounce(runFilter))
  const clear = document.querySelector<HTMLButtonElement>('#clear-search')
  if (clear) {
    clear.addEventListener('click', () => {
      input.value = ''
      runFilter()
      input.focus()
    })
  }
  // The advanced-search prefixes used to be discoverable only through a hover
  // tooltip. Expose them as visible chips that scope the search instead.
  initScopeChips(input, runFilter)
  const defaultSearch = window.location.search.substring(1)
  if (defaultSearch) {
    input.value = defaultSearch
    runFilter()
  } else {
    updateStatus()
  }
  setTimeout(() => {
    attributeFilter(
      sounds,
      '#book-filter',
      s => s.episode.book,
      s => 'Livre ' + fakeDecimalToRoman(parseInt(s)),
      s => s.episode.number,
    )
  }, 0)
  setTimeout(() => {
    attributeFilter(sounds, '#character-filter', s => s.character)
  }, 0)
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
  filter.addEventListener('click', () => {
    resetSearch()
    replaceList(list)
    updateStatus()
  })
}

enum DisplayState {
  hide = 'none',
  show = 'inline-block',
}

interface FilterString {
  value: string
}

// Active search scope, driven by the visible scope chips. Empty string means
// "search every field"; otherwise it is a single-letter prefix (c, q, t, b, n)
// understood by `filterBuilder`.
let activeScope = ''

// Wire the scope chips: clicking one restricts the search to a single field,
// updates its example placeholder, and re-runs the current query.
function initScopeChips(input: HTMLInputElement, runFilter: () => void) {
  const chips = Array.from(
    document.querySelectorAll<HTMLButtonElement>('#search-scopes .scope-btn'),
  )
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      activeScope = chip.dataset.scope ?? ''
      for (const other of chips) {
        other.classList.toggle('is-active', other === chip)
        other.setAttribute('aria-pressed', String(other === chip))
      }
      const placeholder = chip.dataset.placeholder
      if (placeholder) {
        input.placeholder = placeholder
      }
      runFilter()
      input.focus()
    })
  }
}

function filterOnKeyUp(input: FilterString) {
  const buildFilter = filterBuilder({})
  return () => {
    const list = Array.from(document.querySelectorAll('li'))
    const filter = buildFilter(normalizeDiacritics(scopedQuery(input.value)))
    for (const node of list) {
      node.style.display = DisplayState.show
      if (!filter(node)) {
        node.style.display = DisplayState.hide
      }
    }
    updateStatus()
    toggleClearButton(input.value)
  }
}

// Combine the free-text query with the active scope so the search engine (which
// keys off a leading `x:` prefix) restricts matching to the chosen field.
function scopedQuery(value: string): string {
  if (activeScope === '' || value.length === 0) {
    return value
  }
  return `${activeScope}:${value}`
}

// Reflect the outcome of the current filter in a live-updating status line so
// users know how many replies match and get a clear message when none do.
export function updateStatus() {
  const status = document.querySelector<HTMLElement>('#filter-status')
  if (!status) return
  const items = Array.from(document.querySelectorAll('li'))
  const total = items.length
  const visible = items.filter(li => li.style.display !== DisplayState.hide)
    .length
  const query = currentQuery()
  if (query.length === 0) {
    status.textContent = `${total} ${plural(total, 'réplique')}`
  } else if (visible === 0) {
    status.textContent = `Aucune réplique trouvée pour « ${query} »`
  } else {
    const word = plural(visible, 'réplique')
    status.textContent = `${visible} ${word} sur ${total}`
  }
}

function currentQuery(): string {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  return input ? input.value.trim() : ''
}

// Clear the text search so a freshly built (grouped or reset) list is not shown
// alongside a stale query in the search box.
export function resetSearch() {
  const input = document.querySelector<HTMLInputElement>('input#searchbox')
  if (input) {
    input.value = ''
  }
  activeScope = ''
  const chips = Array.from(
    document.querySelectorAll<HTMLButtonElement>('#search-scopes .scope-btn'),
  )
  for (const chip of chips) {
    const isAll = (chip.dataset.scope ?? '') === ''
    chip.classList.toggle('is-active', isAll)
    chip.setAttribute('aria-pressed', String(isAll))
    if (isAll && chip.dataset.placeholder && input) {
      input.placeholder = chip.dataset.placeholder
    }
  }
  toggleClearButton('')
}

function toggleClearButton(value: string) {
  const clear = document.querySelector<HTMLButtonElement>('#clear-search')
  if (clear) {
    clear.hidden = value.length === 0
  }
}

function plural(n: number, word: string): string {
  return n > 1 ? `${word}s` : word
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
