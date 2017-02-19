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

export function getObjByPath (obj, path) {
  let names = path.split('.')
  let firstName = names.shift()
  let member = obj[firstName]
  if (member && names.length) {
    return getObjByPath(member, names.join('.'))
  }
  return member
}

export function setObjByPath (obj, path, val) {
  let names = path.split('.')
  let lastName = names.pop()
  let parent = names.length ? getObjByPath(obj, names.join('.')) : obj
  if (parent && typeof parent === 'object') {
    parent[lastName] = val
  }
}

export function fstLetterToUpper (str) {
  return str[0].toUpperCase() + str.slice(1)
}
