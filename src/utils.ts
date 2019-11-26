export function localeSortBy<T>(selector: (value: T) => string) {
  return (a: T, b: T) => {
    return selector(a).localeCompare(selector(b))
  }
}

export function normalizeDiacritics(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}
