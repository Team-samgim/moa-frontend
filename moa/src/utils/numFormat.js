// 소수점 0 제거: 1.00 -> 1, 1.20 -> 1.2
const trimZeros = (s) =>
  String(s)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')

const isBad = (v) => v === null || Number.isNaN(Number(v)) || !Number.isFinite(Number(v))

export const fmt = {
  number(n) {
    if (isBad(n)) return ''
    const abs = Math.abs(n)
    if (abs >= 1e9) return trimZeros((n / 1e9).toFixed(2)) + 'B'
    if (abs >= 1e6) return trimZeros((n / 1e6).toFixed(2)) + 'M'
    if (abs >= 1e3) return trimZeros((n / 1e3).toFixed(2)) + 'k'
    return Number(n).toLocaleString()
  },

  bytes(b) {
    if (isBad(b)) return ''
    const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let i = 0,
      v = Number(b)
    while (Math.abs(v) >= 1024 && i < u.length - 1) {
      v /= 1024
      i++
    }
    const dp = Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0
    return `${trimZeros(v.toFixed(dp))} ${u[i]}`
  },

  bps(v) {
    if (isBad(v)) return ''
    const u = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps']
    let i = 0,
      x = Number(v)
    while (Math.abs(x) >= 1000 && i < u.length - 1) {
      x /= 1000
      i++
    }
    const dp = Math.abs(x) < 10 ? 2 : Math.abs(x) < 100 ? 1 : 0
    return `${trimZeros(x.toFixed(dp))} ${u[i]}`
  },

  percent(p) {
    if (isBad(p)) return ''
    const v = Math.abs(p) <= 1 ? Number(p) * 100 : Number(p)
    const dp = Math.abs(v) < 10 ? 2 : 1
    const sign = p < 0 && v > 0 ? '-' : ''
    return sign + trimZeros(v.toFixed(dp)) + '%'
  },

  durationNs(ns) {
    if (isBad(ns)) return ''
    const x = Number(ns)
    if (Math.abs(x) < 1e3) return `${Math.trunc(x)} ns`
    if (Math.abs(x) < 1e6) return `${trimZeros((x / 1e3).toFixed(2))} µs`
    if (Math.abs(x) < 1e9) return `${trimZeros((x / 1e6).toFixed(2))} ms`
    const s = x / 1e9
    if (Math.abs(s) < 60) return `${trimZeros(s.toFixed(2))} s`
    const m = Math.trunc(s / 60),
      r = Math.round(Math.abs(s % 60))
    if (Math.abs(m) < 60) return `${m}m ${r}s`
    const h = Math.trunc(m / 60),
      mm = Math.abs(m % 60)
    return `${h}h ${mm}m`
  },

  durationMs(ms) {
    if (isBad(ms)) return ''
    const x = Number(ms)
    if (Math.abs(x) < 1000) {
      const dp = Math.abs(x) < 10 ? 2 : 0
      return `${trimZeros(x.toFixed(dp))} ms`
    }
    const s = x / 1000
    if (Math.abs(s) < 60) return `${trimZeros(s.toFixed(2))} s`
    const m = Math.trunc(s / 60),
      r = Math.round(Math.abs(s % 60))
    if (Math.abs(m) < 60) return `${m}m ${r}s`
    const h = Math.trunc(m / 60),
      mm = Math.abs(m % 60)
    return `${h}h ${mm}m`
  },
}

// ⚠️ 필요시 예외 컬럼(포트/ID/seq/ack 등) 블랙리스트 추가 가능
// const NEVER_FORMAT_AS_UNIT = [/(_port$)/, /(.*_id$)/i, /^(seq|ack)$/i];

export function pickFormatterByField(field) {
  const f = String(field).toLowerCase()
  // if (NEVER_FORMAT_AS_UNIT.some(re => re.test(f))) return fmt.number;

  if (/_bytes$|_size$|_len$/.test(f)) return fmt.bytes
  if (/_bps$|_rate$/.test(f)) return fmt.bps
  if (/_nsec$|_ns$/.test(f)) return fmt.durationNs
  if (/_msec$|_ms$/.test(f)) return fmt.durationMs
  if (/_sec$|_s$/.test(f)) return (v) => fmt.durationMs(Number(v) * 1000)
  if (/_pct$|_percent$|_ratio$/.test(f)) return fmt.percent
  return fmt.number
}

// CommonJS 호환이 필요하면 아래 줄도 추가하세요.
// module.exports = { fmt, pickFormatterByField };
