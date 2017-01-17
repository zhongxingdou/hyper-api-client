import { clone } from './util'

export default class {
  constructor (option) {
    this._ = {
      description: option.description || '',
      title: option.title || '',
      url: option.href,
      method: option.method || 'POST',
      defaultParameters: option.defaultParameters,
      defaultResponse: option.defaultResponse
    }

    this.validateParameters = option.validateParameters
    this.validateResponse = option.validateResponse
  }

  getDefaultParameters () {
    return clone(this._.defaultParameters)
  }

  getDefaultResponse () {
    return clone(this._.defaultResponse)
  }

  get description () {
    return this._.description
  }

  get title () {
    return this._.title
  }

  get url () {
    return this._.url
  }

  get method () {
    return this._.method
  }

  send (parameters) {
    let clazz = this.constructor
    return this.validateParameters(parameters).then(() => {
      return clazz.doRequest({
        method: this.method,
        url: this.url,
        data: parameters
      }).then(this.validateResponse)
    })
  }

  static doRequest (/*{ method, url, data }*/) {
    // return fetch(url, {
    //   method,
    //   body: JSON.stringify(data)
    // })
  }
}
