import {Server} from 'http';
import etag from 'etag';
import mime from 'mime-types';
import fresh from 'fresh';
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
      'content-length': file.stats.size,
      'content-type': mime.contentType(file.extension)
    };

    if (fresh(request.headers, headers)) {
      response.writeHead(304, headers);
      response.end();
    } else if (request.method === 'HEAD') {
      response.writeHead(200, headers);
      response.end();
    } else {
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
