"use strict";

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// todo: Apply D.R.Y. here...
var leftFileDrop = document.getElementById("leftColumn"); // use column rather than para as para isn't inflated before a file is loaded
leftFileDrop.addEventListener("dragenter", dragenter, false);
leftFileDrop.addEventListener("dragover", dragover, false);
leftFileDrop.addEventListener("drop", leftDrop, false);
leftFileDrop.addEventListener("paste", leftPaste, false);

var rightFileDrop = document.getElementById("rightColumn");
rightFileDrop.addEventListener("dragenter", dragenter, false);
rightFileDrop.addEventListener("dragover", dragover, false);
rightFileDrop.addEventListener("drop", rightDrop, false);
rightFileDrop.addEventListener("paste", rightPaste, false); //todo: this replaces leftFileDrop.addEventListener (above).  Why?

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

// todo: for some reason this is never triggered: only rightPaste:
function leftPaste(e) {
    var clipboardData, pastedData;
    e.stopPropagation();
    e.preventDefault();

    // Get pasted data via clipboard API
    // clipboardData = e.clipboardData || window.clipboardData;
    clipboardData = e.clipboardData;
    pastedData = clipboardData.getData('Text');

    // Do whatever with pasteddata
    alert(pastedData);
    document.getElementById('leftPara').textContent = pastedData;
}

function rightPaste(e) {
    var clipboardData, pastedData;
    e.stopPropagation();
    e.preventDefault();

    // Get pasted data via clipboard API
    // clipboardData = e.clipboardData || window.clipboardData;
    clipboardData = e.clipboardData;
    pastedData = clipboardData.getData('Text');

    // Do whatever with pasteddata
    alert(pastedData);
    document.getElementById('rightPara').textContent = pastedData;
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
    // derived from https://stackoverflow.com/a/9304990/5025060:
    var s     = window.getSelection();
    var range = s.getRangeAt(0);
    var node  = s.anchorNode;

    // Move back to letter after first ' ':
    // fixed bug: crashes if run from first word in text (no preceding space).
    // todo: this fails if word is at start of paragraph (no preceding space, backs up to
    // preceding line).

/*
    while (range.startOffset > 0 && range.toString()[0].match(/\w/))
    {
        range.setStart(range.startContainer, range.startOffset - 1);
    }

    while (range.endOffset < range.endContainer.length &&
           range.toString()[range.toString().length - 1].match(/\w/))
    {
        range.setEnd(range.endContainer, range.endOffset + 1);
    }
*/


    while ((range.toString().indexOf(' ') !== 0)) {
        if (range.StartOffset === 0) break;
        range.setStart(node, (range.startOffset - 1))
    }
    range.setStart(node, range.startOffset + 1);

    //
    do {
        range.setEnd(node, range.endOffset + 1);
    } while (range.toString().indexOf(' ') === -1 &&
    range.toString().trim() !== '');

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
    speechSynthesis.cancel(); // try to address "freezing"; see https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts
    speechSynthesis.speak(msg)

};

// $(".clickable").click(function(e) { // the jquery way (replaces the following lines.  Worth it?)

var clickables = document.getElementsByClassName("clickable");

for (var i = 0; i < clickables.length; i++)
    clickables[i].addEventListener('click', readTextAloud, false);

// todo: when should I remove these listeners, if at all?

// todo: readTextAloud seems to fail on some characters in French text file.
