export default class Validator {
  constructor () {
    this._ = {
      compiler: null,
      validate: function () {
        throw 'Validator need compiler!'
      }
    }
  }

  addSchema (schema, id) {
    if (!this._.compiler) {
      this._.compiler = Validator.createCompiler()
      this._.validate = this._.compiler.validate.bind(this._.compiler)
    }
    return this._.compiler.addSchema(schema, id)
  }

  validate (refOrId, value) {
    return this._.validate(refOrId, value)
  }

  static createCompiler () {}
}
