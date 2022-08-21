import * as fs from 'fs';
import * as path from 'path';
const ffmpeg = require('fluent-ffmpeg');

const logger = console;

const options = {
  timeout: 600000, // seconds
  logger,
};


class Finder {

  trim(val: string) {
    return val.replace(/[\[\]]/g, "").replace("10Bit", "").replace("1080p", "");
  }

  findFileByExt(folderPath: string, ext: string) {
    var files = fs.readdirSync(folderPath);
    var result: string[] = [];

    files.forEach(function (file: any) {
      var newbase: string = path.join(folderPath, file);
      if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
        result.push(newbase);
      }
    });

    return result;
  }

  async mergeMkv(fileInput: string, soundInput: string): Promise<string> {
    if (!fs.existsSync(`./merged`)) {
      fs.mkdirSync(`./merged`);
    }

    const filePath = `./merged/${path.basename(fileInput)}`;
    return await new Promise((resolve, reject) => {
      ffmpeg(fs.createReadStream(fileInput), options)
        .output(filePath, { end: true })
        .addOptions(["-i " + `${soundInput.replace(" ", "%20")}`, "-c:v copy", "-c:a aac", "-map 0:v:0", "-map 1:a:0"])
        .on('end', () => {
          console.log('Finished processing'), resolve(filePath);
        })
        .on('error', (progress: any) => {
          console.log(progress);

          reject(new Error('mkv немає субтитрів'));
        })
        .on('progress', (progress: any) => {
          console.log(progress);
        })
        .run();
    });
  }
}

export default Finder;