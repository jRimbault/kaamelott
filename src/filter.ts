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
  // tooltip. Expose them as a scope menu instead.
  initScopeChips(input, runFilter)
  // The grouping actions (by character, by book, reset to A-Z) live in their
  // own menu so they close together once one of them is picked.
  groupMenu = initDropdown('#group-toggle', '#group-menu')
  if (groupMenu) {
    const menu = groupMenu.menu
    menu.addEventListener('click', $event => {
      if ($event.target instanceof HTMLButtonElement && groupMenu) {
        groupMenu.close()
      }
    })
  }
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

interface Dropdown {
  readonly toggle: HTMLButtonElement
  readonly menu: HTMLElement
  close(): void
}

// Reference to the grouping menu so `resetSearch` can close it alongside the
// scope menu (the A-Z reset button itself lives inside this menu).
let groupMenu: Dropdown | undefined

// Wire a toggle button to a dropdown panel: click to open/close, click
// outside to close, and Escape to close without falling through to the
// global Escape shortcut (which would otherwise reset the whole search).
function initDropdown(
  toggleSelector: string,
  menuSelector: string,
): Dropdown | undefined {
  const toggle = document.querySelector<HTMLButtonElement>(toggleSelector)
  const menu = document.querySelector<HTMLElement>(menuSelector)
  if (!toggle || !menu) return undefined
  const setOpen = (open: boolean) => {
    menu.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
  }
  toggle.addEventListener('click', () => setOpen(menu.hidden))
  document.addEventListener('click', $event => {
    if (
      !menu.hidden &&
      $event.target instanceof Node &&
      !menu.contains($event.target) &&
      !toggle.contains($event.target)
    ) {
      setOpen(false)
    }
  })
  menu.addEventListener('keydown', $event => {
    if ($event.key === 'Escape' && !menu.hidden) {
      $event.stopPropagation()
      setOpen(false)
      toggle.focus()
    }
  })
  return { toggle, menu, close: () => setOpen(false) }
}

enum DisplayState {
  hide = 'none',
  // Empty string removes the inline override so the stylesheet governs layout
  // (the list is a CSS grid; a hard `inline-block` here would fight it).
  show = '',
}

interface FilterString {
  value: string
}

// Active search scope, driven by the scope menu. Empty string means "search
// every field"; otherwise it is a single-letter prefix (c, q, t, b, n)
// understood by `filterBuilder`.
let activeScope = ''

// Reference to the scope menu so `resetSearch` can close it.
let scopeMenu: Dropdown | undefined

// Wire the scope menu: the toggle button opens/closes a dropdown of scope
// options; picking one restricts the search to a single field, updates its
// example placeholder and the toggle's label, and re-runs the current query.
function initScopeChips(input: HTMLInputElement, runFilter: () => void) {
  scopeMenu = initDropdown('#scope-toggle', '#search-scopes')
  const chips = Array.from(
    document.querySelectorAll<HTMLButtonElement>('#search-scopes .scope-btn'),
  )
  for (const chip of chips) {
    chip.addEventListener('click', () => {
      activeScope = chip.dataset.scope ?? ''
      for (const other of chips) {
        const isActive = other === chip
        other.classList.toggle('is-active', isActive)
        other.setAttribute('aria-checked', String(isActive))
      }
      const placeholder = chip.dataset.placeholder
      if (placeholder) {
        input.placeholder = placeholder
      }
      updateToggleLabel(scopeMenu, chip.textContent ?? '')
      if (scopeMenu) {
        scopeMenu.close()
      }
      runFilter()
      input.focus()
    })
  }
}

function updateToggleLabel(dropdown: Dropdown | undefined, scopeName: string) {
  if (!dropdown) return
  const label = `Rechercher dans : ${scopeName}`
  dropdown.toggle.title = label
  dropdown.toggle.setAttribute('aria-label', label)
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

// Re-show every reply in the current list. A rebuilt/reused list node can still
// carry the inline `display:none` left by an earlier text filter, so the reset
// and A-Z paths must clear it to actually restore the full list.
export function showAllItems() {
  const items = document.querySelectorAll<HTMLLIElement>('#list li')
  for (const li of Array.from(items)) {
    li.style.display = DisplayState.show
  }
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
    chip.setAttribute('aria-checked', String(isAll))
    if (isAll) {
      updateToggleLabel(scopeMenu, chip.textContent ?? '')
      if (chip.dataset.placeholder && input) {
        input.placeholder = chip.dataset.placeholder
      }
    }
  }
  if (scopeMenu) {
    scopeMenu.close()
  }
  if (groupMenu) {
    groupMenu.close()
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
