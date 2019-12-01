import { initFilters } from 'filter'
import { initialList } from 'layout'
import { Sound } from 'sounds'
import { sort } from 'utils'

async function main() {
  const sounds = sort(
    await (await fetch<Sound[]>('sounds/sounds.json')).json(),
    s => s.quote,
  )
  initialList(sounds)
  initFilters(sounds)
  const resetButton = document.querySelector<HTMLButtonElement>(
    'button#reset-filter',
  )
  if (!resetButton) return
  resetButton.addEventListener('click', () => initialList(sounds))
}

window.onload = () => main()
