"use strict";

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// todo: Apply D.R.Y. here...

// When user makes a change to the 'filechoice1' field, fire this listener to load
// the file to leftPara:
document.getElementById('leftFileChoice')
    .addEventListener(
        'change',
        function () {
            var fr = new FileReader();
            fr.onload = function () {
                document.getElementById('leftPara').textContent = this.result;
            };
            fr.readAsText(this.files[0]);
            document.getElementById('leftTitle').textContent = this.files[0].name;
            updateLineSpacing();
        }
    );

document.getElementById('rightFileChoice')
    .addEventListener(
        'change',
        function () {
            var fr = new FileReader();
            fr.onload = function () {
                document.getElementById('rightPara').textContent = this.result;
            };
            // fr.readAsBinaryString(this.files[0]);
            // fr.readAsText(this.files[0], 'ANSI'); // make high-bit characters display properly
            // fr.readAsText(this.files[0], 'CP1251'); // make high-bit characters display properly
            // fr.readAsText(this.files[0], 'windows-1252'); // make high-bit characters display properly
            // fr.readAsText(this.files[0],  'ISO-8859-4'); // make high-bit characters display properly
            fr.readAsText(this.files[0]);
            document.getElementById('rightTitle').textContent = this.files[0].name;
            updateLineSpacing();
        }
    );

var leftFileColumn = document.getElementById("leftColumn"); // use column rather than para as para isn't inflated before a file is loaded
leftFileColumn.addEventListener("dragenter", dragenter, false);
leftFileColumn.addEventListener("dragover", dragover, false);
leftFileColumn.addEventListener("drop", leftDrop, false);
leftFileColumn.addEventListener("paste", leftPaste, false);

var rightFileColumn = document.getElementById("rightColumn");
rightFileColumn.addEventListener("dragenter", dragenter, false);
rightFileColumn.addEventListener("dragover", dragover, false);
rightFileColumn.addEventListener("drop", rightDrop, false);
rightFileColumn.addEventListener("paste", rightPaste, false);

function updateLineSpacing() {
    console.log('Change to a column detected.  Updating line spacing.');
    var leftLength = document.getElementById('leftPara').textContent.length;
    var rightLength = document.getElementById('rightPara').textContent.length;
    var leftToRightRatio = leftLength / rightLength;
    console.log('Left length = ' + leftLength + ', Right length = ' + rightLength
    + ', Ratio = ' + leftToRightRatio);

    // todo: 1.4 hard coded to match main.css; globalize somehow.
    document.getElementById('leftPara').style.lineHeight = 1.4;
    document.getElementById('rightPara').style.lineHeight = 1.4;

    if (leftToRightRatio < 1)
        document.getElementById('leftPara').style.lineHeight = 1.4 * leftToRightRatio
    else if (leftToRightRatio > 1)
        document.getElementById('rightPara').style.lineHeight = 1.4 * leftToRightRatio
}

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

function leftPaste(e) {
    var clipboardData, pastedData;
    e.stopPropagation();
    e.preventDefault();
    clipboardData = e.clipboardData;
    pastedData = clipboardData.getData('Text');
    document.getElementById('leftPara').textContent = pastedData;
    updateLineSpacing();
}

function rightPaste(e) {
    var clipboardData, pastedData;
    e.stopPropagation();
    e.preventDefault();
    clipboardData = e.clipboardData;
    pastedData = clipboardData.getData('Text');
    document.getElementById('rightPara').textContent = pastedData;
    updateLineSpacing();
}

function handleLeftFiles(files) {
    console.log('left file is ' + files[0].name);
    var fr = new FileReader();
    fr.onload = function () {
        document.getElementById('leftPara').textContent = this.result;
        updateLineSpacing();
    };
    fr.readAsText(files[0]);
    document.getElementById('leftTitle').textContent = files[0].name;
}

function handleRightFiles(files) {
    console.log('right file is ' + files[0].name);
    var fr = new FileReader();
    fr.onload = function () {
        document.getElementById('rightPara').textContent = this.result;
        updateLineSpacing();
    };
    fr.readAsText(files[0]);
    document.getElementById('rightTitle').textContent = files[0].name;
}

// .. apply D.R.Y. above

/*function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}*/

var readTextAloud = function () {
    // derived from https://stackoverflow.com/a/9304990/5025060:
    var s     = window.getSelection();
    var range = s.getRangeAt(0);
    var node  = s.anchorNode;

    // Attempt to interrupt current speech if user makes a new selection:
    if (speechSynthesis.pending || speechSynthesis.speaking) {
        speechSynthesis.cancel();
        readTextAloud();
    }

/*
    while (speechSynthesis.speaking)
        await sleep(300);
*/

    while (range.startOffset !== 0) {                   // start of node
        range.setStart(node, range.startOffset - 1)     // back up 1 char
        if (range.toString().search(/[.!?:\n]\s*/) === 0) {      // start of sentence
            range.setStart(node, range.startOffset + 1);// move forward chars
            break;
        }
    }

    while (range.endOffset < node.length) {         // end of node
        range.setEnd(node, range.endOffset + 1)     // forward 1 char
        if (range.toString().search(/[.!?:][\n\s]/) !== -1) { // end of sentence
            range.setEnd(node, range.endOffset - 1);// back 1 char
            break;
        }
    }

    var str = range.toString().trim();
    var msg = new SpeechSynthesisUtterance(str);

    // Bad for performance: run once after new file load: for proof-of-concept code only:
    // (Actually, this may be a requirement if languages are mixed within a document):
    guessLanguage.info(str, function (languageInfo) {
        // 3 .Display output
        if (languageInfo[0] === 'unknown') {
            console.log('Not enough text has been provided to determine the source language.');
        } else {
            console.log('Detected language of provided text is ' + languageInfo[2] + ' [' + languageInfo[0] + '].');
            msg.lang = languageInfo[0];
        }
    });

    msg.rate = 0.6;
    speechSynthesis.speak(msg)
};

// $(".clickable").click(function(e) { // the jquery way (replaces the following lines.  Worth it?)

var clickables = document.getElementsByClassName("clickable");

for (var i = 0; i < clickables.length; i++)
    clickables[i].addEventListener('click', readTextAloud, false);

// todo: when should I remove these listeners, if at all?

// todo: readTextAloud seems to fail on some characters in French text file.
