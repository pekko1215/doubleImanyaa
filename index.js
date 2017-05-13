// Node.js標準装備のファイルの読み書きするやつ
var fs = require('fs');
var express = require('express');
// 別途用意した画像を保存してくれるやつ
var canvas_saver = require('./canvas_saver.js');

// node-canvas
var Canvas = require('canvas'),
        Image = Canvas.Image;

var maximam = 217;

var app = express();
// app.use(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 5000;

app.listen(port,function(){
    console.log("Listening on "+port);
})


fs.readFile(__dirname + '/A.png', function(err, data) {
        if (err) throw err;

        var canvas1 = getMonochrome(data);
        fs.readFile(__dirname + '/B.png', function(err, data) {
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
                canvas_saver.save(canvas1, "monochrome.png", function() {
                        console.log("画像保存完了したよ!!");
                });
        })
});
// monochrome = {"r","g","b"}
function monochrome(basecolor) {
        var mask = Math.floor(
                (
                        Math.sqrt(
                                Math.pow(basecolor.r, 2) +
                                Math.pow(basecolor.g, 2) +
                                Math.pow(basecolor.b, 2)
                        )
                ) / (
                        Math.sqrt(Math.pow(255, 2) * 3)
                ) * maximam
        )
        return { "r": mask, "g": mask, "b": mask }
}

function getMonochrome(src) {
        var img = new Image;
        img.src = src;
        var canvas = new Canvas(img.width, img.height);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // RGBの画素値の配列を取得
        var imagedata = ctx.getImageData(0, 0, img.width, img.height);
        // console.log(imagedata.data[3]);
        // 画像加工(擬似モノクロ化)
        for (var y = 0; y < imagedata.height; y++) {
                for (var x = 0; x < imagedata.width; x++) {
                        var index = (y * imagedata.width + x) * 4;
                        var mono = monochrome({ "r": imagedata.data[index + 0], "g": imagedata.data[index + 1], "b": imagedata.data[index + 2] })
                                // imagedata.data[index + 3] = Math.floor(y / imagedata.height * 256); // alpha
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
        return Math.floor(t2 / (a /maximam));
}
