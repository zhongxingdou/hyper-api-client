export function findDefinitionByRef (definitions, ref) {
  if (typeof ref === 'string') {
    let [, tmp] = ref.match(/^#\/definitions\/(.*)/) || []
    ref = tmp.split('/')
  }

  let fstName = ref.shift()
  let result = definitions[fstName]

  // if (result.$ref && fstName !== 'definitions') {
  //   result = findDefinitionByRef(definitions, result.$ref)
  // }

  if (result && ref.length) {
    return findDefinitionByRef(result, ref)
  }

  return result
}

export const TYPE_DEFAULT = {
  'string': '',
  'number': 0,
  'integer': 0,
  'boolean': false,
  array () {
    return []
  },
  object () {
    return {}
  },
  'null': null
}

export function traverseSchema (schema, handler, definitions) {
  definitions = schema.definitions || definitions
  let ref = schema.$ref
  if (ref) {
    schema = findDefinitionByRef(definitions, ref)
  }

  handler(schema)

  let props = schema.properties
  for (let p in props) {
    let subSchema = props[p]
    traverseSchema(subSchema, handler, definitions)
  }
}

export function collectDefault (schema, definitions) {
  let { $ref, type, properties, items } = schema
  if ($ref) {
    schema = findDefinitionByRef(definitions, $ref)
    return collectDefault(schema, definitions)
  }

  if (schema.hasOwnProperty('default')) {
    return schema.default
  }

  if (type && type !== 'object') { // value type, array, null
    let defaultValue = TYPE_DEFAULT[type]

    return typeof defaultValue === 'function'
      ? defaultValue()
      : defaultValue
  }

  if (items) {
    return TYPE_DEFAULT['array']()
  } else if (properties) {
    let result = {}

    for (let pKey in properties) {
      result[pKey] = collectDefault(properties[pKey], definitions)
    }

    return result
  }

  return {}
}
