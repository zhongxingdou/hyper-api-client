import { clone } from './util'
import sendOptionDefaults from './send_option'

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
      produces: option.produces,
      sendOption: option.sendOption
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

  send (parameters, option = {}) {
    option = {
      ...sendOptionDefaults,
      ...this._.sendOption,
      ...option
    }

    let clazz = this.constructor
    let doRequest = this._.doRequest || clazz.doRequest

    let runRequest = (parameters) => {
      return doRequest({
        method: this.method,
        url: this.url,
        data: parameters,
        produces: this._.produces,
        consumes: this._.consumes
      }).then(onRequestDone, onRequestFailed)
    }

    let onRequestDone = (result) => {
      if (option.disableResultValidate) {
        return result
      } else {
        return this.validateResponse(result).then(function () {
          return result
        }, error => {
          error = {
            type: 'response',
            error: error
          }

          if (option.onError) {
            option.onError(error)
          }

          if (option.suppressResultInvalidError) {
            console.error(error.error)
            return result
          } else {
            throw error
          }
        })
      }
    }

    let onRequestFailed = function onRequestFailed (error) {
      error = {
        type: 'request',
        error: error
      }

      if (option.onError) {
        option.onError(error)
      }

      throw error
    }

    if (option.disableParameterValidate) {
      return runRequest(parameters)
    } else {
      return this.validateParameters(parameters).then(() => {
        return runRequest(parameters)
      }, error => {
        error = {
          type: 'parameters',
          error: error
        }

        if (option.onError) {
          option.onError(error)
        }

        if (option.suppressParametersInvalidError) {
          console.error(error.error)
          return runRequest(parameters)
        } else {
          throw error
        }
      })
    }
  }

  static doRequest (/*{ method, url, data }*/) {
    // return fetch(url, {
    //   method,
    //   body: JSON.stringify(data)
    // })
  }
}
