# serve-bin
[![Build Status](https://travis-ci.org/vinsonchuong/serve-bin.svg?branch=master)](https://travis-ci.org/vinsonchuong/serve-bin)

A zero-configuration plugin system for on-the-fly building and serving assets
for development.

## Installing
`serve-bin` is available as an
[npm package](https://www.npmjs.com/package/serve-bin).

## Usage
Add `serve-bin` to the `package.json` as follows:
```json
{
  "name": "project",
  "private": true,
  "scripts": {
    "start": "serve"
  },
  "devDependencies": {
    "serve-bin": "^0.0.1"
  }
}
```

Then add plugins for each desired asset build workflow. Existing plugins are
listed below. By default, `serve-bin` will serve static files with the `src`
directory as root.

From the command line, run:
```bash
npm start
```

## Plugins
* [serve-esnext](https://github.com/vinsonchuong/serve-esnext) compiles ES.next
  modules.

## Writing Plugins
Plugins must have a `name` that starts with `serve-`.

```json
{
  "name": "serve-esnext",
  "main": "src/index.js"
}
```

Plugins must export an
[Express middleware](https://expressjs.com/en/guide/writing-middleware.html).

```js
export default async function(request, response, next) {
  // ...
}
```

## Development
### Getting Started
The application requires the following external dependencies:
* Node.js

The rest of the dependencies are handled through:
```bash
npm install
```

Run tests with:
```bash
npm test
```
