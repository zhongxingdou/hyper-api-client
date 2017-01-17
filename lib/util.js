export function clone (o) {
  if (typeof o === 'object') {
    if (Array.isArray(o)) {
      return o.map(item => clone(item))
    }

    let o2 = {}
    for (let k in o) {
      o2[k] = clone(o[k])
    }
    return o2
  }
  return o
}
