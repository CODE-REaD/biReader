"use strict";

// todo: store filenames as English and translate to native language for display.
// todo: web storage for things like show help first time.

let linkArray;
// let prevSRStart, prevSREnd;

// Prevent Android context menu so we can use the "long tap" to show word definitions.
// From: https://stackoverflow.com/a/28748222/5025060
/*window.oncontextmenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
};*/

// This prevents Chrome from opening a cut/paste dialog, but does not prevent
// ..it from displaying a popup search link at bottom of screen.  No known
// ..programmatic way of disabling that "feature," user must disable it from
// ..Chrome's "privacy" settings menu:
// window.addEventListener("contextmenu", function(e) { e.preventDefault(); });
window.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    return true;    // true = propagation continues
});

/*window.addEventListener("contextmenu", function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
});*/

// window.scrollTo(0,1);   // Tablet full screen mode

// todo: TTS speed control(s)

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// Reveal the <select> node when the button is clicked:
document.getElementById('libraryLoadButton').addEventListener('click',
    function () {
        document.getElementById('leftFilePopup').style.display = 'inline-block';
    });

document.getElementById('helpButton').addEventListener('click',
    function (event) {
        document.getElementById('Help').style.display = 'inline-block';
        // Click anywhere except Help button turns it off:
        document.addEventListener('click',
            function docClick(f) {
                if (f.target.id != 'helpButton') {
                    document.getElementById('Help').style.display = 'none';
                    document.removeEventListener('click', docClick);
                }
            }
        )
    }, false);

document.getElementById('helpCloseButton').addEventListener('click',
    function () {
        document.getElementById('Help').style.display = 'none';
    });

let leftSel = null;
let libFileOK = false; // Global flag for library file load result

// Load a file when a library selection is made.
document.getElementById('leftFileSelect').addEventListener('change', function () {
    leftSel = document.getElementById('leftFileSelect');
    let leftlibFilePath = leftSel.options[leftSel.selectedIndex].text;  // Left-hand file
    let rightlibFilePath = '';

    let libFileName = leftlibFilePath.replace(/\.[a-z][a-z]$/, "");

    // Select right-hand file:
    // Populate chooser (derived from https://stackoverflow.com/a/17002049/5025060):
    let rightList = document.getElementById("rightFileSelect");
    rightList.length = 0; // empty it
    // rightList.insertAdjacentHTML("beforebegin", "Select right-hand file:");

    // NB: set this BEFORE populating selectList, else first is set as default choice:
    rightList.size = (linkArray.length < 12 ? linkArray.length : 12);

    // Create and append the right-file choice options
    // See also, Option object at http://www.javascriptkit.com/jsref/select.shtml#section2
    //
    linkArray.forEach(function (link) {
        if ((link.replace(/\.[a-z][a-z]$/, "") === libFileName)
            && (link !== leftlibFilePath)) {
            let RFopt = document.createElement("option");
            RFopt.value = link;
            RFopt.text = link;
            rightList.appendChild(RFopt);
        }
    });

    // Now that user has selected lefthand file, show righthand file menu:
    document.getElementById('rightFilePopup').style.display = 'inline-block';

    if (leftlibFilePath.length)
        // libFileOK = false;
        getFileFromLibrary('leftPara', leftlibFilePath, 'leftTitle');

    /*        getFileFromLibrary('leftPara', 'http://bridge.code-read.com/library/' + leftlibFilePath);
            if (libFileOK)
                document.getElementById('leftTitle').textContent = leftlibFilePath;*/
});

document.getElementById('rightFileSelect').addEventListener('change', function () {
    let rightSel = document.getElementById('rightFileSelect');
    let rightlibFilePath = rightSel.options[rightSel.selectedIndex].text;  // Right-hand file
    if (rightlibFilePath.length)
        getFileFromLibrary('rightPara', rightlibFilePath, 'rightTitle');
/*        if (getFileFromLibrary('rightPara', 'http://bridge.code-read.com/library/' + rightlibFilePath))
            document.getElementById('rightTitle').textContent = rightlibFilePath;*/

    document.getElementById('leftFilePopup').style.display = 'none';
    document.getElementById('rightFilePopup').style.display = 'none';

    leftSel.value = "";  // Else we won't trigger again on current choice
});

function getFileFromLibrary(contentElement, fileName, titleElement) {
    let request = new XMLHttpRequest(); // Create new request
    // request.open("GET", url); // Specify URL to fetch
    request.open("GET", 'http://bridge.code-read.com/library/' + fileName); // Specify URL to fetch
    request.onreadystatechange = function () { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            document.getElementById(contentElement).textContent = request.responseText;
            document.getElementById(titleElement).textContent = fileName;
        }
    };
    request.onload = function () {
        libFileOK = true;
    }
    return request.send(null);
}

