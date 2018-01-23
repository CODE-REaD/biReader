"use strict";

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// todo: Apply D.R.Y. here...

// Issue an HTTP GET request for the contents of the specified URL.
// When the response arrives successfully, verify that it is plain text
// and if so, pass it to the specified callback function
/*function getFileFromLibrary(url, callback) {
    console.log('getFileFromLibrary running.');
    var request = new XMLHttpRequest(); // Create new request
    request.open("GET", url); // Specify URL to fetch
    request.onreadystatechange = function() { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            var type = request.getResponseHeader("Content-Type");
            if (type.match(/^text/)) // Make sure response is text
                callback(request.responseText); // Pass it to callback
        }
    };
    request.send(null); // Send the request now
}*/

document.getElementById('libraryShowButton').addEventListener('click',
    function () { showLibraryDirectory('http://parallel.code-read.com/library/');
    });

document.getElementById('libraryLoadButton').addEventListener('click',
    function () { document.getElementById('popUpDiv').style.display = 'inline-block';
    });

document.getElementById('popupSelect').addEventListener('change', function() {
    var e = document.getElementById('popupSelect');
    var libFileName = e.options[e.selectedIndex].text;
    getFileFromLibrary('http://parallel.code-read.com/library/' + libFileName);
    document.getElementById('popUpDiv').style.display = 'none';
});

function getFileFromLibrary(url) {
    // console.log('getFileFromLibrary running.');
    var request = new XMLHttpRequest(); // Create new request
    request.open("GET", url); // Specify URL to fetch
    request.onreadystatechange = function () { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            // var type = request.getResponseHeader("Content-Type");
            // if (type.match(/^text/)) // Make sure response is text
                loadLibraryFile(request.responseText);
        }
    };
    request.send(null); // Send the request now
}

