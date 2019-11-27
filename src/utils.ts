type Selector<T> = ((value: T) => string) | ((value: T) => number)

function sortBy<T>(selector: Selector<T>) {
  return (a: T, b: T) => {
    const valueA = selector(a)
    const valueB = selector(b)
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return valueA.localeCompare(valueB)
    }
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      if (valueA < valueB) return -1
      if (valueA > valueB) return 1
      return 0
    }
    throw new TypeError(
      'Selector function should return either a number or a string',
    )
  }
}

export function sort<T>(list: readonly T[]): (selector: Selector<T>) => T[]
export function sort<T>(list: readonly T[], selector: Selector<T>): T[]
export function sort<T>(list: readonly T[], selector?: Selector<T>) {
  if (selector === undefined) {
    return (sel: Selector<T>) => list.concat().sort(sortBy(sel))
  }
  return list.concat().sort(sortBy(selector))
}

export function normalizeDiacritics(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}
