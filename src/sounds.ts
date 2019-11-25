export type Sound = {
  readonly character: string
  readonly episode: string
  readonly file: string
  readonly title: string
}

export enum AttrData {
  episode = 'data-episode',
  character = 'data-character',
  title = 'data-title',
}
