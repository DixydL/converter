import * as fs from 'fs';
import * as path from 'path';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath.replace('app.asar', 'app.asar.unpacked'));

const logger = console;

const options = {
  timeout: 600000, // seconds
  logger,
};


//@ts-ignore
String.prototype.replaceAll = function (str1, str2, ignore) {
  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof (str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
}


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

    const finder = new Finder();

    const filePath = `./merged/${finder.trim(path.basename(fileInput)).replace(" ", "")}`;
    //@ts-ignore
    //soundInput = `${soundInput.replace(" ", "%20").replaceAll("\\", "\\\\")}`);
    return await new Promise((resolve, reject) => {
      ffmpeg(fs.createReadStream(fileInput), options)
        .output(filePath, { end: true })
        .addInput(soundInput)
        .addOptions(["-c:v copy", "-c:a aac", "-map 0:v:0", "-map 1:a:0"])
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