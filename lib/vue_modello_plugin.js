import { getObjByPath, setObjByPath, fstLetterToUpper } from './util'

function mixApiToModule (api, mod, option) {
  let title = option.actionName || api.title

  // handle option.parameters
  let paraOption = option.parameters || {}
  if (typeof paraOption === 'string') {
    paraOption = {
      valuePath: paraOption
    }
  }

  if (!paraOption.set && paraOption.valuePath) {
    paraOption.set = function (state, val) {
      setObjByPath(state, paraOption.valuePath, val)
    }
  }

  if (!paraOption.get && paraOption.valuePath) {
    paraOption.get = function (state) {
      return getObjByPath(state, paraOption.valuePath)
    }
  }

  if (!paraOption.setValidateError && !paraOption.validateErrorPath) {
    if (paraOption.valuePath) {
      let path = paraOption.valuePath.split('.')
      let name = path.pop()
      paraOption.validateErrorPath = path.join('.') + 'validateError.' + name
    }
  }

  if (!paraOption.setValidateError && paraOption.validateErrorPath) {
    paraOption.setValidateError = function (state, error, propPath) {
      if (propPath) {
        let allError = getObjByPath(state, paraOption.validateErrorPath)
        Object.assign(allError, error)

        Object.keys(error).forEach(key => {
          if (!error[key]) {
            delete allError[key]
          }
        })

        setObjByPath(state, paraOption.validateErrorPath, {...allError})
      } else {
        setObjByPath(state, paraOption.validateErrorPath, error)
      }
    }
  }

  if (paraOption.valuePath && !paraOption.hasOwnProperty('copyDefault')) {
    paraOption.copyDefault = true
  }

  // handle option.result
  let resOption = option.result || {}
  if (typeof resOption === 'string') {
    resOption = {
      valuePath: resOption
    }
  }

  if (!resOption.set && resOption.valuePath) {
    resOption.set = function (state, val) {
      setObjByPath(state, resOption.valuePath, val)
    }
  }

  if (!resOption.setValidateError && !resOption.validateErrorPath) {
    if (resOption.valuePath) {
      let path = resOption.valuePath.split('.')
      let name = path.pop()
      resOption.validateErrorPath = path.join('.') + 'validateError.' + name
    }
  }

  if (!resOption.setValidateError && resOption.validateErrorPath) {
    resOption.setValidateError = function (state, error, propPath) {
      if (propPath) {
        let allError = getObjByPath(state, resOption.validateErrorPath)
        if (allError) {
          if (error && error.length) {
            allError[propPath] = error
          } else {
            delete allError[propPath]
          }
        }
        setObjByPath(state, resOption.validateErrorPath, {...allError})
      } else {
        setObjByPath(state, resOption.validateErrorPath, error)
      }
    }
  }

  if (resOption.valuePath && !resOption.hasOwnProperty('copyDefault')) {
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

  if (paraOption.copyDefault || resOption.copyDefault) {
    let getModState = mod.state
    mod.state = function state() {
      let modState = getModState()

      if (paraOption.copyDefault) {
        let parameters = api.getDefaultParameters(modState)
        paraOption.set(modState, parameters)
      }

      if (resOption.copyDefault) {
        let result = api.getDefaultResponse(modState)
        resOption.set(modState, result)
      }

      return modState
    }
  }

  Object.assign(mod.actions, {
    [VALI_PARA] (context, path, val, parameters) {
      api.validateParameters(val, path, parameters).then(() => {
        let error = {}
        api.getParameterDepends(path).deepDepends.forEach(ePath => {
          error[ePath] = null
        })
        context.commit(U_PARA_PROP_ERROR, path, error)
      }).catch(function (error) {
        context.commit(U_PARA_PROP_ERROR, path, error)
      })
    },
    [VALI_RES] (context, path, val, result) {
      api.validateResponse(val, path, result).then(() => {
        context.commit(U_RES_PROP_ERROR, path, {})
      }).catch(function (error) {
        context.commit(U_RES_PROP_ERROR, path, error)
      })
    },
    [title] (context, parameters) {
      if (arguments.length === 1 && paraOption.get) {
        parameters = paraOption.get(context.state)
      }

      return api.send(parameters).then(function (result) {
        context.commit(U_RES, result)
        return result
      }).catch(function (error) {
        switch (error.type) {
          case 'parameters':
            context.commit(U_PARA_ERROR, error.error)
            break
          case 'response':
            context.commit(U_RES_ERROR, error.error)
            break
          case 'request':
            throw error.error
          default:
            throw error
        }
      })
    }
  })

  Object.assign(mod.mutations, {
    [U_PARA_ERROR] (state, error) {
      paraOption.setValidateError && paraOption.setValidateError(state, error)
    },
    [U_PARA_PROP_ERROR] (state, propPath, error) {
      paraOption.setValidateError && paraOption.setValidateError(state, error, propPath)
    },
    [U_RES_ERROR] (state, error) {
      resOption.setValidateError && resOption.setValidateError(state, error)
    },
    [U_RES_PROP_ERROR] (state, propPath, error) {
      resOption.setValidateError && resOption.setValidateError(state, error, propPath)
    },
    [U_RES] (state, result) {
      resOption.set && resOption.set(state, result)
    }
  })

  if (paraOption.valuePath) {
    mod.watch[paraOption.valuePath] = {
      handler ({dispatch, state}, val, oldVal, path) {
        let parameters = getObjByPath(state, paraOption.valuePath)
        dispatch(VALI_PARA, path.relative, val, parameters)
      },
      deep: true,
      onlyDescendence: true
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
          }
        }
      }) // eachMod
    }) // mixed
  } // install
}
