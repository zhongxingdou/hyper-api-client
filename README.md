# hyper-api-client

## Install

```bash
npm install hyper-api-client --save
```

## Usage

```js
import APIClient from 'hyper-api-client'
import Ajv from 'ajv'
import 'whatwg-fetch'

function initAPIClient() {
  let ajv = new Ajv()
  APIClient.compile = ajv.compile.bind(ajv)

  APIClient.request = function ({method, url, data}) {
    return fetch(url, {
      method,
      body: JSON.stringify(data)
    })
  }
}

initAPIClient()

let findUserSchema = {
  href: 'http://domain.com/api',
  title: 'findUser',
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
    name: {
      type: 'string'
    }
  },
  targetSchema: {
    properties: {
      name: '#/definitions/name'
      age: '#/definitions/age'
    }
  }
}

APIClient.addSchema(findUserSchema)

APIClient.findUser.send({name: 'hal.zhong'}).then(user => {
  console.info(user.name)
})
```
