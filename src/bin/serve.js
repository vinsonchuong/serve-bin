import {Server} from 'http';
import Directory from 'directory-helpers';

const server = new Server();
server.on('request', async (request, response) => {
  const html = await new Directory('src').read('index.html');
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html)
  });
  response.write(html);
  response.end();
});
server.listen(8080, () => {
  process.stdout.write('Listening on :8080');
});
