// A short, soft tone when the microphone is really on. In a call the user
// listens rather than looks, and anything said before it would be lost.
let audio: AudioContext | null = null

export function chime() {
  try {
    audio ??= new AudioContext()
    const now = audio.currentTime
    const tone = audio.createOscillator()
    const volume = audio.createGain()
    tone.frequency.value = 880
    volume.gain.setValueAtTime(0.0001, now)
    volume.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    tone.connect(volume).connect(audio.destination)
    tone.start(now)
    tone.stop(now + 0.2)
  } catch {
    // Without Web Audio the bar still says when to talk.
  }
}
