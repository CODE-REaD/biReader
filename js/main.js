"use strict";

document.getElementById('filechoice1')
        .addEventListener(
            'change',
            function () {
                var fr = new FileReader();
                fr.onload = function () {
                    document.getElementById('leftPara').textContent = this.result;
                };
                fr.readAsText(this.files[0]);
                document.getElementById('leftTitle').textContent = this.files[0].name;
            }
        );

document.getElementById('filechoice2')
        .addEventListener(
            'change',
            function () {
                var fr = new FileReader();
                fr.onload = function () {
                    document.getElementById('rightPara').textContent = this.result;
                };
                fr.readAsText(this.files[0]);
                document.getElementById('rightTitle').textContent = this.files[0].name;
            }
        );
