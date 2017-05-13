$(function() {
        //画像ファイルプレビュー表示のイベント追加 fileを選択時に発火するイベントを登録
        $('form').on('change', 'input[type="file"]', function(e) {
                var file = e.target.files[0],
                        reader = new FileReader(),
                        t = this;
                var $preview = $(e.target).parent().find('.preview');
                console.log($preview)
                        // 画像ファイル以外の場合は何もしない
                if (file.type.indexOf("image") < 0) {
                        return false;
                }

                // ファイル読み込みが完了した際のイベント登録
                reader.onload = (function(file) {
                        return function(e) {
                                //既存のプレビューを削除
                                $preview.empty();
                                console.log(e)
                                        // .prevewの領域の中にロードした画像を表示するimageタグを追加
                                var img = $("<img>");
                                img.attr({
                                        src: e.target.result,
                                        class: "preview",
                                        width: 150,
                                        title: file.name
                                })
                                $preview.append(img);
                        };
                })(file);

                reader.readAsDataURL(file);
        });
        $('#send').click(function(e) {
                var filer = $('input[type="file"]');
                var files = [filer[0].files[0], filer[1].files[0]];
                if (typeof files[0] === "undefined" || typeof files[1] === "undefined") {
                        alert("ファイルを選択してください")
                        return;
                }
                if (files[0].type.indexOf('image') == -1 || files[1].type.indexOf('image') == -1) {
                        alert("画像ファイルを選択してください")
                        return;
                }
                var reader = [new FileReader(), new FileReader()];
                var fileobj = []
                reader[0].onload = function(file) {
                        fileobj[0] = file;
                        reader[1].onload = function(file) {
                                fileobj[1] = file;
                                var imgs = [new Image(), new Image()];
                                imgs[0].src = fileobj[0].target.result
                                imgs[1].src = fileobj[1].target.result;
                                console.log(imgs[0].width, imgs[1].width)
                                if (imgs[0].width != imgs[1].width || imgs[0].height != imgs[1].height) {
                                        alert("画像の大きさが違います");
                                        return;
                                }
                                var form = new FormData();
                                form.append("A", files[0], "A.png")
                                form.append("B", files[1], "B.png")
                                console.log(form)
                                $('#send').disabled(true)
                                $.ajax({
                                        url: '/',
                                        type: 'POST',
                                        data: form,
                                        cache: false,
                                        contentType: false,
                                        processData: false,
                                        success: function(data, textStatus, jqXHR) {
                                                $('#ret').attr({ src: data });
                                                $('#send').disabled(false)
                                        }
                                })
                        }
                        reader[1].readAsDataURL(files[1]);
                }
                reader[0].readAsDataURL(files[0])
        })
});