// When user makes a change to the 'leftFilechoice' field, fire this listener to load
// the file to leftPara:
document.getElementById('leftFileChoice').addEventListener('change',
    function () {
        var fr = new FileReader();
        fr.onload = function () {
            document.getElementById('leftPara').textContent = this.result;
        };
        fr.readAsText(this.files[0]);
        document.getElementById('leftTitle').textContent = this.files[0].name;
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
leftFileColumn.addEventListener("drop", fileDrop, false);
leftFileColumn.addEventListener("paste", pasteToCol, false);

var rightFileColumn = document.getElementById("rightColumn");
rightFileColumn.addEventListener("dragenter", keepItLocal, false);
rightFileColumn.addEventListener("dragover", keepItLocal, false);
rightFileColumn.addEventListener("drop", fileDrop, false);
rightFileColumn.addEventListener("paste", pasteToCol, false);

// document.getElementById('leftPara').addEventListener('DOMSubtreeModified', updateLineSpacing);
// document.getElementById('rightPara').addEventListener('DOMSubtreeModified', updateLineSpacing);

let leftParaObserver = new MutationObserver(updateLineSpacing);
leftParaObserver.observe(document.getElementById('leftPara'), {characterData: true});

let rightParaObserver = new MutationObserver(updateLineSpacing);
rightParaObserver.observe(document.getElementById('rightPara'), {characterData: true});

function updateLineSpacing() {
    // prevSRStart = prevSREnd = 0;

    // First reset both columns to default line height so we can make our computation:
    // var style = getComputedStyle(document.body);
    // console.log("line height: " + style.getPropertyValue('line-height'));
    // const defLineHeight = style.getPropertyValue('line-height');
    const defLineHeight = getComputedStyle(document.body).getPropertyValue('line-height');
    // todo: 1.4 hard coded to match main.css; globalize somehow.
    document.getElementById('leftPara').style.lineHeight = defLineHeight;
    document.getElementById('rightPara').style.lineHeight = defLineHeight;

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

function fileDrop(ev) {
    keepItLocal(ev);
    let dt = ev.dataTransfer;
    let files = dt.files;

    switch (this.id.toString()) {
        case 'leftColumn':
            handleFiles(files, 'leftPara', 'leftTitle');
            break;
        case 'rightColumn':
            handleFiles(files, 'rightPara', 'rightTitle');
            break;
        default:
            console.log('fileDrop: error: source ID is: ' + this.id.toString());
            return;
    }
}

function pasteToCol(ev) {
    let clipboardData, pastedData;
    clipboardData = ev.clipboardData;
    pastedData = clipboardData.getData('Text');

    switch (this.id.toString()) {
        case 'leftColumn':
            document.getElementById('leftPara').textContent = pastedData;
            document.getElementById('leftTitle').textContent = "(pasted)";
            break;
        case 'rightColumn':
            document.getElementById('rightPara').textContent = pastedData;
            document.getElementById('rightTitle').textContent = "(pasted)";
            break;
        default:
            console.log('pasteToCol: error: source ID is: ' + this.id.toString());
            return;
    }
    updateLineSpacing();
}

function handleFiles(files, filePara, fileTitle) {
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

// Set boolean if mouse moved a significant amount; otherwise simply absorb the event:
function mouseMoved(ev) {
    if ((Math.abs(ev.clientX - lastX) > 2) || (Math.abs(ev.clientY - lastY) > 2))
        mouseWasMoved = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    return true;    // true = propagation continues
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let lookingUpWord = false;
let textWasRead = false;
let xlation = '';

async function lookupWord(ev) {
    // todo: some languages such as Japanese and Chinese do not use word separation characters
    // todo: ..in sentences, so exclude this function for those languages.
    let speakRange;
    lookingUpWord = false;  // Not true until we have waited
    mouseWasMoved = false;
    textWasRead = false;    // Set here and recheck after sleep
    // alert(ev.type);

    console.log('============ lookupWord: Event is: ' + ev.type);

/*    if (ev.type === 'touchstart') {
        // Temporarily squelch the pending mousedown:
        ev.target.addEventListener('mousedown', keepItLocal, false);
    }*/

    let textSel = window.getSelection();
    if (!textSel.isCollapsed) {
        speakRange = textSel.getRangeAt(0);
        speakRange.collapse(true);  // So we can get new selection (below)
    }

    if (speechSynthesis.pending || speechSynthesis.speaking)
        speechSynthesis.cancel();

    await sleep(400);

    if (textWasRead)    // A short click occurred, so read text instead
        // ev.target.addEventListener('mousedown', lookupWord, false);
        return true;    // true = propagation continues

    if (mouseWasMoved) {    // User is dragging over text, rather than long-clicking
        console.log('lookupWord(): mouse was moved, abort.');
        mouseWasMoved = false;  // For next time
        // ev.target.addEventListener('mousedown', lookupWord, false);
        return true; // true = propagation continues
    }
    lookingUpWord = true;   // Tell other handlers we will handle this action exclusively

    textSel = window.getSelection();
    speakRange = textSel.getRangeAt(0);
    let node = textSel.anchorNode;

    // Find and include start of word containing clicked region:
    while (speakRange.startOffset !== 0) {                         // start of node
        speakRange.setStart(node, speakRange.startOffset - 1);     // back up 1 char
        if (speakRange.toString().search(/^[\s、。"'({[]/) === 0) { // start of word
            speakRange.setStart(node, speakRange.startOffset + 1); // move forward char
            break;
        }
    }

    // Find and include end of word containing clicked region:
    let searchStr = "";
    while (speakRange.endOffset < node.length) {                // end of node
        speakRange.setEnd(node, speakRange.endOffset + 1);      // look ahead 1 char
        searchStr = speakRange.toString().slice(-2);            // Last 2 chars
        // if ((searchStr.search(/\W/) != -1) && (searchStr.search(/\-/) === -1)) { // end of word
        // if (searchStr.search(/\p{White_Space}/u) != -1) {    // end of word (international)
        if (searchStr.search(/[\r\n\s.,:;。、"'\]\)}]/) !== -1) {    // end of word (international)
            speakRange.setEnd(node, speakRange.endOffset - 1); // back 1 char
            break;
        }
    }

    let speakStr = speakRange.toString().trim();

    console.log('lookupWord: ' + speakStr);

    getTranslation("from=fra&dest=eng&phrase=", speakStr);
    // alert(speakStr + " translated: " + xlation);
    // console.log(speakStr + " translated: " + xlation);

    // https://glosbe.com/gapi/translate?from=pol&dest=eng&format=json&phrase=witaj&pretty=true

    let speakMsg = new SpeechSynthesisUtterance(speakStr);
    speechSynthesis.speak(speakMsg);

    // ev.target.addEventListener('mousedown', lookupWord, false);
    // lookingUpWord = false;
};

// todo: firefox TTS, see https://hacks.mozilla.org/2016/01/firefox-and-the-web-speech-api/
//
let readTextAloud = function () {
    if (lookingUpWord) return true; // A long mouse click occurred, so look up word instead
    // readingTextAloud = true;
    textWasRead = true;

    // Derived from https://stackoverflow.com/a/9304990/5025060:
    let textSel = window.getSelection();
    let speakRange = textSel.getRangeAt(0);
    let node = textSel.anchorNode;

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

let clickables = document.getElementsByClassName('clickable');

for (let elNum = 0; elNum < clickables.length; elNum++) {
    clickables[elNum].addEventListener('mousedown', lookupWord, {passive:true});
    clickables[elNum].addEventListener('touchstart', lookupWord, {passive:true}); // required for tablet

    clickables[elNum].addEventListener('mousemove', mouseMoved, {passive:true});
    clickables[elNum].addEventListener('touchmove', mouseMoved, {passive:true}); // tablet

    clickables[elNum].addEventListener('click', readTextAloud, {passive:true});

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
        let selectList = document.getElementById("leftFileSelect");
        selectList.length = 0; // empty it
        // selectList.insertAdjacentHTML("beforebegin", "Select left-hand file:");

        // NB: set this BEFORE populating selectList, else first is set as default choice:
        selectList.size = (linkArray.length < 12 ? linkArray.length : 12);

        // Create and append the file choice options
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

function getTranslation(prefix, toXlate) {
    // JSONP needed because glosbe.com does not provide CORS:
    // $('#glosbeBuf').html("Translations appear here.");
    $.getJSON("https://glosbe.com/gapi/translate?format=json&" + prefix + toXlate + "&callback=?", function (json) {
        if (json !== "Nothing found.") {
            // $('#glosbeBuf').html(JSON.stringify(json));
            if (json.tuc.length)
            // $('#glosbeBuf').html(JSON.stringify(json.tuc[0].meanings[0].text));
                if (json.tuc[0].phrase)
                    $('#glosbeBuf').html(toXlate + ': ' + JSON.stringify(json.tuc[0].phrase.text));
                else
                    $('#glosbeBuf').html(toXlate + ': ' + JSON.stringify(json.tuc[0].meanings[0].text));
            else
                $('#glosbeBuf').html(toXlate + ': Not found.');
            // xlated = JSON.stringify(json);
            // xlation = JSON.stringify(json);
        } else {
            // $.getJSON("http://glosbe.com/gapi/translate?from=eng&dest=rus&format=json&phrase=hello&pretty=true" + "?callback=?", function (json) {
            $.getJSON("https://glosbe.com/gapi/translate?format=json&" + toXlate + "&callback=?", function (json) {
                console.log(json);
                // $('#glosbeBuf').html('<h2 class="loading">Nothing found.</h2><img id="thePoster" src=' + json.posters[0].image.url + ' />');
                $('#glosbeBuf').html('<h3>' + JSON.stringify(json) + '</h3>');
            });
        }

        // https://glosbe.com/gapi/translate?from=fra&dest=eng&format=json&phrase=avec&pretty=true

    });
    return false;
}
