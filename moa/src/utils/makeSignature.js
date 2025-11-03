export default function makeSignature(obj) {
  const keys = Object.keys(obj).sort()
  return JSON.stringify(obj, keys)
}
