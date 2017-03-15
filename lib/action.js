import { clone } from './util'

export default class Action {
  constructor (option) {
    this._ = {
      description: option.description || '',
      title: option.title || '',
      url: option.href,
      method: option.method || 'POST',
      defaultParameters: option.defaultParameters,
      defaultResponse: option.defaultResponse,
      doRequest: option.doRequest,
      schemaDependsMap: option.schemaDependsMap,
      consumes: option.consumes,
      produces: option.produces
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

  getParameterDepends (path) {
    return this._.schemaDependsMap[path]
  }

  send (parameters) {
    let clazz = this.constructor
    let doRequest = this._.doRequest || clazz.doRequest
    return this.validateParameters(parameters).then(() => {
      return doRequest({
        method: this.method,
        url: this.url,
        data: parameters,
        produces: this._.produces,
        consumes: this._.consumes
      }).then(result => {
        return this.validateResponse(result).then(function () {
          return result
        }, error => {
          throw {
            type: 'response',
            error: error
          }
        })
      }, error => {
        throw {
          type: 'request',
          error: error
        }
      })
    }, error => {
      throw {
        type: 'parameters',
        error: error
      }
    })
  }

  static doRequest (/*{ method, url, data }*/) {
    // return fetch(url, {
    //   method,
    //   body: JSON.stringify(data)
    // })
  }
}
