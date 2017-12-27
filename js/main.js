"use strict";

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// todo: Apply D.R.Y. here...
var leftFileDrop = document.getElementById("leftColumn"); // use column rather than para as para isn't inflated before a file is loaded
leftFileDrop.addEventListener("dragenter", dragenter, false);
leftFileDrop.addEventListener("dragover", dragover, false);
leftFileDrop.addEventListener("drop", leftDrop, false);

var rightFileDrop = document.getElementById("rightColumn");
rightFileDrop.addEventListener("dragenter", dragenter, false);
rightFileDrop.addEventListener("dragover", dragover, false);
rightFileDrop.addEventListener("drop", rightDrop, false);

function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
}

function leftDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    handleLeftFiles(files);
}

function rightDrop(e) {
    e.stopPropagation();
    e.preventDefault();

    var dt = e.dataTransfer;
    var files = dt.files;

    handleRightFiles(files);
}


function handleLeftFiles(files) {
    console.log('left file is ' + files[0].name);
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('leftPara').textContent = this.result;
        };
        fr.readAsText(files[0]);
        document.getElementById('leftTitle').textContent = files[0].name;
}

function handleRightFiles(files) {
    console.log('right file is ' + files[0].name);
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('rightPara').textContent = this.result;
        };
        fr.readAsText(files[0]);
        document.getElementById('rightTitle').textContent = files[0].name;
}

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

// .. apply D.R.Y. above

var readTextAloud = function () {
    var s = window.getSelection();
    var range = s.getRangeAt(0);
    var node = s.anchorNode;

    while (range.toString().indexOf(' ') !== 0) {
        range.setStart(node, (range.startOffset - 1));
    }
    range.setStart(node, range.startOffset + 1);

    do {
        range.setEnd(node, range.endOffset + 1);

    } while (range.toString().indexOf(' ') === -1 && range.toString().trim() !== '');
    var str = range.toString().trim();
    // alert(str);

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

    // Bad for performance: run once after new file load: for proof-of-concept code only:
    guessLanguage.info(str, function (languageInfo) {
        // 3 .Display output
        if (languageInfo[0] === 'unknown') {
            console.log('Not enough text has been provided to determine the source language.');
        } else {
            console.log('Detected language of provided text is ' + languageInfo[2] + ' [' + languageInfo[0] + '].');
            msg.lang = languageInfo[0];
        }
    });

    // msg.lang = 'fr';
    msg.rate = 0.6;
    speechSynthesis.speak(msg)

};

// $(".clickable").click(function(e) { // the jquery way (replaces the following lines.  Worth it?)

var clickables = document.getElementsByClassName("clickable");

for (var i = 0; i < clickables.length; i++)
    clickables[i].addEventListener('click', readTextAloud, false);

// todo: when should I remove these listeners, if at all?

// todo: readTextAloud seems to fail on some characters in French text file.
