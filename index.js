// dependencies
const path = require('path');
const os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const nodeFetch = require('node-fetch');
const childProcess = require('child_process');
const fs = require('fs');
const multer = require('multer');

// express app
const app = express();
const upload = multer({dest: "input/", limits: { fieldSize: 50 * 1024 * 1024 }});

// add middleware
app.use(helmet());
app.use(bodyParser.json({limit:"50mb"}));
app.use(cors());
app.use(morgan('combined'));

// waifu2x post API
app.post('/upscale', upload.any(), (req, res) => {
    const buffer = Buffer.from(req['body']['dataURL'], 'base64');
    fs.mkdtemp(path.join(os.tmpdir(), "waifu2x-"), (err, folder) => {
        if (err) throw err;
        //console.log(folder);
        const filePath = folder + "/input." + req['body']['type'].split('/')[1];
        fs.writeFile(filePath, buffer, (err) => {
            if (err) throw err;
            // process with waifu2x
            const runWaifu2x = (() => {
                const run = ".\\waifu2x\\waifu2x-ncnn-vulkan.exe -i " + filePath + " -o " + folder + "/output.png" + " -s " + req['body']['scaleFactor'];
                const dir = childProcess.spawn(run, {shell: true});

                dir.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });
                dir.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                });
                dir.on('error', (code) => {
                    console.log(`child process error: ${code}`);
                    res.sendStatus(500);
                });
                dir.on('close', (code) => {
                    console.log(`child process close: ${code}`);
                    // send output image
                    fs.readFile(folder + "/output.png", (err, data) => {
                        if (err) {
                            console.log(err);
                            res.sendStatus(500);
                        }
                        res.send(data);
                        fs.rm(folder, {recursive: true, force: true}, (err) => {
                            if (err) throw err;
                        });
                    });
                });
                dir.on('exit', (code) => {
                    console.log(`child process exit: ${code}`);
                });
            })();
        });
    });
});

// start app listen
app.listen('6969', '192.168.20.8', () => {
    console.log('listening on port nicenice');
});