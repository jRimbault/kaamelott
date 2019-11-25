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

function filterOnKeyUp(input: HTMLInputElement, list: readonly HTMLLIElement[]) {
  const buildFilter = filterBuilder({});
  return () => {
    const filter = buildFilter(normalizeDiacritics(input.value))
    for (const node of list) {
      node.style.display = 'inline-block'
      if (!filter(node)) {
        node.style.display = 'none'
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
      const title = node.getAttribute('data-title')
      const character = node.getAttribute('data-character')
      const episode = node.getAttribute('data-episode')
      if (!title || !character || !episode) {
        return false
      }
      pattern.lastIndex = 0
      return pattern.test(character) || pattern.test(title) || pattern.test(episode)
    }
  }
}
