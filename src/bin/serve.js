import {Server} from 'http';
import * as zlib from 'zlib';
import * as url from 'url';
import etag from 'etag';
import mime from 'mime-types';
import fresh from 'fresh';
import compressible from 'compressible';
import Directory from 'directory-helpers';

const root = new Directory('.');
const server = new Server();

server.on('request', async (request, response) => {
  let file;
  const packageJson = await root.read('package.json');
  for (const dependency of Object.keys(packageJson.devDependencies)) {
    if (dependency.startsWith('serve-')) {
      /* eslint-disable global-require, lines-around-comment */
      file = await require(await root.resolve(dependency))(root, {
        path: decodeURIComponent(url.parse(request.url).pathname)
          .replace(/^\/*/, '')
      });
      /* eslint-enable global-require, lines-around-comment */
    }

    if (file) {
      break;
    }
  }

  if (file) {
    const headers = {
      'cache-control': 'public, max-age=0',
      'last-modified': file.stats.mtime.toUTCString(),
      'etag': etag(file.stats),
      'content-type': mime.contentType(file.type)
    };

    if (fresh(request.headers, headers)) {
      response.writeHead(304, headers);
      response.end();
    } else if (request.method === 'HEAD') {
      response.writeHead(200, headers);
      response.end();
    } else if (
      (request.headers['accept-encoding'] || '').includes('gzip') &&
      compressible(headers['content-type'])
    ) {
      headers['content-encoding'] = 'gzip';
      response.writeHead(200, headers);
      file
        .stream
        .pipe(zlib.createGzip({
          level: zlib.Z_BEST_COMPRESSION
        }))
        .pipe(response);
    } else {
      headers['content-length'] = file.stats.size;
      response.writeHead(200, headers);
      file.stream.pipe(response);
    }
  } else {
    response.writeHead(404, {
      'content-type': mime.contentType('text'),
      'content-length': 0
    });
    response.end();
  }
});

server.listen(8080, () => {
  process.stdout.write('Listening on :8080\n');
});
