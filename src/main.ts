import { buildListItem } from 'layout'
import { createNode } from 'dom'
import { initFilter as initFilters } from 'filter'
import { Sound } from 'sounds'
import { sort } from 'utils'

async function main() {
  const sounds = sort(
    await (await fetch<Sound[]>('sounds/sounds.json')).json(),
    s => s.quote,
  )
  initialList(sounds)
  initFilters(sounds)
  const resetButton =
  document.querySelector<HTMLButtonElement>('button#reset-filter')
  if (!resetButton) return
  resetButton.addEventListener('click', () => initialList(sounds))
}

function initialList(sounds: readonly Sound[]) {
  const list = buildHtmlList(sounds)
  const div = document.querySelector('#list')
  if (!div) return
  div.replaceWith(list)
}

function buildHtmlList(sounds: readonly Sound[]) {
  return createNode('div', {
    id: 'list',
    children: [['ul', { children: sounds.map(buildListItem) }]],
  })
}

window.onload = () => main()
