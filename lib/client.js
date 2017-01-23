import APIAction from './action'
import { collectDefault } from './schema_resolve'

class Validator {
  constructor (schema) {
    this._ = {
      schema: schema,
      validate: null
    }
  }

  validate (path, value) {
    if (!this._.validate) {
      this._.validate = Validator.compile(this._.schema)
    }

    let len = arguments.length
    if (len === 1) {
      value = path
      return this._.validate(value)
    } else if (len >= 2) {
      if (path === '') {
        return this._.validate(value)
      } else {
        let id = this._.schema.id
        let ref = id + '#' + path.replace(/\./g, '/properties/')
        return this._.validate(ref, value)
      }
    }
  }

  static compile () {}
}

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

  addSchema (hyperSchema) {
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
