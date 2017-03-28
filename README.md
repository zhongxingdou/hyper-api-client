# hyper-api-client

## Install

```bash
npm install hyper-api-client --save
```

## Usage

### Config compiler and create instance AppApiClint
```js
import HyperApiClient from 'hyper-api-client'
import Ajv from 'ajv'
import 'whatwg-fetch'

function initAPIClient() {
  HyperApiClient.compiler = function () {
    return new Ajv()
  }

  var doRequest = function ({method, url, data}) {
    return fetch(url, {
      method,
      body: JSON.stringify(data)
    })
  }

  return HyperApiClient.createClient({
    doRequest: doRequest
  })
}

let AppApiClint = initAPIClient()

export default AppApiClint
```

### Add schema to AppApiClint
```js
let findUserSchema = {
  href: 'http://domain.com/api',
  title: 'findUser',
  method: 'post',
  description: 'Find user by name',
  definitions: {
    name: {
      type: 'string'
    },
    age: {
      type: 'number'
    }
  },
  schema: {
    properties: {
      name: {
        type: 'string'
      }
    }
  },
  targetSchema: {
    properties: {
      name: {
        $ref: '#/definitions/name',
      },
      age: {
        $ref: '#/definitions/age'      
      }
    }
  }
}

AppApiClint.addSchema(findUserSchema)
```

### Use directly
```js
AppApiClint.findUser.send({name: 'hal.zhong'}).then(user => {
  console.info(user.name)
})
```

### Install vue-modello plugin
```js
import VueModello from 'vue-modello'
import HyperApiClient from 'hyper-api-client'
import AppApiClient from './api_client'

let AppModello = new VueModello()
AppModello.use(HyperApiClient.VueModelloPlugin, {
  client: AppApiClient
})

if (top !== window) {
  let loc = location
  top.href.replace(loc.domain + (loc.port || '') + '//' + loc.hostname + '/#')
}
```

### vue modello hyper api plugin mix option

| Property                    | Priority | Type     | Default | Example               | Description                   |
| --------------------------- | -------- | -------- | ------- | --------------------- | ----------------------------- |
| parameter                   |          | Object   | {}      |                       |                               |
| parameter.valuePath         |          | String   |         | 'query'               |                               |
| parameter.set               | +        | Function |         |                       | fn(state, value)              |
| parameter.get               | +        | Function |         |                       | fn(state)                     |
| parameter.validateEnabled   |          | Boolean  | true    |                       | watch parameters and validate |
| parameter.validateErrorPath |          | String   |         | 'validateError.query' |                               |
| parameter.setValidateError  | +        | Function |         |                       | fn(state, error, propPath)    |
| parameter.copyDefault       |          | Boolean  |         |                       | Be true if valuePath present  |
| result                      |          | Object   | {}      |                       |                               |
| result.valuePath            |          | String   |         | 'list'                |                               |
| result.set                  | +        | Function |         |                       | fn(state, value)              |
| result.filter               |          | Function |         |                       | filter result                 |
| result.copyDefault          |          | Boolean  |         |                       | Be true if valuePath present  |

### Add api to model
```js
let UserModel = {
  modelName: 'User',

  hyperApi: {
    findUser: {}
  },

  actions: {

  },

  mutations: {

  }
}
```
