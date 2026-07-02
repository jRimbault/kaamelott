// Imperative shell for audio playback.
//
// A soundboard should only ever play one clip at a time: starting a new sound
// stops the previous one, and clicking the sound that is already playing stops
// it. The currently playing button carries a `playing` class so the UI can show
// a stop icon. All mutable audio state is confined to this module.

interface Playing {
  readonly audio: HTMLAudioElement
  readonly button: HTMLElement
}

let current: Playing | undefined

/**
 * Toggle playback for `file`, using `button` to reflect the playing state.
 *
 * - If `button` is already the one playing, playback stops.
 * - Otherwise any current sound is stopped and the new one starts.
 */
export function togglePlay(file: string, button: HTMLElement): void {
  if (current && current.button === button) {
    stop()
    return
  }
  stop()
  const audio = new Audio(`sounds/${file}`)
  const done = () => release(button)
  audio.addEventListener('ended', done)
  audio.addEventListener('error', done)
  current = { audio, button }
  markPlaying(button)
  audio.play().catch(done)
}

/**
 * Stop any clip currently playing and clear its button state. Safe to call when
 * nothing is playing. Used by the reset flow and the `Esc` keyboard shortcut.
 */
export function stopPlayback(): void {
  stop()
}

function stop(): void {
  if (!current) return
  current.audio.pause()
  markStopped(current.button)
  current = undefined
}

// Clear the playing state for a button once its clip ends or fails, without
// disturbing a different sound the user may have started in the meantime.
function release(button: HTMLElement): void {
  markStopped(button)
  if (current && current.button === button) {
    current = undefined
  }
}

// Reflect the playing state on the button: the CSS shows a stop icon, the
// tooltip explains that clicking again stops playback, and aria-pressed exposes
// the toggle state to assistive technology.
function markPlaying(button: HTMLElement): void {
  button.classList.add('playing')
  button.setAttribute('aria-pressed', 'true')
  const stopTitle = button.getAttribute('data-stop-title')
  if (stopTitle) {
    button.setAttribute('title', stopTitle)
  }
}

function markStopped(button: HTMLElement): void {
  button.classList.remove('playing')
  button.setAttribute('aria-pressed', 'false')
  const playTitle = button.getAttribute('data-play-title')
  if (playTitle) {
    button.setAttribute('title', playTitle)
  }
}
