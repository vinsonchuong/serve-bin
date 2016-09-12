import {Server} from 'http';
import * as zlib from 'zlib';
import etag from 'etag';
import mime from 'mime-types';
import fresh from 'fresh';
import compressible from 'compressible';
import Directory from 'directory-helpers';
import resolveFile from 'serve-bin/lib/resolve_file';

const root = new Directory('src');
const server = new Server();

server.on('request', async (request, response) => {
  const file = await root::resolveFile(request);

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
      'accept-encoding' in request.headers &&
      compressible(headers['content-type']) &&
      request.headers['accept-encoding'].includes('gzip')
    ) {
      headers['content-encoding'] = 'gzip';
      response.writeHead(200, headers);
      file.stream()
        .pipe(zlib.createGzip({
          level: zlib.Z_BEST_COMPRESSION
        }))
        .pipe(response);
    } else {
      headers['content-length'] = file.stats.size;
      response.writeHead(200, headers);
      file.stream().pipe(response);
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
