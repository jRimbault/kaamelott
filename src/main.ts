import { buildListItem } from 'button'
import { createNode } from 'dom'
import { initFilter } from 'filter'
import { Sound } from 'sounds'
import { localeSortBy } from 'utils'

async function main() {
  const sounds = await (await fetch<Sound[]>('sounds/sounds.json')).json()
  const list = buildHtmlList(sounds.sort(localeSortBy(s => s.title)))
  document.body.appendChild(list)
  initFilter()
}

function buildHtmlList(sounds: readonly Sound[]) {
  return createNode('div', {
    id: 'list',
    children: [createNode('ul', { children: sounds.map(buildListItem) })],
  })
}

window.onload = () => main()
