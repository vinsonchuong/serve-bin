import {Server} from 'http';
import * as url from 'url';
import Directory from 'directory-helpers';
import send from 'send';

const root = new Directory('src');
const server = new Server();
server.on('request', (request, response) => {
  send(request, url.parse(request.url).pathname, {root: root.path()})
    .pipe(response);
});
server.listen(8080, () => {
  process.stdout.write('Listening on :8080\n');
});
