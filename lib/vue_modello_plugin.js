import { getObjByPath, setObjByPath, fstLetterToUpper } from './util'
import { HyperApiClientParametersInvalid, HyperApiClientResultInvalid } from './error'

const STATE_PATH = '$state'

function mixApiToModule (api, mod, option) {
  let title = option.actionName || api.title

  // handle option.parameters
  let paraOption = option.parameters || {}
  if (typeof paraOption === 'string') {
    paraOption = {
      valuePath: paraOption
    }
  }

  paraOption = Object.assign({}, {
    validateEnabled: true
  }, paraOption)

  let paraValPath = paraOption.valuePath
  let paraValPathType = typeof paraValPath
  let paraValPathIsObj = paraValPathType === 'object'
  let paraValPathIsString = !paraValPathIsObj && paraValPathType === 'string'

  if (!paraOption.set && paraValPath) {
    paraOption.set = function (state, val) {
      if (paraValPathIsObj) {
        for (let prop in paraValPath) {
          setObjByPath(state, paraValPath[prop], val[prop])
        }
      } else {
        if (paraValPath === STATE_PATH) {
          Object.assign(state, val)
        } else {
          setObjByPath(state, paraValPath, val)
        }
      }
    }
  }

  if (!paraOption.get && paraValPath) {
    paraOption.get = function (state) {
      if (paraValPathIsObj) {
        let parameters = {}
        for (let prop in paraValPath) {
          parameters[prop] = getObjByPath(state, paraValPath[prop])
        }
        return parameters
      } else {
        if (paraValPath === STATE_PATH) {
          return state
        } else {
          return getObjByPath(state, paraValPath)
        }
      }
    }
  }

  if (!paraOption.setValidateError && !paraOption.validateErrorPath) {
    if (paraValPath && paraValPathIsString) {
      if (paraValPath !== STATE_PATH) {
        let path = paraValPath.split('.')
        let name = path.pop()
        paraOption.validateErrorPath = path.length ? path.join('.') : '' + 'validateError.' + name
      }
    }
  }

  if (!paraOption.setValidateError && paraOption.validateErrorPath) {
    paraOption.setValidateError = function (state, error, propPath) {
      let errorPath = paraOption.validateErrorPath

      if (propPath) {
        let allError = getObjByPath(state, errorPath)

        // clear descendants error
        Object.keys(allError).filter(k => k.startsWith(propPath)).forEach(k => {
          delete allError[k]
        })

        Object.assign(allError, error)

        Object.keys(error).forEach(key => {
          if (!error[key]) {
            delete allError[key]
          }
        })

        setObjByPath(state, errorPath, {...allError})
      } else {
        setObjByPath(state, errorPath, error)
      }
    }
  }

  if (paraValPath && !paraOption.hasOwnProperty('copyDefault')) {
    paraOption.copyDefault = true
  }

  // handle option.result
  let resOption = option.result || {}
  if (typeof resOption === 'string') {
    resOption = {
      valuePath: resOption
    }
  }

  let resValPath = resOption.valuePath
  let resValPathType = typeof resValPath
  let resValPathIsObj = resValPath && resValPathType === 'object'
  let resValPathIsString = !resValPathIsObj && resValPathType === 'string'

  if (!resOption.set && resValPath) {
    resOption.set = function (state, val) {
      if (resValPathIsObj) {
        for (let prop in resValPath) {
          setObjByPath(state, resValPath[prop], val[prop])
        }
      } else {
        if (resValPath === STATE_PATH) {
          Object.assign(state, val)
        } else {
          setObjByPath(state, resValPath, val)
        }
      }
    }
  }

  if (!resOption.setValidateError && !resOption.validateErrorPath) {
    if (resValPath && resValPathIsString) {
      if (resValPath !== STATE_PATH) {
        let path = resValPath.split('.')
        let name = path.pop()
        resOption.validateErrorPath = path.length ? path.join('.') : '' + 'validateError.' + name
      }
    }
  }

  if (!resOption.setValidateError && resOption.validateErrorPath) {
    resOption.setValidateError = function (state, error, propPath) {
      let errorPath = resOption.validateErrorPath

      if (propPath) {
        let allError = getObjByPath(state, errorPath)
        if (allError) {
          if (error && error.length) {
            allError[propPath] = error
          } else {
            delete allError[propPath]
          }
        }
        setObjByPath(state, errorPath, {...allError})
      } else {
        setObjByPath(state, errorPath, error)
      }
    }
  }

  if (resValPath && !resOption.hasOwnProperty('copyDefault')) {
    resOption.copyDefault = true
  }

  const UP_TITLE = fstLetterToUpper(title)
  const VALI_PARA = 'validateParametersFor' + UP_TITLE
  const VALI_RES = 'validateResultFor' + UP_TITLE

  const U_PARA_ERROR = 'updateParametersErrorFor' + UP_TITLE
  const U_PARA_PROP_ERROR = 'updateParametersErrorPropFor' + UP_TITLE
  const U_RES_ERROR = 'updateResultErrorFor' + UP_TITLE
  const U_RES_PROP_ERROR = 'updateResultErrorPropFor' + UP_TITLE

  const U_RES = 'updateResultFor' + UP_TITLE

  if ((paraOption.copyDefault && paraOption.set) || (resOption.copyDefault && resOption.set)) {
    let getModState = mod.state
    mod.state = function state() {
      let modState = getModState()

      if (paraOption.copyDefault && paraOption.set) {
        let parameters = api.getDefaultParameters(modState)
        paraOption.set(modState, parameters)
      }

      if (resOption.copyDefault && resOption.set) {
        let result = api.getDefaultResponse(modState)
        resOption.set(modState, result)
      }

      return modState
    }
  }

  Object.assign(mod.actions, {
    [VALI_PARA] (context, path, val, parameters) {
      let depends = api.getParameterDepends(path)
      let targets = depends ? depends.beDependend.concat(path) : [path]

      api.validateParameters(val, path, parameters).then(() => {
        // clear error
        let error = {}
        targets.forEach(ePath => {
          error[ePath] = null
        })
        context.commit(U_PARA_PROP_ERROR, error, path)
      }).catch(function (error) {
        // filter error
        let targetsError = {}
        targets.forEach(ePath => {
          if (error[ePath]) targetsError[ePath] = error[ePath]
        })

        // copy descendants error
        for(let key in error) {
          if (targets.some(t => key.startsWith(t))) {
            targetsError[key] = error[key]
          }
        }

        context.commit(U_PARA_PROP_ERROR, targetsError, path)
      })
    },
    [VALI_RES] (context, path, val, result) {
      api.validateResponse(val, path, result).then(() => {
        context.commit(U_RES_PROP_ERROR, {}, path)
      }).catch(function (error) {
        context.commit(U_RES_PROP_ERROR, error, path)
      })
    },
    [title] (context, parameters) {
      if (arguments.length === 1 && paraOption.get) {
        parameters = paraOption.get(context.state)
      }

      return api.send(parameters).then(function (result) {
        if (resOption.filter) {
          result = resOption.filter(result)
        }

        if (typeof resOption.set === 'string') {
          context.commit(resOption.set, result)
        } else {
          context.commit(U_RES, result)
        }

        return result
      }).catch(function (error) {
        switch (error.type) {
          case 'parameters':
            context.commit(U_PARA_ERROR, error.error)
            throw new HyperApiClientParametersInvalid(error.error)
          case 'response':
            context.commit(U_RES_ERROR, error.error)
            throw new HyperApiClientResultInvalid(error.error)
          case 'request':
            throw error.error
          default:
            throw error
        }
      })
    }
  })

  const none = function () {}

  Object.assign(mod.mutations, {
    [U_PARA_ERROR]: paraOption.setValidateError || none,
    [U_PARA_PROP_ERROR]: paraOption.setValidateError || none,
    [U_RES_ERROR]: resOption.setValidateError || none,
    [U_RES_PROP_ERROR]: resOption.setValidateError || none,
    [U_RES]: resOption.set || none
  })

  if (!paraValPath || paraOption.validateEnabled === false) return

  if (paraValPathIsString) {
    mod.watch[paraValPath] = {
      handler ({dispatch, state}, val, oldVal, path) {
        let parameters = paraValPath === STATE_PATH
          ? state
          : getObjByPath(state, paraValPath)

        let relativePath = path.relative
        let i = relativePath.indexOf('[')
        if (i >= 0) {
          relativePath = relativePath.substr(0, i)
          let j = path.absolute.indexOf('[')
          val = getObjByPath(state, path.absolute.substr(0, j))
        }

        dispatch(VALI_PARA, relativePath, val, parameters)
      },
      deep: true,
      onlyDescendence: true
    }
  } else {
    for (let schemaPath in paraValPath) {
      let statePath = paraValPath[schemaPath]
      mod.watch[statePath] = {
        handler ({dispatch, state}, val, oldVal, path) {
          let parameters = {}
          for (let prop in paraValPath) {
            parameters[prop] = getObjByPath(state, paraValPath[prop])
          }

          let relativePath = path.relative
          let i = relativePath.indexOf('[')
          if (i >= 0) {
            relativePath = relativePath.substr(0, i)
            let j = path.absolute.indexOf('[')
            val = getObjByPath(state, path.absolute.substr(0, j))
          }

          let validatePath = '.' + schemaPath
          if (relativePath) {
            validatePath += relativePath
          }

          dispatch(VALI_PARA, validatePath, val, parameters)
        },
        deep: true,
        onlyDescendence: true
      }
    }
  }
}

export default {
  install: function (modello, option) {
    let Client = option.client
    modello.on('mixed', function (eachMod) {
      eachMod(function (mod) {
        let hyperApi = mod.hyperApi
        if (!hyperApi) return

        for (let apiKey in hyperApi) {
          let option = hyperApi[apiKey]
          let api = Client[apiKey]
          if (api) {
            mixApiToModule(api, mod, option)
          } else {
            throw new Error('[hyper-api-client] undefined client request method: ' + apiKey)
          }
        }
      }) // eachMod
    }) // mixed
  } // install
}
