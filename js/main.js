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

$(".clickable").click(function(e){
    var s = window.getSelection();
    var range = s.getRangeAt(0);
    var node = s.anchorNode;
    while(range.toString().indexOf(' ') != 0) {
        range.setStart(node,(range.startOffset -1));
    }
    range.setStart(node, range.startOffset +1);

    do {
        range.setEnd(node,range.endOffset + 1);

    } while(range.toString().indexOf(' ') == -1 && range.toString().trim() != '');
    var str = range.toString().trim();
    alert(str);

/*
    var can = this.hasSpeechError()
    if (can) {
        console.log(this.props)
        this.props.onSpeechError(can)
        return;
    }
*/
    var msg = new SpeechSynthesisUtterance(str);
    // msg.lang = this.props.language;
    msg.lang = 'fr';
    msg.rate = 0.8;
    speechSynthesis.speak(msg)

});


