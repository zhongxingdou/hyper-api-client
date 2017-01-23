export default class Validator {
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
