export default class Validator {
  constructor () {
    this._ = {
      compiler: Validator.createCompiler()
    }
  }

  addSchema (schema, id) {
    return this._.compiler.addSchema(schema, id)
  }

  addFormat (format, option) {
    return this._.compiler.addFormat(format, option)
  }

  addKeyword (keyword, option) {
    return this._.compiler.addKeyword(keyword, option)
  }

  validate (refOrId, value) {
    return this._.compiler.validate(refOrId, value)
  }

  static createCompiler () {}
}
