import { initFilters } from 'filter'
import { buildHtmlList, replaceList } from 'layout'
import { Sound } from 'sounds'
import { sort } from 'utils'

async function main() {
  const sounds = sort(
    await (await fetch<Sound[]>('sounds/sounds.json')).json(),
    s => s.quote,
  )
  const defaultList = buildHtmlList(sounds)
  replaceList(defaultList)
  initFilters(sounds)
  const resetButton = document.querySelector<HTMLButtonElement>(
    'button#reset-filter',
  )
  if (!resetButton) return
  resetButton.addEventListener('click', () => replaceList(defaultList))
}

window.onload = () => main()
