import register from 'test-inject';
import Directory from 'directory-helpers';
import fetch from 'node-fetch';

const inject = register({
  project: {
    setUp: () => new Directory('project'),
    tearDown: async (project) => {
      await project.stop();
      await project.remove();
    }
  }
});

async function writeBoilerplate() {
  await this.write({
    'package.json': {
      name: 'project',
      private: true,
      scripts: {
        start: 'serve'
      },
      devDependencies: {}
    }
  });
}

async function writePlugin(name, implementation) {
  const packageJson = await this.read('package.json');
  await this.write({
    [`node_modules/${name}/package.json`]: {
      name
    },
    [`node_modules/${name}/index.js`]: implementation,
    'package.json': Object.assign(packageJson, {
      devDependencies: Object.assign(packageJson.devDependencies, {
        [name]: '0.0.1'
      })
    })
  });
}

async function assertResponse(response, {status, headers = {}, body}) {
  if (status) {
    expect(response.status).toEqual(status);
  }
  for (const [name, value] of Object.entries(headers)) {
    expect(response.headers.get(name)).toEqual(value);
  }
  if (typeof body !== 'undefined') {
    expect(await response.text()).toEqual(body);
  }
}

describe('serve-bin', () => {
  it('serves static assets with correct headers', inject(async ({project}) => {
    await project::writeBoilerplate();
    await project.write({
      'src/index.html': `
        <!doctype html>
        <meta charset="utf-8">
      `
    });
    await project::writePlugin('serve-index', `
      const fs = require('fs');
      module.exports = function(root, request) {
        return root.stat('src/index.html')
          .then((stats) => ({
            type: '.html',
            stats,
            stream: fs.createReadStream('src/index.html')
          }));
      };
    `);
    await project.start(/Listening/);

    await assertResponse(
      await fetch('http://localhost:8080/index.html'),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=0',
          'ETag': jasmine.stringMatching(/^W\/".*"$/),
          'Last-Modified': jasmine.stringMatching(
            new Date().toUTCString().slice(0, -6)),
          'Content-Type': 'text/html; charset=utf-8'
        },
        body: await project.read('src/index.html')
      }
    );
  }));

  it('correctly resolves paths', inject(async ({project}) => {
    await project::writeBoilerplate();
    await project.write({
      'src/contains space.html': `
        <!doctype html>
        <meta charset="utf-8">
      `
    });
    await project::writePlugin('serve-index', `
      const fs = require('fs');
      module.exports = function(root, request) {
        return root.stat(root.path('src', request.path))
          .then((stats) => ({
            type: '.html',
            stats,
            stream: fs.createReadStream(root.path('src', request.path))
          }));
      };
    `);
    await project.start(/Listening/);

    await assertResponse(
      await fetch('http://localhost:8080/contains%20space.html'),
      {status: 200}
    );

    await assertResponse(
      await fetch('http://localhost:8080/folder/../contains space.html'),
      {status: 200}
    );
  }));

  it('responds to HEAD requests with only headers', inject(async ({project}) => {
    await project::writeBoilerplate();
    await project.write({
      'src/index.html': `
        <!doctype html>
        <meta charset="utf-8">
      `
    });
    await project::writePlugin('serve-index', `
      const fs = require('fs');
      module.exports = function(root, request) {
        return root.stat('src/index.html')
          .then((stats) => ({
            type: '.html',
            stats,
            stream: fs.createReadStream('src/index.html')
          }));
      };
    `);
    await project.start(/Listening/);

    await assertResponse(
      await fetch(
        'http://localhost:8080',
        {method: 'HEAD'}
      ),
      {body: ''}
    );
  }));

  it('supports conditional GET', inject(async ({project}) => {
    await project::writeBoilerplate();
    await project.write({
      'src/index.html': `
        <!doctype html>
        <meta charset="utf-8">
      `
    });
    await project::writePlugin('serve-index', `
      const fs = require('fs');
      module.exports = function(root, request) {
        return root.stat('src/index.html')
          .then((stats) => ({
            type: '.html',
            stats,
            stream: fs.createReadStream('src/index.html')
          }));
      };
    `);
    await project.start(/Listening/);

    const response = await fetch('http://localhost:8080');

    await assertResponse(
      await fetch(
        'http://localhost:8080',
        {
          headers: {
            'If-None-Match': response.headers.get('ETag')
          }
        }
      ),
      {status: 304}
    );
  }));

  it('responds 404 for missing files', inject(async ({project}) => {
    await project::writeBoilerplate();
    await project::writePlugin('serve-index', `
      const fs = require('fs');
      module.exports = function(root, request) {
        return null;
      };
    `);
    await project.start(/Listening/);

    await assertResponse(
      await fetch('http://localhost:8080'),
      {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': '0'
        }
      }
    );
  }));

  it('gzips responses for clients that accept gzip', inject(async ({project}) => {
    await project::writeBoilerplate();
    await project.write({
      'src/index.html': `
        <!doctype html>
        <meta charset="utf-8">
      `
    });
    await project::writePlugin('serve-index', `
      const fs = require('fs');
      module.exports = function(root, request) {
        return root.stat('src/index.html')
          .then((stats) => ({
            type: '.html',
            stats,
            stream: fs.createReadStream('src/index.html')
          }));
      };
    `);
    await project.start(/Listening/);

    await assertResponse(
      await fetch('http://localhost:8080', {
        headers: {'Accept-Encoding': 'gzip'}
      }),
      {
        headers: {'Content-Encoding': 'gzip'},
        body: await project.read('src/index.html')
      }
    );
  }));
});
