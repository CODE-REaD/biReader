"use strict";

// todo: store filenames as English and translate to native language for display.

// let voiceList = [];

let linkArray;
let prevSRStart, prevSREnd;

// todo: TTS speed control(s)

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// todo: Apply D.R.Y. here...

// Reveal the <select> node when the button is clicked:
document.getElementById('libraryLoadButton').addEventListener('click',
    function () {
        document.getElementById('popUpDiv').style.display = 'inline-block';
    });

document.getElementById('helpButton').addEventListener('click',
    function () {
        document.getElementById('Help').style.display = 'inline-block';
    });

document.getElementById('helpCloseButton').addEventListener('click',
    function () {
        document.getElementById('Help').style.display = 'none';
    });

// todo: consolidate next 3 functions (?):

// Load a file when a library selection is made.
document.getElementById('popupSelect').addEventListener('change', function () {
    var e = document.getElementById('popupSelect');
    let leftlibFilePath = e.options[e.selectedIndex].text;  // Left-hand file
    let rightlibFilePath = '';

    let libFileName = leftlibFilePath.replace(/\.[a-z][a-z]$/, "");

    // Select right-hand file:
    linkArray.forEach(function (link) {
        if ((link.replace(/\.[a-z][a-z]$/, "") === libFileName)
            && (link !== leftlibFilePath))
            rightlibFilePath = link;
    });

    if (leftlibFilePath.length)
        getFileFromLibrary('leftPara', 'http://bridge.code-read.com/library/' + leftlibFilePath,
            loadedAfile);
    document.getElementById('leftTitle').textContent = leftlibFilePath;
    if (rightlibFilePath.length)
        getFileFromLibrary('rightPara', 'http://bridge.code-read.com/library/' + rightlibFilePath,
            loadedAfile);
    document.getElementById('rightTitle').textContent = rightlibFilePath;
    document.getElementById('popUpDiv').style.display = 'none';
});

function getFileFromLibrary(Element, url, callback) {
    let request = new XMLHttpRequest(); // Create new request
    request.open("GET", url); // Specify URL to fetch
    request.onreadystatechange = function () { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            document.getElementById(Element).textContent = request.responseText;
            callback(Element);
        }
    };
    request.send(null);
}

// Register file loaded so updateLineSpacing() is only called when both (async AJAX)
// ..file loads completed:
function loadedAfile(Element) {
    /*
    obsoleted: using DOMSubtreeModified trigger instead

        if (Element === 'rightPara')
            updateLineSpacing();
    */
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
        // updateLineSpacing();
    }
);

