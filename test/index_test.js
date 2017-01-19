import sinon from 'sinon'
import chai from 'chai'
let assert = chai.assert

import Client from '../'

describe('hyper-api-client', () => {
  const ACTION_NAME = 'getUserByName'
  let action, schema, response

  function setResponse (val) {
    response = val
  }

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

  let compile = function () {
    return validate
  }
  Client.compile = compile

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

  Client.request = request

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
      }, 'Cannot assign to read only property \'' + ACTION_NAME + '\' of object \'#<Object>\'')
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
    it('should validateParameters(val) normal', () => {
      let parameters = {
        user: {
          name: 'hal.zhong'
        }
      }

      action.validateParameters(parameters)

      sinon.assert.calledWith(validate, parameters)
    })

    it('should validateParameters(path, value) normal', () => {
      let path =  '.user.name'
      let name = 'hal.zhong'

      action.validateParameters(path, name)

      let ref = schema.href + '/parameters#/properties/user/properties/name'
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

      sinon.assert.calledWith(validate, parameters)
      sinon.assert.calledWith(validate, res)
    })
  })
})
