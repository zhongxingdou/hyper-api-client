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

export function createPathIfNone (obj, path) {
  let names = path.split('.')
  let firstName = names.shift()
  let member = obj[firstName]
  if (!member) member = obj[firstName] = {}
  if (names.length) {
    return createPathIfNone(member, names.join('.'))
  }
  return member
}

export function setObjByPath (obj, path, val, createPath) {
  let names = path.split('.')
  let lastName = names.pop()
  let parent = obj

  if (names.length) {
    let parentPath = names.join('.')
    parent = createPath === true
      ? createPathIfNone(obj, parentPath)
      : getObjByPath(obj, parentPath)
  }

  if (parent) {
    parent[lastName] = val
  }
}

export function fstLetterToUpper (str) {
  return str[0].toUpperCase() + str.slice(1)
}

export function jsonPointerToRef (pointer) {
  return pointer.replace(/\//g, '/properties/')
}

export function jsonPointerToObjPath (pointer) {
  return pointer.replace(/\//g, '.')
}

export function refToObjectPath (ref) {
  return ref.replace(/\/properties\//g, '.')
}

function addDepends (map, ref, dependsOnPointer) {
  let dependsOnPath = jsonPointerToObjPath(dependsOnPointer)
  let refPath = refToObjectPath(ref)

  if (!map[refPath]) {
    map[refPath] = {
      dependsOn: [],
      beDependend: []
    }
  }
  map[refPath].dependsOn.push(dependsOnPath)

  if (!map[dependsOnPath]) {
    map[dependsOnPath] = {
      dependsOn: [],
      beDependend: []
    }
  }
  map[dependsOnPath].beDependend.push(refPath)
}

function collectArrayDepends (array, ref, map) {
  array.forEach(val => {
    if (Array.isArray(val)) {
      collectArrayDepends(val, ref, map)
    } else if (typeof val === 'object') {
      collectObjectDepends(val, ref, map)
    }
  })
}

function collectObjectDepends (obj, ref, map) {
  for (let prop in obj) {
    let val = obj[prop]

    if (!val) continue

    if (prop === '$data') {
      addDepends(map, ref, val)
      continue
    }

    if (Array.isArray(val)) {
      collectArrayDepends(val, ref, map)
    } else if (typeof val === 'object') {
      collectObjectDepends(val, ref, map)
    }
  }
}

function findDependsOn (map, path, ret) {
  let dependsOn = map[path] && map[path].dependsOn
  if (dependsOn) {
    dependsOn.forEach(depsPath => {
      if (!ret.includes(depsPath)) {
        ret.push(depsPath)
      }
      findDependsOn(map, depsPath, ret)
    })
  }
}

export function findDeepDepends (path, map) {
  if (!map[path]) return []

  let { dependsOn, beDependend } = map[path]
  let ret = [path].concat(dependsOn).concat(beDependend)

  findDependsOn(map, path, ret)

  beDependend.forEach(beDepsPath => {
    findDependsOn(map, beDepsPath, ret)
  })

  return ret
}

export function collectDepends (schema, baseRef='', dependsMap={}) {
  let props = schema.properties

  baseRef += '/properties'

  for(let prop in props) {
    let ref = baseRef + '/' + prop
    let option = props[prop]

    for(let key in option) {
      let val = option[key]

      if (!val) continue

      if (key === 'properties') {
        collectDepends(option, ref, dependsMap)
        continue
      }

      if (Array.isArray(val)) {
        collectArrayDepends(val, ref, dependsMap)
      } else if (typeof val === 'object') {
        if (val.$data) {
          addDepends(dependsMap, ref, val.$data)
        } else {
          collectObjectDepends(val, ref, dependsMap)
        }
      }
    }
  }

  return dependsMap
}

export function copyByPathes (src, pathes) {
  let ret = {}
  const createPath = true

  pathes.forEach(path => {
    if (path.startsWith('.')) path = path.substr(1)
    let val = getObjByPath(src, path)
    if (val !== undefined) {
      setObjByPath(ret, path, val, createPath)
    }
  })

  return ret
}
