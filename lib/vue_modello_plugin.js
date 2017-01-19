import Client from './client'

/*
function setObjByPath (obj, path, val) {
  if (!obj) return

  let pathes = path.split('.')
  if (pathes.length === 1) {
    obj[path] = val
  } else {
    setObjByPath(obj[pathes.shift()], pathes.join('.'), val)
  }
}
*/

function buildApiMudule (api) {
  let state = function state() {
    let parameters = api.getDefaultParameters()
    let result = api.getDefaultResponse()
    return {
      parameters,
      result,
      parametersError: {},
      resultError: {}
    }
  }

  let title = api.title

  let actions = {
    [title + '_validateParameters']: function (context, path, val) {
      api.validateParameters(path, val).catch(function (error) {
        context.commit('updateParametesErrorProp', path, error)
      })
    },
    [title + '_validateResult']: function (context, path, val) {
      api.validateResponse(path, val).catch(function (error) {
        context.commit('updateResultErrorProp', path, error)
      })
    },
    [title]: function (context) {
      api.send(context.state.parameters).catch(function (error) {
        if (error.type === 'parameters') {
          context.commit('updateParametersError', error)
        } else if (error.type === 'response') {
          context.commit('updateResultError', error)
        }
      })
    }
  }

  let mutations = {
    updateParametesErrorProp (state, path, error) {
      state.parametersError[path] = error
    },
    updateResultErrorProp (state, path, error) {
      state.ResultError[path] = error
    },
    updateParametersError (state, error) {
      state.parametersError = error
    },
    updateResultError (state, error) {
      state.ResultError = error
    }
  }

  let watch = {
    parameters (context, val, oldVal, path) {
      context.dispatch(title + '_validateParameters', path.relative, val)
    },
    result (context, val, oldVal, path) {
      context.dispatch(title + '_validateResult', path.relative, val)
    }
  }

  return {
    state,
    actions,
    mutations,
    watch
  }
}

export default {
  install: function (modello) {
    modello.on('init', function (modelDesc) {
      if (modelDesc.hyperApi) {
        modelDesc.hyperApi.forEach(api => {
          if (Client[api]) {
            modelDesc.mixins[api] = buildApiMudule(Client[api])
          }
        })
      }
    })
  }
}
