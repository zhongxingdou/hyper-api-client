import APIAction from './action'
import { collectDefault } from './schema_resolve'
import Validator from './validator'

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
    let id = hyperSchema.id = hyperSchema.href

    validator.addSchema(hyperSchema)

    let apiOption = {
      description: hyperSchema.description,
      title: hyperSchema.title,
      href: hyperSchema.href,
      method: hyperSchema.method
    }

    let { schema, definitions, targetSchema } = hyperSchema

    function validateByRef(base, val, ref) {
      if (!ref) ref = ''
      if (ref) {
        ref = ref.replace(/\./g, '/properties/')
      }
      return validator.validate(base + ref, val)
    }

    apiOption.validateParameters = function (...args) {
      let base = id + '#/schema'
      return validateByRef(base, ...args)
    }

    apiOption.validateResponse = function (...args) {
      let base = id + '#/targetSchema'
      return validateByRef(base, ...args)
    }

    apiOption.defaultParameters = collectDefault(schema, definitions)

    apiOption.defaultResponse = collectDefault(targetSchema, definitions)

    apiOption.doRequest = this._.doRequest || clazz.doRequest

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
