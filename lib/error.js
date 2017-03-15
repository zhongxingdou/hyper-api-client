export function HyperApiClientParametersInvalid(message) {
  this.name = 'HyperApiClientParametersInvalid'
  this.message = message || 'parameters invalid'
  this.stack = (new Error()).stack
}
HyperApiClientParametersInvalid.prototype = Object.create(Error.prototype)
HyperApiClientParametersInvalid.prototype.constructor = HyperApiClientParametersInvalid

export function HyperApiClientResultInvalid(message) {
  this.name = 'HyperApiClientResultInvalid'
  this.message = message || 'result invalid'
  this.stack = (new Error()).stack
}
HyperApiClientResultInvalid.prototype = Object.create(Error.prototype)
HyperApiClientResultInvalid.prototype.constructor = HyperApiClientResultInvalid
