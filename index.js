// Node.js標準装備のファイルの読み書きするやつ
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
// 別途用意した画像を保存してくれるやつ
var canvas_saver = require('./canvas_saver.js');
var multer = require('multer');
// node-canvas
var Canvas = require('canvas'),
        Image = Canvas.Image;

var tcolor = { r: 204, g: 215, b: 221 }
var maximam = 217;
var app = express();
// app.use(express.logger());

app.use(express.static('html'))
app.use(multer({ dest: './tmp/' }).any())

app.post('/', function(req, res, next) {
        // console.log(req.files);
        var filenames = [req.files[0].filename, req.files[1].filename]
        margeImage("/tmp/" + filenames[0], "/tmp/" + filenames[1], function(data) {
                res.writeHead(200, { 'Content-Type': 'image/png' });
                res.write(data, 'binary')
                res.end()
                fs.unlink("/tmp/" + filenames[0], function(err) {
                        fs.unlink("/tmp/" + filenames[1], function(err) {

                        })
                })
        })
})

var port = process.env.PORT || 5000;

app.listen(port, function() {
        console.log("Listening on " + port);
})

function margeImage(dir1, dir2, callback) {
        fs.readFile(__dirname + dir1, function(err, data) {
                if (err) throw err;

                var canvas1 = getMonochrome(data);
                fs.readFile(__dirname + dir2, function(err, data) {
                        // データを保存
                        if (err) throw err;
                        var canvas2 = getMonochrome(data);

                        var ctx1 = canvas1.getContext('2d');
                        var imagedata1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height)

                        var ctx2 = canvas2.getContext('2d');
                        var imagedata2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height)

                        for (var y = 0; y < imagedata1.height; y++) {
                                for (var x = 0; x < imagedata1.width; x++) {
                                        var index = (y * imagedata1.width + x) * 4;
                                        if (imagedata1.data[index] < imagedata1.data[index]) {
                                                imagedata1.data[index] = [imagedata2.data[index], imagedata2.data[index] = imagedata1.data[index]][0]
                                        }
                                        var alpha = getAlpha(imagedata1.data[index], imagedata2.data[index])
                                        var base = getBaseColor(imagedata2.data[index], alpha);
                                        // console.log(base)
                                        imagedata1.data[index + 0] = base;
                                        imagedata1.data[index + 1] = base;
                                        imagedata1.data[index + 2] = base;
                                        imagedata1.data[index + 3] = alpha;
                                }
                        }
                        ctx1.putImageData(imagedata1, 0, 0);
                        callback(canvas1.toDataURL())
                })
        });
}
// monochrome = {"r","g","b"}
function monochrome(basecolor) {
        var color = { r: 0, g: 0, b: 0 }
        for (var key in color) {
                var mask = Math.floor(
                        (
                                Math.sqrt(
                                        Math.pow(basecolor.r, 2) +
                                        Math.pow(basecolor.g, 2) +
                                        Math.pow(basecolor.b, 2)
                                )
                        ) / (
                                Math.sqrt(Math.pow(255, 2) * 3)
                        ) * tcolor[key]
                )
                color[key] = mask;
        }
        return color
}

function getMonochrome(src) {
        var img = new Image;
        img.src = src;
        var maxsize = 720 * 480;
        var imgsize = { width: img.width, height: img.height }
        if (imgsize.width * imgsize.height > maxsize) {
                var hi = Math.sqrt(maxsize / (imgsize.width * imgsize.height));
                imgsize.width = Math.floor(imgsize.width * hi);
                imgsize.height = Math.floor(imgsize.height * hi);
        }
        console.log("before", { width: img.width, height: img.height })
        console.log("after:", imgsize)
        var canvas = new Canvas(imgsize.width, imgsize.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, imgsize.width, imgsize.height);

        // RGBの画素値の配列を取得
        var imagedata = ctx.getImageData(0, 0, img.width, imgsize.height);
        for (var y = 0; y < imagedata.height; y++) {
                for (var x = 0; x < imagedata.width; x++) {
                        var index = (y * imagedata.width + x) * 4;
                        var mono = monochrome({ "r": imagedata.data[index + 0], "g": imagedata.data[index + 1], "b": imagedata.data[index + 2] })
                        imagedata.data[index + 0] = mono.r; // G
                        imagedata.data[index + 1] = mono.g; // G
                        imagedata.data[index + 2] = mono.b; // B
                }
        }
        // 加工したデータをセット
        ctx.putImageData(imagedata, 0, 0);
        return canvas
}

function getAlpha(t1, t2) {
        return (t2 - t1 + maximam);
}

function getBaseColor(t2, a) {
        return Math.floor(t2 / (a / maximam));
}

var canvas_to_base64 = function(canvas) {
        return canvas.toDataURL().split(',')[1];
}
