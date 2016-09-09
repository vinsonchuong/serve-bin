import register from 'test-inject';
import Directory from 'directory-helpers';
import fetch from 'node-fetch';

async function start() {
  this.server = this.spawn('npm', ['start']);
  this.server.forEach((output) => {
    process.stderr.write(output);
  });
  await this.server.filter((output) => output.match(/Listening/));
}

const inject = register({
  project: {
    setUp: () => new Directory('project'),
    tearDown: async (project) => {
      if ('server' in project) {
        project.server.process.kill();
      }
      await project.remove();
    }
  }
});

describe('serve-bin', () => {
  it('serves src/index.html', inject(async ({project}) => {
    await project.write({
      'package.json': {
        name: 'project',
        private: true,
        scripts: {
          start: 'serve'
        }
      },
      'src/index.html': `
        <!doctype html>
        <meta charset="utf-8">
      `
    });
    await project.symlink('../node_modules', 'node_modules');

    await project::start();

    const response = await fetch('http://localhost:8080');
    expect(await response.text()).toBe([
      '<!doctype html>',
      '<meta charset="utf-8">',
      ''
    ].join('\n'));
  }));

  it('serves other static assets', inject(async ({project}) => {
    await project.write({
      'package.json': {
        name: 'project',
        private: true,
        scripts: {
          start: 'serve'
        }
      },
      'src/index.html': `
        <!doctype html>
        <meta charset="utf-8">
      `,
      'src/app.js': `
        console.log('Hello World!');
      `
    });
    await project.symlink('../node_modules', 'node_modules');

    await project::start();

    const response = await fetch('http://localhost:8080/app.js');
    expect(await response.text()).toBe([
      "console.log('Hello World!');",
      ''
    ].join('\n'));
  }));
});
