import Client from './client'
import VueModelloPlugin from './vue_modello_plugin'

export default {
  Client,
  createClient (...args) {
    return new Client(...args)
  },
  VueModelloPlugin,
  set compiler (val) {
    Client.createCompiler = val
  }
}
