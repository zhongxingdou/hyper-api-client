import sinon from 'sinon'
import chai from 'chai'
let assert = chai.assert

import HyperApiClient from '../'

describe('hyper-api-client', () => {
  const ACTION_NAME = 'getUserByName'
  let action, schema, response, addSchema, Client

  let validate = function (path, target) {
    return new Promise (function (resolve, reject) {
      if (target === invalidParams) {
        reject(parametersError)
      }

      if (target === invalidResult) {
        reject(resultError)
      }

      resolve()
    })
  }

  validate = sinon.spy(validate)

  let invalidParams = {}
  let invalidResult = {}
  let parametersError = {}
  let resultError = {}

  addSchema = sinon.spy()

  let compiler = function () {
    return {
      addSchema,
      validate
    }
  }
  HyperApiClient.compiler = compiler

  function setResponse (val) {
    response = val
  }

  let request = function () {
    return  new Promise (function (resolve) {
      resolve(response)
    })
  }

  request = sinon.spy(request)

  Client = HyperApiClient.createClient({
    doRequest: request
  })

  before(function () {
    schema = {
      title: ACTION_NAME,
      description: '根据用户名称获取用户',
      method: 'post',
      href: '/domain.com/api',
      definitions: {
        code: {
          type: 'number'
        },
        result: {
          type: 'object'
        }
      },
      schema: {
        properties: {
          user: {
            properties: {
              name: {
                type: 'string'
              },
              gender: {
                type: 'boolean',
                default: true
              },
              interest: {
                type: 'array',
                items: {
                  type: 'string'
                },
                default: ['singing', 'fishing']
              }
            }
          }
        }
      },
      targetSchema: {
        properties: {
          code: {
            $ref: '#/definitions/code'
          },
          msg: {
            type: 'string'
          },
          result: {
            $ref: '#/definitions/result'
          }
        }
      }
    }

    Client.addSchema(schema)

    action = Client[ACTION_NAME]
  })

  afterEach(function () {
    validate.reset()
    request.reset()
  })

  describe('addSchema(hyperSchema)', () => {
    it('should generate action normal', () => {
      assert.isObject(action)

      assert.isFunction(action.send)

      assert.isFunction(action.getDefaultParameters)
      assert.isFunction(action.getDefaultResponse)

      assert.isFunction(action.validateParameters)
      assert.isFunction(action.validateResponse)

      assert.equal(action.title, schema.title)
      assert.equal(action.method, schema.method)
      assert.equal(action.url, schema.href)
      assert.equal(action.description, schema.description)

      assert.throws(function () {
        Client[ACTION_NAME] = null
      }, 'Cannot assign to read only property \'' + ACTION_NAME + '\' of object \'#<Client>\'')
    })

    it('should getDefaultParameters() normal', () => {
      let parameters = action.getDefaultParameters()
      assert.equal(parameters.user.name, '')
      assert.equal(parameters.user.gender, true)

      let interest = ['singing', 'fishing']
      assert.equal(parameters.user.interest[0], interest[0])
      assert.equal(parameters.user.interest[1], interest[1])
    })

    it('should getDefaultResponse() normal', () => {
      let response = action.getDefaultResponse()
      assert.equal(response.code, 0)
      assert.equal(response.msg, '')
      assert.isObject(response.result)
    })
  })

  describe('validate', () => {
    it('should validateParameters(val) with whole parameter normal', () => {
      let parameters = {
        user: {
          name: 'hal.zhong'
        }
      }

      action.validateParameters(parameters)

      sinon.assert.calledWithMatch(validate, schema.href + '#/schema', parameters)
    })

    it('should validateParameters(ref, value) with member of parameter normal', () => {
      let path =  '.user.name'
      let name = 'hal.zhong'

      action.validateParameters(name, path)

      let ref = schema.href + '#/schema/properties/user/properties/name'
      sinon.assert.calledWith(validate, ref, name)
    })
  })

  describe('send() request', () => {
    it ('normal', (done) => {
      let parameters = {user: {name: 'hal.zhong'}}
      let res = {code: 200}
      setResponse(res)

      action.send(parameters).then(() => {
        sinon.assert.calledWithMatch(request, {
          url: schema.href,
          method: schema.method,
          data: parameters
        })

        sinon.assert.calledWith(validate, schema.href + '#/schema', parameters)
        sinon.assert.calledWith(validate, schema.href + '#/targetSchema', res)
        done()
      })
    })

    it('with option.disableParameterValidate', (done) => {
       let parameters = {user: {name: false}}
      let res = {code: 200}
      setResponse(res)

      action.send(parameters, {
        disableParameterValidate: true
      }).then(() => {
        sinon.assert.calledWith(validate, schema.href + '#/targetSchema', res)
        sinon.assert.calledOnce(validate)
        done()
      })
    })

    it('with option.disableResultValidate', () => {
      let parameters = {user: {name: 'hal.zhong'}}
      let res = {code: 200}
      setResponse(res)

      action.send(parameters, {
        disableResultValidate: true
      })

      sinon.assert.calledWith(validate, schema.href + '#/schema', parameters)
      sinon.assert.calledOnce(validate)
    })

    it('with option.suppressParametersInvalidError', (done) => {
      let res = {code: 200}
      setResponse(res)

      action.send(invalidParams, {
        suppressParametersInvalidError: true
      }).then((result) => {
        assert.equal(result, res)
        done()
      })
    })

    it('with option.suppressResultInvalidError', (done) => {
      let parameters = {user: {name: 'hal.zhong'}}
      let res = invalidResult
      setResponse(res)

      action.send(parameters, {
        suppressResultInvalidError: true
      }).then((result) => {
        assert.equal(result, res)
        done()
      })
    })

    it('throw error if parameters invalid', (done) => {
      let res = {code: 200}
      setResponse(res)

      action.send(invalidParams).then(function() {}, (error) => {
        assert.equal(error.error, parametersError)
        done()
      })
    })

    it('throw error if result invalid', (done) => {
      let parameters = {user: {name: 'hal.zhong'}}
      let res = invalidResult
      setResponse(res)

      action.send(parameters).then(function() {}, (error) => {
        assert.equal(error.error, resultError)
        done()
      })
    })
  })
})
