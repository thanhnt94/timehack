/**
 * Real-time Web Audio Synthesizer for Focus Soundscapes
 * Rain, Waves, Forest Wind, Deep Focus Binaural
 */

class AmbientSoundEngine {
  private ctx: AudioContext | null = null
  private currentSound: string | null = null
  private activeNodes: { source?: AudioNode; gain?: GainNode; filter?: BiquadFilterNode } = {}

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  stop() {
    try {
      if (this.activeNodes.gain && this.ctx) {
        this.activeNodes.gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5)
      }
      setTimeout(() => {
        if (this.activeNodes.source) {
          (this.activeNodes.source as AudioBufferSourceNode).stop?.()
        }
        this.activeNodes = {}
        this.currentSound = null
      }, 550)
    } catch {
      this.activeNodes = {}
      this.currentSound = null
    }
  }

  play(soundId: 'rain' | 'forest' | 'waves' | 'cafe') {
    const ctx = this.getContext()
    if (!ctx) return

    this.stop()

    setTimeout(() => {
      try {
        const bufferSize = ctx.sampleRate * 2
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = buffer.getChannelData(0)

        // Generate Pink Noise for ambient texture
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          b3 = 0.86650 * b3 + white * 0.3104856
          b4 = 0.55000 * b4 + white * 0.5329522
          b5 = -0.7616 * b5 - white * 0.0168980
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
          output[i] *= 0.11
          b6 = white * 0.115926
        }

        const whiteNoise = ctx.createBufferSource()
        whiteNoise.buffer = buffer
        whiteNoise.loop = true

        const filter = ctx.createBiquadFilter()
        const masterGain = ctx.createGain()

        if (soundId === 'rain') {
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(800, ctx.currentTime)
          masterGain.gain.setValueAtTime(0.08, ctx.currentTime)
        } else if (soundId === 'forest') {
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(450, ctx.currentTime)
          filter.Q.setValueAtTime(1.5, ctx.currentTime)
          masterGain.gain.setValueAtTime(0.06, ctx.currentTime)
        } else if (soundId === 'waves') {
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(300, ctx.currentTime)
          masterGain.gain.setValueAtTime(0.1, ctx.currentTime)
        } else {
          // cafe
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(600, ctx.currentTime)
          masterGain.gain.setValueAtTime(0.05, ctx.currentTime)
        }

        whiteNoise.connect(filter)
        filter.connect(masterGain)
        masterGain.connect(ctx.destination)

        whiteNoise.start()
        this.activeNodes = { source: whiteNoise, gain: masterGain, filter }
        this.currentSound = soundId
      } catch {
        // Ignore audio errors
      }
    }, 100)
  }

  getCurrentSound() {
    return this.currentSound
  }
}

export const ambientSound = new AmbientSoundEngine()
