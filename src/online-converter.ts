const api_key = "";
import CloudConvert from 'cloudconvert';
import path from 'path';
const fs = require('fs');
const https = require('https');

const cloudConvert = new CloudConvert(api_key);

export class OnlineConverter {
    async run(uploadFile: string, subFile?: string) {
        if (!fs.existsSync(`./out`)) {
            fs.mkdirSync(`./out`);
        }
        console.log(subFile);

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

        const writeStream = fs.createWriteStream('./out/' + file.filename);

        https.get(file.url, function (response: any) {
            response.pipe(writeStream);
        });

        return await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve('./out/' + file.filename));
            writeStream.on('error', reject);
        });
    }
}
