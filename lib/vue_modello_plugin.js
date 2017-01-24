import Client from './client'

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
        context.commit('updateParametersErrorProp', path, error)
      })
    },
    [title + '_validateResult']: function (context, path, val) {
      api.validateResponse(path, val).catch(function (error) {
        context.commit('updateResultErrorProp', path, error)
      })
    },
    [title]: function (context) {
      return api.send(context.state.parameters).then(function (result) {
        context.commit('updateResult', result)
      }).catch(function (error) {
        switch (error.type) {
          case 'parameters':
            context.commit('updateParametersError', error.error)
            break
          case 'response':
            context.commit('updateResultError', error.error)
            break
          case 'request':
            throw error.error
          default:
            throw error
        }
      })
    }
  }

  let mutations = {
    updateParametersError (state, error) {
      state.parametersError = error
    },
    updateParametersErrorProp (state, path, error) {
      state.parametersError[path] = error
    },
    updateResultError (state, error) {
      state.resultError = error
    },
    updateResultErrorProp (state, path, error) {
      state.resultError[path] = error
    },
    updateResult (state, result) {
      state.result = result
    }
  }

  let watch = {
    parameters: {
      handler (context, val, oldVal, path) {
        context.dispatch(title + '_validateParameters', path.relative, val)
      },
      deep: true,
      onlyDescendence: true
    },
    result: {
      handler (context, val, oldVal, path) {
        context.dispatch(title + '_validateResult', path.relative, val)
      },
      deep: true,
      onlyDescendence: true
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
      let hyperApi = modelDesc.hyperApi
      if (hyperApi) {
        if (Array.isArray(hyperApi)) {
          modelDesc.hyperApi.forEach(api => {
            if (Client[api]) {
              modelDesc.mixins[api] = buildApiMudule(Client[api])
            }
          })
        } else { // is object
          for(let api in hyperApi) {
            let state = hyperApi[api]
            modelDesc.mixins[state] = buildApiMudule(Client[api])
          }
        }
      }
    })
  }
}