document.getElementById('rightFileChoice').addEventListener('change',
    function () {
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('rightPara').textContent = this.result;
        };
        fr.readAsText(this.files[0]);
        document.getElementById('rightTitle').textContent = this.files[0].name;
        // updateLineSpacing();
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

document.getElementById('leftPara').addEventListener('DOMSubtreeModified', updateLineSpacing);
document.getElementById('rightPara').addEventListener('DOMSubtreeModified', updateLineSpacing);

function updateLineSpacing() {

    prevSRStart = prevSREnd = 0;

    // todo: 1.4 hard coded to match main.css; globalize somehow.
    document.getElementById('leftPara').style.lineHeight = 1.4;
    document.getElementById('rightPara').style.lineHeight = 1.4;

    let leftHeight = document.getElementById('leftPara').scrollHeight;
    let rightHeight = document.getElementById('rightPara').scrollHeight;
    let leftToRightRatio = leftHeight / rightHeight;
    // console.log('left height: ' + leftHeight + ' right height: ' + rightHeight
    //     + ', Ratio = ' + leftToRightRatio);

    //todo: check for "edge" cases here (e.g., less that a screenful of text):
    if (leftToRightRatio < 1)
    // Stretch left side:
        document.getElementById('leftPara').style.lineHeight = 1.4 / leftToRightRatio;
    else if (leftToRightRatio > 1)
    // Stretch right side:
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

let mouseWasMoved = false;
let lastX = window.clientX;
let lastY = window.clientY;

function mouseMoved(ev) {
    // console.log('mouseMoved() called.' + "X = " + ev.clientX + " Y = " + ev.clientY);
    // console.log('mouseMoved() called.');
    if ((Math.abs(ev.clientX - lastX) > 2) || (Math.abs(ev.clientY - lastY) > 2))
        mouseWasMoved = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let lookingUpWord = false;
let textWasRead = false;

async function lookupWord(ev) {
    lookingUpWord = false;  // Not true until we have waited
    mouseWasMoved = false;
    textWasRead = false;    // Wait for it..
    await sleep(500);
    // if (readingTextAloud) return;  // A short click occurred, so read text instead
    if (textWasRead) {
        // textWasRead = false;  // For next time
        return;
    }
    if (mouseWasMoved) {
        console.log('lookupWord(): mouse was moved, abort.');
        mouseWasMoved = false;  // For next time
        return;
    }
    lookingUpWord = true;

    let textSel = window.getSelection();
    let speakRange = textSel.getRangeAt(0);
    let node = textSel.anchorNode;

    // Find and include start of word containing clicked region:
    while (speakRange.startOffset !== 0) {                         // start of node
        speakRange.setStart(node, speakRange.startOffset - 1);     // back up 1 char
        if (speakRange.toString().search(/^\s/) === 0) { // start of word
            speakRange.setStart(node, speakRange.startOffset + 1); // move forward char
            break;
        }
    }

    // Find and include end of word containing clicked region:
    let searchStr = "";
    while (speakRange.endOffset < node.length) {                // end of node
        speakRange.setEnd(node, speakRange.endOffset + 1);      // look ahead 1 char
        searchStr = speakRange.toString().slice(-2);            // Last 2 chars
        if (searchStr.search(/[\r\n\s]/) != -1) { // end of word
            speakRange.setEnd(node, speakRange.endOffset - 1); // back 1 char
            break;
        }
    }

    let speakStr = speakRange.toString().trim();

    console.log('lookupWord: ' + speakStr);

    let speakMsg = new SpeechSynthesisUtterance(speakStr);
    speechSynthesis.speak(speakMsg);

    // lookingUpWord = false;
};

// todo: firefox TTS, see https://hacks.mozilla.org/2016/01/firefox-and-the-web-speech-api/
//
let readTextAloud = function () {
    if (lookingUpWord) return; // A long mouse click occurred, so look up word instead
    // readingTextAloud = true;
    textWasRead = true;

    // derived from https://stackoverflow.com/a/9304990/5025060:
    let textSel = window.getSelection();
    let speakRange = textSel.getRangeAt(0);
    let node = textSel.anchorNode;

    // Attempt to interrupt current speech if user makes a new selection:
    if (speechSynthesis.pending || speechSynthesis.speaking) {
        speechSynthesis.cancel();
        readTextAloud();
        return;
    }

    /*
        if (speakRange.startOffset >= prevSRStart &&
        speakRange.endOffset <= prevSREnd) {
            alert('Clicked within highlight');
        }
        */

    // Find and include start of sentence containing clicked region:
    while (speakRange.startOffset !== 0) {                         // start of node
        speakRange.setStart(node, speakRange.startOffset - 1);     // back up 1 char
        // if (speakRange.toString().search(/[.。!?:\n]\s*/) === 0) { // start of sentence
        if (speakRange.toString().search(/^[.。!?:\n]\s*/) === 0) { // start of sentence
            speakRange.setStart(node, speakRange.startOffset + 1); // move forward char
            break;
        }
    }

    // Find and include end of sentence containing clicked region:
    let searchStr = "";
    while (speakRange.endOffset < node.length) {                // end of node
        speakRange.setEnd(node, speakRange.endOffset + 1);      // look ahead 1 char
        searchStr = speakRange.toString().slice(-2);            // Last 2 chars
        if (searchStr.search(/[.!?:][\r\n\s]|(\r|\n|\r\n){2}|。/) === 0) { // end of sentence
            speakRange.setEnd(node, speakRange.endOffset - 1); // back 1 char
            break;
        }
    }


    let speakStr = speakRange.toString().trim();
    let speakMsg = new SpeechSynthesisUtterance(speakStr);

    /*   // Highlight selected text (some browsers lose highlighting during speech):
       // todo: this triggers updateLineSpacing() due to 'changed' event.

       // First un-highlight any previously selected text(s):
       while (true) {
           let oldHL = document.getElementById('myHighlight');
           if (oldHL) {
               var pa = oldHL.parentNode;
               while (oldHL.firstChild) {
                   pa.insertBefore(oldHL.firstChild, oldHL);
               }
               oldHL.remove();
           } else break;
       }

       var newHL = document.createElement("span");
       newHL.setAttribute(
           // "border:1px dotted black;"
           // "background-color: yellow; display: inline;"
           "class",
           "highlighted"
           // "font-style: italic; color: red;"
       );
       newHL.setAttribute(
           "id", "myHighlight" // Mark our place so we can remove the span
       );
       speakRange.surroundContents(newHL);

       // Save for "click within range" detection:
       prevSRStart = speakRange.startOffset;
       prevSREnd = speakRange.endOffset;

       speakRange.collapse(true);*/

    // todo: Bad for performance: run once after new file load: for proof-of-concept code only:
    // (Actually, this MAY be a requirement if languages are mixed within a document):
    guessLanguage.info(speakStr, function (languageInfo) {
        if (languageInfo[0] === 'unknown') {
            console.log('Not enough text has been provided to determine the source language.');
        } else {
            console.log('Detected language of provided text is ' + languageInfo[2] + ' [' + languageInfo[0] + '].');
            speakMsg.lang = languageInfo[0];
        }
    });

    speakMsg.rate = 0.8; // todo: make this a user setting
    speechSynthesis.speak(speakMsg);

    // workaround for Chrome 15 second limit on online TTS,
    // see https://stackoverflow.com/questions/42875726/speechsynthesis-speak-in-web-speech-api-always-stops-after-a-few-seconds-in-go
    if (navigator.userAgent.toLowerCase().indexOf('chrome')) {  // Only run under Chrome
        let resumeTimer = setInterval(function () {
            // console.log(synth.speaking);
            if (!speechSynthesis.speaking) clearInterval(resumeTimer);
            else speechSynthesis.resume();
        }, 14000);
    }
    // readingTextAloud = false;
};

/*let transDict = function() {
    let textSel = window.getSelection();
    let lookupRange = textSel.getRangeAt(0);
    let node = textSel.anchorNode;
    alert(lookupRange);
}*/

let clickables = document.getElementsByClassName('clickable');

for (let elNum = 0; elNum < clickables.length; elNum++) {
    clickables[elNum].addEventListener('mousedown', lookupWord, false);
    clickables[elNum].addEventListener('mousemove', mouseMoved, false);
    clickables[elNum].addEventListener('touchstart', lookupWord, false); // tablet
    clickables[elNum].addEventListener('touchmove', mouseMoved, false); // tablet
    clickables[elNum].addEventListener('click', readTextAloud, false);
    // clickables[elNum].addEventListener('dblclick', transDict, false);
    clickables[elNum].addEventListener('mouseup', keepItLocal, false); // else touchscreen browser removes highlighting
}
// todo: when should I remove these listeners, if at all?

// Preload library file list to <select>:
//
var request = new XMLHttpRequest(); // Create new request
var el = document.createElement('html');

request.open("GET", "http://bridge.code-read.com/library/");
request.onreadystatechange = function () { // Define event listener
    // If the request is complete and was successful
    if (request.readyState === 4 && request.status === 200) {
        el.innerHTML = request.responseText;
        let libraryLinks = el.getElementsByTagName('a'); // Live NodeList of your anchor elements
        linkArray = []; // global
        let libFileName = '';
        for (let linkInd = 5; linkInd < libraryLinks.length; linkInd++) {
            libFileName = libraryLinks[linkInd].href.replace(/.*\//g, ""); // Remove all before last '/'
            libFileName.length && linkArray.push(libFileName);
        }
        // Populate chooser (derived from https://stackoverflow.com/a/17002049/5025060):
        let selectList = document.getElementById("popupSelect");
        selectList.length = 0; // empty it
        selectList.insertAdjacentHTML("beforebegin", "Select left-hand file:");

        // NB: set this BEFORE populating selectList, else first is set as default choice:
        selectList.size = (linkArray.length < 12 ? linkArray.length : 12);

        //Create and append the options
        // See also, Option object at http://www.javascriptkit.com/jsref/select.shtml#section2
        for (let linkNum = 0; linkNum < linkArray.length; linkNum++) {
            let option = document.createElement("option");
            option.value = linkArray[linkNum];
            option.text = linkArray[linkNum];
            selectList.appendChild(option);
        }
    }
};
request.send(null); // Send the request now

// https://stackoverflow.com/a/22978802 says,
// "...the voice list is loaded async to the page. An onvoiceschanged
// event is fired when they are loaded":
let voiceList = [];
speechSynthesis.onvoiceschanged = function () {
    let ssVoices = this.getVoices();
    for (let voiceInd = 0; voiceInd < ssVoices.length; voiceInd++)
        voiceList[voiceInd] = ssVoices[voiceInd].name + ' (' + ssVoices[voiceInd].lang + ')';

    let vListEl = document.getElementById('vList');
    vListEl.insertAdjacentHTML("beforeend", "<ul>");
    voiceList.forEach(function (listMem) {
        vListEl.insertAdjacentHTML("beforeend", "<li>" + listMem);
    })
    vListEl.insertAdjacentHTML("beforeend", "</ul>");
};


