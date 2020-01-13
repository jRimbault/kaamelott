#!/usr/bin/env node

import fs = require('fs')

function main() {
  fs.readFile('sounds/sounds.json', (_, buffer) => {
    const sounds: readonly Sound[] = JSON.parse(buffer.toString())
    const byCharacter = partition(sounds, s => s.character)
    const counters =
      Object.entries(
        mapObject(byCharacter, sounds => sounds.length)
      ).sort(sortBy(s => s[1]))
    console.log(counters)
  })
}

interface Sound {
  readonly character: string
  readonly episode: {
    readonly book: number
    readonly number: number
    readonly title: string
  }
  readonly file: string
  readonly quote: string
}

function partition<T, K extends string | number>(
  list: readonly T[],
  getKey: (el: T) => K,
) {
  const res = {} as { [k in K]: T[] }
  for (const el of list) {
    const key = getKey(el)
    const target: T[] = res[key] ?? (res[key] = [])
    target.push(el)
  }
  return res
}

function mapObject<K extends string, T, U>(
  record: { [k in K]: T },
  mapper: (value: T) => U,
) {
  const result = {} as { [k in K]: U }
  for (const key in record) {
    result[key] = mapper(record[key])
  }
  return result
}

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

main()
