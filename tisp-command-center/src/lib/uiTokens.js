const TONE_CLASSES = {
  primary: {
    bg: 'bg-primary',
    bg5: 'bg-primary/5',
    bg10: 'bg-primary/10',
    bg20: 'bg-primary/20',
    border20: 'border-primary/20',
    border30: 'border-primary/30',
    border50: 'border-primary/50',
    text: 'text-primary',
  },
  'accent-blue': {
    bg: 'bg-accent-blue',
    bg5: 'bg-accent-blue/5',
    bg10: 'bg-accent-blue/10',
    bg20: 'bg-accent-blue/20',
    border20: 'border-accent-blue/20',
    border30: 'border-accent-blue/30',
    border50: 'border-accent-blue/50',
    text: 'text-accent-blue',
  },
  'accent-purple': {
    bg: 'bg-accent-purple',
    bg5: 'bg-accent-purple/5',
    bg10: 'bg-accent-purple/10',
    bg20: 'bg-accent-purple/20',
    border20: 'border-accent-purple/20',
    border30: 'border-accent-purple/30',
    border50: 'border-accent-purple/50',
    text: 'text-accent-purple',
  },
  'accent-green': {
    bg: 'bg-accent-green',
    bg5: 'bg-accent-green/5',
    bg10: 'bg-accent-green/10',
    bg20: 'bg-accent-green/20',
    border20: 'border-accent-green/20',
    border30: 'border-accent-green/30',
    border50: 'border-accent-green/50',
    text: 'text-accent-green',
  },
  'accent-rose': {
    bg: 'bg-accent-rose',
    bg5: 'bg-accent-rose/5',
    bg10: 'bg-accent-rose/10',
    bg20: 'bg-accent-rose/20',
    border20: 'border-accent-rose/20',
    border30: 'border-accent-rose/30',
    border50: 'border-accent-rose/50',
    text: 'text-accent-rose',
  },
  muted: {
    bg: 'bg-on-surface/30',
    bg5: 'bg-on-surface/5',
    bg10: 'bg-on-surface/10',
    bg20: 'bg-on-surface/20',
    border20: 'border-on-surface/20',
    border30: 'border-on-surface/30',
    border50: 'border-on-surface/50',
    text: 'text-on-surface/30',
  },
}

export const tone = (name = 'primary') => TONE_CLASSES[name] ?? TONE_CLASSES.primary

export const deterministicNumber = (seed, min = 0, max = 1) => {
  let hash = 2166136261
  const source = String(seed)

  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  const normalized = (hash >>> 0) / 4294967295
  return min + normalized * (max - min)
}

export const deterministicInt = (seed, min, max) =>
  Math.floor(deterministicNumber(seed, min, max + 1))

export const deterministicCode = (seed, length) => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return Array.from({ length }, (_, index) => alphabet[deterministicInt(`${seed}:${index}`, 0, alphabet.length - 1)]).join('')
}

export const deterministicSeries = (seed, count, min, max) =>
  Array.from({ length: count }, (_, index) => deterministicInt(`${seed}:${index}`, min, max))

export const deterministicPoints = (seed, count, ranges) =>
  Array.from({ length: count }, (_, index) => ({
    id: deterministicCode(`${seed}:id:${index}`, 5),
    top: deterministicNumber(`${seed}:top:${index}`, ranges.top[0], ranges.top[1]),
    left: deterministicNumber(`${seed}:left:${index}`, ranges.left[0], ranges.left[1]),
    traffic: deterministicInt(`${seed}:traffic:${index}`, ranges.traffic?.[0] ?? 40, ranges.traffic?.[1] ?? 500),
  }))
