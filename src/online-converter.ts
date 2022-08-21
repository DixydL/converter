const api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYjhlNWQyOGZiN2UzMjdlY2M4ODhiYmZlZThmZTJlM2QwNTA3MmM0NmE0NDE4MDgxYjQ2OWVjMWFlODRiMWVkNDBiYjU0MjI1NDM5ZTkyYWEiLCJpYXQiOjE2NTc1NTA1MjcuNDE3MjU1LCJuYmYiOjE2NTc1NTA1MjcuNDE3MjU2LCJleHAiOjQ4MTMyMjQxMjcuNDAzNDc4LCJzdWIiOiI1NzQxOTkxMiIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.JKcQ7Reg01vadDpkOtygQIM8u5LyrcUyE-zLG6kAzjFTTbv0XTJK0Ib66EJknO9_XHwrBN4uYRThhENnVTOKHkQr7OixWDbj_JiAUSO0dzlaURhqDoSY2aqW-QtMX_m43qX79aY2ZpDESmE0XqFx6msNnMZrqe7PlmbNmbU-5n9Czi8OiJpCoELlKzbwEONyFQw7W6IaTEkOSfazGB1BwKTBCls6rZv25JO15AFfUvRS5Y64ur82I-NZ9_ozT4ulbXcAUjHOGoDlxthrwch0gPP0JuQPjpU0ScJWfleDMxE3bIwWHa1_UWzTdOe22HXOOr1bZS5W4IgFuTwYbCPuPIIS51ekFGwFpQtfFEw4GsdJiEWpaetLZuMA9-A6065jlZLklmSrJU8vfnVlcYJc-Tx8YSAoaQLTrb0PgQfSQ_qcdDcJsSeC4kiTMRlI4zgN_c3TIn5AQz3NmR6EWW3z0bOFBk6V0aGgSew0gdIqvYO9we8lHrriS4WJVI5eVCH-_gdwElPmoO-99HX9QuBn2PlLjNCR0eSR3S-5p_Z0i3z9MXVzvCc4GNhMoE_NbJyg4YBUMuzfznNVPRFdqZW9-n2emObGcJ3y7RrFIO64mgMHwPPjUeh6TxhrrJzVUUtgxqK_6YB-ZSfe6vexqJOyb-OjwjPZTboTuoAM1g9nVog";
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