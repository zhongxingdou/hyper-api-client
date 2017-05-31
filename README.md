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
| parameter                   |          | Object 或 String   | {}      |                       |  'parameterPath' 等价于 { valuePath: 'parameterPath' }                              |
| parameter.valuePath         |          | String   |         | 'query'               |  请求参数在 state 中的 path，将根据它自动设置参数的其他选项                               |
| parameter.set               | +        | Function |         | fn(state, value)                       |提供一个函数设置参数的值，用于将 schema 中的默认值复制给参数             |
| parameter.get               | +        | Function |         | fn(state)                  | 提供一个函数从 state 中获取参数，仅用于发起请求时未传递参数 |
| parameter.validateEnabled   |          | Boolean  | true    |                       | watch parameters and validate 通过 vue-modello 的 watch 选项监听参数变化并进行校验 |
| parameter.validateErrorPath |          | String   |         | 'validateError.query' | 参数校验错误的保存到 state 的 path |
| parameter.setValidateError  | +        | Function |         | fn(state, error, propPath) | 提供一个函数保存参数校验错误   |
| parameter.copyDefault       |          | Boolean  |         |                       | Be true if valuePath present  是否 copy schema 中的默认值到参数 |
| result                      |          | Object 或 String  | {}      |                       |                               |
| result.valuePath            |          | String   |         | 'list'                | 保存结果到 state 的 path                               |
| result.set                  | +        | Function |         |  fn(state, value)                        | 用于保存响应结果到 state          |
| result.filter               |          | Function |         | fn (result )                      | filter result 用于通过校验后过滤响应结果 |
| result.copyDefault          |          | Boolean  |         |                       | Be true if valuePath present 是否复制默认值到响应结果 |

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


