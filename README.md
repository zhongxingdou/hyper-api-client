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
  APIClient.compiler = function () {
    return new Ajv()
  }

  var doRequest = function ({method, url, data}) {
    return fetch(url, {
      method,
      body: JSON.stringify(data)
    })
  }

  return APIClient.createClient({
    doRequest: doRequest
  })
}

let Client = initAPIClient()

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

Client.addSchema(findUserSchema)

Client.findUser.send({name: 'hal.zhong'}).then(user => {
  console.info(user.name)
})
```
