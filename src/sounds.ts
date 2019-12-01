export interface Sound {
  readonly character: string
  readonly episode: {
    readonly book: number
    readonly number: number
    readonly title: string
  }
  readonly file: string
  readonly quote: string
}

export function fakeDecimalToRoman(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI'][n - 1]
}

export function getEpisode(sound: Sound): string {
  return `Livre ${fakeDecimalToRoman(sound.episode.book)}, ${
    sound.episode.number
  } - ${sound.episode.title}`
}
