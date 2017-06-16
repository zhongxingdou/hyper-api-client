export function HyperApiClientError(name, message) {
  this.name = '[HyperApiClient]' + name
  this.message = message
  this.stack = (new Error()).stack
}
HyperApiClientError.prototype = Object.create(Error.prototype)
HyperApiClientError.prototype.constructor = HyperApiClientError
