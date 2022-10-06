const api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjhlNWQyOGZiN2UzMjdlY2M4ODhiYmZlZThmZTJlM2QwNTA3MmM0NmE0NDE4MDgxYjQ2OWVjMWFlODRiMWVkNDBiYjU0MjI1NDM5ZTkyYWEiLCJpYXQiOjE2NTc1NTA1MjcuNDE3MjU1LCJuYmYiOjE2NTc1NTA1MjcuNDE3MjU2LCJleHAiOjQ4MTMyMjQxMjcuNDAzNDc4LCJzdWIiOiI1NzQxOTkxMiIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.JKcQ7Reg01vadDpkOtygQIM8u5LyrcUyE-zLG6kAzjFTTbv0XTJK0Ib66EJknO9_XHwrBN4uYRThhENnVTOKHkQr7OixWDbj_JiAUSO0dzlaURhqDoSY2aqW-QtMX_m43qX79aY2ZpDESmE0XqFx6msNnMZrqe7PlmbNmbU-5n9Czi8OiJpCoELlKzbwEONyFQw7W6IaTEkOSfazGB1BwKTBCls6rZv25JO15AFfUvRS5Y64ur82I-NZ9_ozT4ulbXcAUjHOGoDlxthrwch0gPP0JuQPjpU0ScJWfleDMxE3bIwWHa1_UWzTdOe22HXOOr1bZS5W4IgFuTwYbCPuPIIS51ekFGwFpQtfFEw4GsdJiEWpaetLZuMA9-A6065jlZLklmSrJU8vfnVlcYJc-Tx8YSAoaQLTrb0PgQfSQ_qcdDcJsSeC4kiTMRlI4zgN_c3TIn5AQz3NmR6EWW3z0bOFBk6V0aGgSew0gdIqvYO9we8lHrriS4WJVI5eVCH-_gdwElPmoO-99HX9QuBn2PlLjNCR0eSR3S-5p_Z0i3z9MXVzvCc4GNhMoE_NbJyg4YBUMuzfznNVPRFdqZW9-n2emObGcJ3y7RrFIO64mgMHwPPjUeh6TxhrrJzVUUtgxqK_6YB-ZSfe6vexqJOyb-OjwjPZTboTuoAM1g9nVog";
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