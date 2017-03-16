import APIAction from './action'
import { collectDefault } from './schema_resolve'
import Validator from './validator'
import { collectDepends, copyByPathes, findDeepDepends } from './util'

export default class Client {
  constructor (option) {
    this._ = {
      validator: new Validator(),
      doRequest: option.doRequest
    }
  }

  static set createCompiler (val) {
    Validator.createCompiler = val
  }

  static set request (val) {
    Client.doRequest = val
  }

  addSchema (hyperSchema) {
    let clazz = this.constructor
    let validator = this._.validator

    hyperSchema = { ...hyperSchema }

    let requrieds = ['definitions', 'schema', 'targetSchema']
    requrieds.forEach(prop => {
      if (!hyperSchema.hasOwnProperty(prop)) {
        hyperSchema[prop] = {}
      }
    })

    let id = hyperSchema.id = hyperSchema.href

    validator.addSchema(hyperSchema)

    let apiOption = {
      description: hyperSchema.description,
      title: hyperSchema.title,
      href: hyperSchema.href,
      method: hyperSchema.method
    }

    let { schema, definitions, targetSchema, consumes, produces} = hyperSchema

    function validateByRef(base, val, ref) {
      if (!ref) ref = ''
      if (ref) {
        ref = ref.replace(/\./g, '/properties/')
      }
      return validator.validate(base + ref, val)
    }

    const schemaDependsMap = collectDepends(schema)
    for(let path in schemaDependsMap) {
      schemaDependsMap[path].deepDepends = findDeepDepends(path, schemaDependsMap)
    }

    apiOption.schemaDependsMap = schemaDependsMap

    // const targetSchemaDependsMap = collectDepends(targetSchema)

    apiOption.validateParameters = function (val, path, parameters) {
      let base = id + '#/schema'
      if (!path) return validateByRef(base, val)

      let depends = schemaDependsMap[path]
      if (!depends) return validateByRef(base, val, path)

      let validTarget = copyByPathes(parameters, depends.deepDepends)
      return validateByRef(base, validTarget)
    }

    apiOption.validateResponse = function (...args) {
      let base = id + '#/targetSchema'
      return validateByRef(base, ...args)
    }

    apiOption.defaultParameters = collectDefault(schema, definitions)

    apiOption.defaultResponse = collectDefault(targetSchema, definitions)

    apiOption.doRequest = this._.doRequest || clazz.doRequest

    apiOption.consumes = consumes
    apiOption.produces = produces

    let action = new APIAction(apiOption)

    // attach action method to client
    if (!(action.title in this)) {
      Object.defineProperty(this, action.title, {
        value: action,
        writable: false,
        configurable: false,
        enumerable: false
      })
    }
  }
}
