import APIAction from './action'
import { collectDefault } from './schema_resolve'
import Validator from './validator'

function makeValidator (id, schema) {
  schema.id = id
  let a = new Validator(schema)
  return a.validate.bind(a)
}

export default {
  set compile (val) {
    Validator.compile = val
  },

  set request (val) {
    APIAction.doRequest = val
  },

  addSchema (hyperSchema, request) {
    let apiOption = {
      description: hyperSchema.description,
      title: hyperSchema.title,
      href: hyperSchema.href,
      method: hyperSchema.method
    }

    let { schema, definitions, targetSchema } = hyperSchema

    apiOption.validateParameters = makeValidator(hyperSchema.href + '/parameters', {
      definitions: definitions,
      ...schema
    })

    apiOption.validateResponse = makeValidator(hyperSchema.href + '/response', {
      definitions: definitions,
      ...targetSchema
    })

    apiOption.defaultParameters = collectDefault(schema, definitions)

    apiOption.defaultResponse = collectDefault(targetSchema, definitions)

    apiOption.doRequest = request

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
