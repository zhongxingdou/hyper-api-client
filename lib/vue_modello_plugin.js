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

  if (!paraOption.setValidateError && paraOption.validateErrorPath) {
    paraOption.setValidateError = function (state, error, propPath) {
      if (propPath) {
        setObjByPath(state, paraOption.validateErrorPath + propPath, error)
      } else {
        setObjByPath(state, paraOption.validateErrorPath, error)
      }
    }
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

  if (!resOption.setValidateError && resOption.validateErrorPath) {
    resOption.setValidateError = function (state, error, propPath) {
      if (propPath) {
        setObjByPath(state, paraOption.validateErrorPath + propPath, error)
      } else {
        setObjByPath(state, paraOption.validateErrorPath, error)
      }
    }
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
    [VALI_PARA] (context, path, val) {
      api.validateParameters(val, path).catch(function (error) {
        context.commit(U_PARA_PROP_ERROR, path, error)
      })
    },
    [VALI_RES] (context, path, val) {
      api.validateResponse(val, path).catch(function (error) {
        context.commit(U_RES_PROP_ERROR, path, error)
      })
    },
    [title] (context, parameters) {
      if (arguments.length === 1 && paraOption.get) {
        parameters = paraOption.get(context.state)
      }

      return api.send(parameters).then(function (result) {
        context.commit(U_RES, result)
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
      paraOption.setValidateError(state, error)
    },
    [U_PARA_PROP_ERROR] (state, propPath, error) {
      paraOption.setValidateError(state, error, propPath)
    },
    [U_RES_ERROR] (state, error) {
      resOption.setValidateError(state, error)
    },
    [U_RES_PROP_ERROR] (state, propPath, error) {
      resOption.setValidateError(state, error, propPath)
    },
    [U_RES] (state, result) {
      resOption.set(state, result)
    }
  })

  if (paraOption.valuePath) {
    mod.watch[paraOption.valuePath] = {
      handler (context, val, oldVal, path) {
        context.dispatch(VALI_PARA, path.relative, val)
      },
      deep: true,
      onlyDescendence: true
    }
  }

  if (resOption.valuePath) {
    mod.watch[resOption.valuePath] = {
      handler (context, val, oldVal, path) {
        context.dispatch(VALI_RES, path.relative, val)
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
