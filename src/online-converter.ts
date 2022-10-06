const api_key = "";
import CloudConvert from 'cloudconvert';
import path from 'path';
import * as fs from 'fs-extra';
const https = require('https');
import EventEmitter from 'events';
const Axios = require('axios')
const ProgressBar = require('progress')
const cloudConvert = new CloudConvert(api_key);
import { promisify } from 'util';
import * as stream from 'stream';
import { Dir } from 'original-fs';
const finished = promisify(stream.finished);

export class OnlineConverter {
    eventEmitter: EventEmitter;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    async progress(callback) {
        this.eventEmitter.on('progress', callback);
    }

    async progressConverter(callback) {
        this.eventEmitter.on('progressConverter', callback);
    }

    async downloadFile(url: string, filename: string, dir: string) {
        console.log('Connecting …')
        const { data, headers } = await Axios({
            url,
            method: 'GET',
            responseType: 'stream'
        })
        const totalLength = headers['content-length']

        console.log(totalLength);

        console.log('Starting download')

        const writer = fs.createWriteStream(
            dir + "/out/" + filename
        )

        let fileDownload = 0;

        data.on('data', (chunk) => {
            // console.log(chunk.length);
            fileDownload += chunk.length;
            let procent = Math.round((fileDownload / totalLength * 1000));

            if (procent % 50 === 0) {
                this.eventEmitter.emit('progress', procent / 10);
                //console.log(procent);
            }
        })
        data.pipe(writer)

        return finished(writer);
    }

    async run(uploadFile: string, dir: string, subFile?: string) {

        if (!fs.existsSync(`${dir}/out`)) {
            fs.mkdirSync(`${dir}/out`);
        }
        // subFile = null;

        let config: any = {
            "tasks": {
                "import-1": {
                    "operation": "import/upload",
                    //"url": ""
                },
                "task-1": {
                    "operation": "convert",
                    "input_format": "mkv",
                    "output_format": "mp4",
                    "engine": "ffmpeg",
                    "input": [
                        "import-1"
                    ],
                    "video_codec": "x264",
                    "crf": 25,
                    "preset": "fast",
                    "fit": "scale",
                    "watermark_position_vertical": "center",
                    "watermark_position_horizontal": "center",
                    "watermark_margin_vertical": 25,
                    "watermark_margin_horizontal": 25,
                    "audio_codec": "aac",
                    "audio_bitrate": 128
                },
                "export-1": {
                    "operation": "export/url",
                    "input": [
                        "task-1"
                    ],
                    "inline": false,
                    "archive_multiple_files": false
                }
            },
            "tag": "jobbuilder"
        };

        if (subFile) {
            fs.copyFileSync(subFile, `${dir}/out/temp.ass`);
            subFile = `${dir}/out/temp.ass`;
            config = {
                "tasks": {
                    "import-1": {
                        "operation": "import/upload",
                        //"url": ""
                    },
                    "import-2": {
                        "operation": "import/upload",
                        //"url": ""
                    },
                    "task-1": {
                        "operation": "convert",
                        "input_format": "mkv",
                        "output_format": "mp4",
                        "engine": "ffmpeg",
                        "input": [
                            "import-1"
                        ],
                        "video_codec": "x264",
                        "crf": 25,
                        "preset": "fast",
                        "fit": "scale",
                        "subtitles_mode": "hard",
                        "subtitles": [
                            "import-2"
                        ],
                        "watermark_position_vertical": "center",
                        "watermark_position_horizontal": "center",
                        "watermark_margin_vertical": 25,
                        "watermark_margin_horizontal": 25,
                        "audio_codec": "aac",
                        "audio_bitrate": 128
                    },
                    "export-1": {
                        "operation": "export/url",
                        "input": [
                            "task-1"
                        ],
                        "inline": false,
                        "archive_multiple_files": false
                    }
                },
                "tag": "jobbuilder"
            }
        }

        let job = await cloudConvert.jobs.create(config).catch(e => {
            console.log(e);
        });

        if (!job) {
            return;
        }

        cloudConvert.jobs.subscribeTaskEvent(job.id, 'updated', event => {
            //@ts-ignore
            if (event.task.name == "task-1") {
                //@ts-ignore
                this.eventEmitter.emit('progressConverter', event.task.percent);
            }

            // Task has finished
            console.log(event.task);
        });

        if (subFile) {
            const uploadTask2 = job.tasks.filter(task => task.name === 'import-2')[0];
            console.log("subfile:" + subFile);
            const inputFile2 = fs.createReadStream(subFile);
            await cloudConvert.tasks.upload(uploadTask2, inputFile2, path.basename(subFile));
        }

        const uploadTask = job.tasks.filter(task => task.name === 'import-1')[0];

        const inputFile = fs.createReadStream(uploadFile);
        await cloudConvert.tasks.upload(uploadTask, inputFile, path.basename(uploadFile));

        job = await cloudConvert.jobs.wait(job.id); // Wait for job completion

        const exportTask: any = job.tasks.filter(
            task => task.operation === 'export/url' && task.status === 'finished'
        )[0];

        const file = exportTask.result.files[0];

        //const writeStream = fs.createWriteStream('./out/' + file.filename);

        await this.downloadFile(file.url, file.filename, dir);

        return dir + "/out/" + file.filename;

        // https.get(file.url, function (response: any) {
        //     response.pipe(writeStream);
        // });

        // return await new Promise((resolve, reject) => {
        //     writeStream.on('finish', resolve('./out/' + file.filename));
        //     writeStream.on('error', reject);
        // });
    }
}
