import {Server} from 'http';
import Directory from 'directory-helpers';

const root = new Directory('src');
const server = new Server();
server.on('request', async (request, response) => {
  const path = request.url.slice(1) || 'index.html';
  const file = await root.read(path);

  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(file)
  });
  response.write(file);
  response.end();
});
server.listen(8080, () => {
  process.stdout.write('Listening on :8080\n');
});
