import sinon from 'sinon'
import chai from 'chai'
let assert = chai.assert

import HyperApiClient from '../'

describe('hyper-api-client', () => {
  const ACTION_NAME = 'getUserByName'
  let action, schema, response, addSchema, Client

  let validate = function () {
    return {
      then: function (succeedCb) {
        succeedCb()
      },
      catch: function () {
      }
    }
  }
  validate = sinon.spy(validate)

  addSchema = sinon.spy()

  let compiler = function () {
    return {
      addSchema,
      validate
    }
  }

  function setResponse (val) {
    response = val
  }

  let request = function () {
    return {
      then: function (succeedCb) {
        succeedCb(response)
        return {
          catch () {}
        }
      },
      catch: function () {
      }
    }
  }

  request = sinon.spy(request)

  Client = HyperApiClient.createClient({
    doRequest: request
  })
  HyperApiClient.compiler = compiler

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

      action.validateParameters(path, name)

      let ref = schema.href + '#/schema/properties/user/properties/name'
      sinon.assert.calledWith(validate, ref, name)
    })
  })

  describe('send request', () => {
    it ('send() normal', () => {
      let parameters = {user: {name: 'hal.zhong'}}
      let res = {code: 200}
      setResponse(res)

      action.send(parameters)

      sinon.assert.calledWithMatch(request, {
        url: schema.href,
        method: schema.method,
        data: parameters
      })

      sinon.assert.calledWith(validate, schema.href + '#/schema', parameters)
      sinon.assert.calledWith(validate, schema.href + '#/targetSchema', res)
    })
  })
})
