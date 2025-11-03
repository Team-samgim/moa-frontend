export default function pickWithout(obj, dropKey) {
  return Object.fromEntries(Object.entries(obj || {}).filter(([k]) => k !== dropKey))
}
