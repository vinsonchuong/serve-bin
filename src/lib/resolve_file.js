import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

export default async function(request) {
  let filePath, fileStats;

  try {
    filePath = path.join(
      this.path(),
      decodeURIComponent(url.parse(request.url).pathname)
    );

    if (!this.contains(filePath)) {
      return null;
    }

    fileStats = await this.stat(filePath);

    if (fileStats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fileStats = await this.stat(filePath);
    }

    return {
      type: path.extname(filePath),
      stats: fileStats,
      stream: () => fs.createReadStream(filePath)
    };
  } catch (error) {
    return null;
  }
}
