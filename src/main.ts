import { initFilters, resetSearch, showAllItems, updateStatus } from './filter'
import { buildHtmlList, replaceList } from './layout'
import { stopPlayback } from './player'
import { Sound } from './sounds'
import { sort } from './utils'

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
  const resetAll = () => {
    resetSearch()
    replaceList(defaultList)
    showAllItems()
    updateStatus()
  }
  resetButton.addEventListener('click', resetAll)
  initKeyboardShortcuts(resetAll)
}

// Desktop power-user shortcuts:
//   /      focus the search box (unless already typing in a field)
//   Escape stop playback if a clip is playing, otherwise clear the search
function initKeyboardShortcuts(resetAll: () => void) {
  const searchbox = document.querySelector<HTMLInputElement>('input#searchbox')
  document.addEventListener('keydown', $event => {
    if ($event.key === '/' && !isTypingTarget($event.target)) {
      $event.preventDefault()
      if (searchbox) searchbox.focus()
      return
    }
    if ($event.key === 'Escape') {
      if (document.querySelector('.btn-play.playing')) {
        stopPlayback()
      } else {
        resetAll()
        if (searchbox) searchbox.blur()
      }
    }
  })
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  )
}

window.onload = () => main()