function loadLibraryFile(fileContents) {
    // var docPositions = fileContents.match(/\#\[LangBridge\:/g);
    var docPositions = fileContents.split(/#\[LangBridge\:..\:.*\]/g);
    document.getElementById('leftPara').textContent = docPositions[1]; // skip newline
    document.getElementById('rightPara').textContent = docPositions[2];
    updateLineSpacing();
}

/*document.getElementById('libraryLoadButton').addEventListener('click',
    function () {
        console.log('loadfromlibrary running from event listener..')
        getFileFromLibrary('http://parallel.code-read.com/library/en-fr-180112-test.bridge',
        gotLibraryFile);
});*/

/*document.getElementById('baseDiv').addEventListener('click', function() {
    document.getElementById('popUpDiv').style.display = 'inline-block';
});*/



/*function chooseLibraryFile(fileList) {
    document.getElementById('leftPara').textContent = docPositions[1]; // skip newline
    document.getElementById('rightPara').textContent = docPositions[2];
}*/

function showLibraryDirectory(url) {
    var request = new XMLHttpRequest(); // Create new request
    var el = document.createElement('html');

    request.open("GET", url); // Specify URL to fetch
    request.onreadystatechange = function () { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            // var type = request.getResponseHeader("Content-Type");
            // if (type.match(/^text/)) // Make sure response is text
            console.log('showLibraryDirectory: ', request.responseText);
            el.innerHTML = request.responseText;
            var libraryLinks = el.getElementsByTagName('a'); // Live NodeList of your anchor elements
            var linkArray = [];
            for (i = 5; i < libraryLinks.length; i++) {
                console.log('link: ' + libraryLinks[i]);
                linkArray.push(libraryLinks[i].href.replace(/.*\//g, ""));
            }
            console.log('my links: ' + linkArray);

            chooseLibraryFile(linkArray);
        }
    };
    request.send(null); // Send the request now
}


// When user makes a change to the 'filechoice1' field, fire this listener to load
// the file to leftPara:
document.getElementById('leftFileChoice').addEventListener('change',
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

document.getElementById('rightFileChoice').addEventListener('change',
        function () {
            var fr = new FileReader();
            fr.onload = function () {
                document.getElementById('rightPara').textContent = this.result;
            };
            // none of these allows ANSI encoding:
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
leftFileColumn.addEventListener("dragenter", keepItLocal, false);
leftFileColumn.addEventListener("dragover", keepItLocal, false);
leftFileColumn.addEventListener("drop", leftDrop, false);
leftFileColumn.addEventListener("paste", leftPaste, false);

var rightFileColumn = document.getElementById("rightColumn");
rightFileColumn.addEventListener("dragenter", keepItLocal, false);
rightFileColumn.addEventListener("dragover", keepItLocal, false);
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

    //todo: check for "edge" cases here (e.g., less that a screenful of text):
    if (leftToRightRatio < 1)
        document.getElementById('leftPara').style.lineHeight = 1.4 * leftToRightRatio;
    else if (leftToRightRatio > 1)
        document.getElementById('rightPara').style.lineHeight = 1.4 * leftToRightRatio
}

function keepItLocal(e) {
    e.stopPropagation();
    e.preventDefault();
}

function leftDrop(e) {
    keepItLocal(e);
    var dt = e.dataTransfer;
    var files = dt.files;
    handleFiles(files, 'leftPara', 'leftTitle');
}

function rightDrop(e) {
    keepItLocal(e);
    var dt = e.dataTransfer;
    var files = dt.files;
    handleFiles(files, 'rightPara', 'rightTitle');
}

function leftPaste(e) {
    var clipboardData, pastedData;
    clipboardData = e.clipboardData;
    pastedData = clipboardData.getData('Text');
    document.getElementById('leftPara').textContent = pastedData;
    document.getElementById('leftTitle').textContent = "(pasted)";
    updateLineSpacing();
}

function rightPaste(e) {
    var clipboardData, pastedData;
    clipboardData = e.clipboardData;
    pastedData = clipboardData.getData('Text');
    document.getElementById('rightPara').textContent = pastedData;
    document.getElementById('rightTitle').textContent = "(pasted)";
    updateLineSpacing();
}

/*
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
*/

function handleFiles(files, filePara, fileTitle) {
    console.log('right file is ' + files[0].name);
    var fr = new FileReader();
    fr.onload = function () {
        document.getElementById(filePara).textContent = this.result;
        updateLineSpacing();
    };
    fr.readAsText(files[0]);
    document.getElementById(fileTitle).textContent = files[0].name;
}

// .. apply D.R.Y. above

/*function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}*/

// todo: firefox, see https://hacks.mozilla.org/2016/01/firefox-and-the-web-speech-api/
//
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

    while (range.startOffset !== 0) {                   // start of node
        range.setStart(node, range.startOffset - 1);     // back up 1 char
        if (range.toString().search(/[.!?:\n]\s*/) === 0) {      // start of sentence
            range.setStart(node, range.startOffset + 1);// move forward chars
            break;
        }
    }

    while (range.endOffset < node.length) {         // end of node
        range.setEnd(node, range.endOffset + 1);     // forward 1 char
        if (range.toString().slice(-2).search(/[.!?:][\n\s]/) !== -1) { // end of sentence
            range.setEnd(node, range.endOffset - 1); // back 1 char
            break;
        }
    }

    var str = range.toString().trim();
    var msg = new SpeechSynthesisUtterance(str);

    // Bad for performance: run once after new file load: for proof-of-concept code only:
    // (Actually, this may be a requirement if languages are mixed within a document):
    guessLanguage.info(str, function (languageInfo) {
        if (languageInfo[0] === 'unknown') {
            console.log('Not enough text has been provided to determine the source language.');
        } else {
            console.log('Detected language of provided text is ' + languageInfo[2] + ' [' + languageInfo[0] + '].');
            msg.lang = languageInfo[0];
        }
    });


    var voices = speechSynthesis.getVoices();

    for(i = 0; i < voices.length ; i++)
        console.log(voices[i].lang);

        // console.log('available voices: ' + speechSynthesis.getVoices());

    // List available voices
    // (from https://stackoverflow.com/questions/27702842/html5-speech-synthesis-api-voice-languages-support):
    speechSynthesis.onvoiceschanged = function () {
        var voices = this.getVoices();
        console.log(voices);
        for(i = 0; i < voices.length ; i++)
        console.log(voices[i].lang + '; ' + voices[i].name);
    };

    msg.rate = 0.8;
    speechSynthesis.speak(msg);

    // workaround for Chrome 15 second limit on online TTS,
    // see https://stackoverflow.com/questions/42875726/speechsynthesis-speak-in-web-speech-api-always-stops-after-a-few-seconds-in-go
    // todo: only run under Chrome
    var r = setInterval(function () {
        // console.log(synth.speaking);
        if (!speechSynthesis.speaking) clearInterval(r);
        else speechSynthesis.resume();
    }, 14000);
};

// Retrieve file from library: (synchronous: should probably avoid):
//
/*function getFileFromLibrary(){
    // read from URL location
    var request = new XMLHttpRequest();
    // request.open('GET', 'http://www.puzzlers.org/pub/wordlists/pocket.txt', true);
    request.open('GET', 'http://parallel.code-read.com/library/en-fr-180112-test.bridge', true);
    request.send(null);
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var type = request.getResponseHeader('Content-Type');
            if (type.indexOf("text") !== 1) {
                return request.responseText;
            }
        }
    }
}*/



// $(".clickable").click(function(e) { // the jquery way (replaces the following lines.  Worth it?)

var clickables = document.getElementsByClassName("clickable");

for (var i = 0; i < clickables.length; i++)
    clickables[i].addEventListener('click', readTextAloud, false);

// todo: when should I remove these listeners, if at all?

// fixed: readTextAloud seems to fail on some characters in French text file.
// (caused by ANSI file format, fixed by requiring UTF8).

