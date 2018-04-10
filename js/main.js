/* biReader - your parallel reading resource.
Copyright (C) 2018 Carson Wilson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.*/

"use strict";

// todo: store filenames as English and translate to native language for display.
// todo: web storage for things like show help first time.
// todo: pinch zoom to resize text
// todo: default to bold font on high density screens only
// todo: store current font, reading speed between sessions (web storage, same as 'bold' setting)
// todo: filename.info contains source information, display with "info" control
// todo: save word definitions locally (web storage) so we don't repeatedly look them up at Glosbe

const defLineHeight = "1.4";    // Default, baseline line height

const release = "0.7";          // "Semantic version" for end users
document.getElementById('bridgeVersion').innerHTML = release;

document.body.style.lineHeight = defLineHeight;

if (localStorage['fontWeight'] == null)
    localStorage['fontWeight'] = 'bold'; // default to bold

if (localStorage['fontWeight'] === 'bold')
    document.getElementById('boldCB').checked = true;

let buttonClickSound = document.getElementById("buttonClick");

function makeClick() {
    buttonClickSound.play();
}



// Splash screen:

if (localStorage["showSplash"] !== "doNotShow") {
    document.getElementById('biReaderSplash').style.display = 'block';
    document.getElementById('splashCB').checked = true;
} else {
    document.getElementById('biReaderSplash').style.display = 'none';
    document.getElementById('splashCB').checked = false;
}

document.querySelector('#closeSplash').onclick = function () {
    makeClick();
    document.getElementById('biReaderSplash').style.display = 'none';
};

document.querySelector('#noSplashButton').onclick = function () {
    makeClick();
    // Disable splash screen:
    localStorage["showSplash"] = "doNotShow";
    document.getElementById('biReaderSplash').style.display = 'none';
};

document.querySelector('#splashCB').onchange = function () {
    makeClick();
    if (this.checked)
        localStorage["showSplash"] = "Show";
    else
        localStorage["showSplash"] = "doNotShow";
};

// noinspection RedundantIfStatementJS
if (localStorage['showFSprompt'] === 'Show')
    document.getElementById('FSPromptCB').checked = true;
else
    document.getElementById('FSPromptCB').checked = false;

document.getElementById('leftColumn').style.fontWeight = localStorage['fontWeight'];
document.getElementById('rightColumn').style.fontWeight = localStorage['fontWeight'];

let controlsBackground = document.querySelector('#controlsBackground');

document.getElementById('controlsButton').addEventListener('click',
    function () {
        makeClick();
        controlsBackground.style.display = 'block';

        // Clicking anywhere outside the control panel closes it:
        document.addEventListener('click',
            function docClick(f) {
                if (f.target.id === 'controlsBackground') {
                    controlsBackground.style.display = 'none';
                    document.removeEventListener('click', docClick);
                }
            }
        )
    }, false
);

document.querySelector('#closeControls').onclick = function () {
    makeClick();
    if (speechSynthesis.pending || speechSynthesis.speaking)
        speechSynthesis.cancel();
    controlsBackground.style.display = 'none';
};

if (isMobileDevice()) {
    // This element will be empty unless mobile, so conditional listener:
    document.querySelector('#FSPromptCB').onchange = function () {
        if (this.checked)
            localStorage["showFSprompt"] = "Show";
        else
            localStorage["showFSprompt"] = "doNotShow";
    };
    // Prompt at startup if mobile (FS requires user interaction):
    if (localStorage["showFSprompt"] !== "doNotShow")
        document.getElementById('fullScreenDialog').style.display = 'block';
}
else
    document.getElementById('fullScreenControls').innerHTML = ''; // Only show opts for mobile

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

document.querySelector('#noFullScreenButton').onclick = function () {
    makeClick();
    // document.querySelector('#fullScreenDialog').close();
    document.querySelector('#fullScreenDialog').style.display = 'none';
};

// Full screen prompt:
document.querySelector('#noFSpromptButton').onclick = function () {
    makeClick();
    // Disable full screen prompt:
    localStorage["showFSprompt"] = "doNotShow";
    document.querySelector('#fullScreenDialog').style.display = 'none';
};

// Toggle bold/normal font:
document.querySelector('#boldCB').onchange = function () {
    makeClick();
    if (document.querySelector('#boldCB').checked)
        localStorage["fontWeight"] = "bold";
    else
        localStorage["fontWeight"] = "normal";

    document.getElementById('leftColumn').style.fontWeight = localStorage["fontWeight"];
    document.getElementById('rightColumn').style.fontWeight = localStorage["fontWeight"];
};

function launchFullscreen(element) {
    if (isMobileDevice()) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
            // } else if (element.mozRequestFullScreen) {
        } else if (element.getAttribute('mozRequestFullScreen')) {
            element.mozRequestFullScreen();
        } else if (element.getAttribute('webkitRequestFullscreen')) {
            element.webkitRequestFullscreen();
        } else if (element.getAttribute('msRequestFullscreen')) {
            element.msRequestFullscreen();
        }
        if (document.fullscreenEnabled || document.mozFullScreenEnabled ||
            document.webkitFullscreenEnabled || document.msFullscreenEnabled) {
            document.querySelector('#fullScreenDialog').style.display = 'none';
            setTimeout(function () {
                // todo: when we exit, device is still in landscape; attempt to restore to portrait if that is
                // ..how we started:
                window.screen.orientation.lock("landscape");
            }, 200);
        }
    }
}

let linkArray;

// This prevents Chrome from opening a cut/paste dialog, but does not prevent
// ..it from displaying a popup search link at bottom of screen.  No known
// ..programmatic way of disabling that "feature," user must disable it from
// ..Chrome's "privacy" settings menu.  NOTE: configuring the page as a "home page"
// ..disables popup search.
window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    return true;    // true = propagation continues
});

///////// Change speech rate:

let currentSpeakSpd = 1;
let lastSpeakSpd = null;
let sameSpeakSpd = false;

document.getElementById('currentSpeakSpeed').textContent = currentSpeakSpd.toString();
document.getElementById('speakSpeed').value = currentSpeakSpd;

// (Next several functions) adjust numeric indicator as user moves slider, but only
// speak a sample when user releases the slider.  Special logic to speak sample if
// user releases slider at original location (no 'change' event fires if so):

// Adjust numeric indicator:
document.getElementById('speakSpeed').addEventListener('input',
    function () {
        if (speechSynthesis.pending || speechSynthesis.speaking)
            speechSynthesis.cancel();
        currentSpeakSpd = document.getElementById('speakSpeed').value;
        document.getElementById('currentSpeakSpeed').textContent = currentSpeakSpd;
        // noinspection RedundantIfStatementJS
        if (currentSpeakSpd === lastSpeakSpd)
            sameSpeakSpd = true;
        else
            sameSpeakSpd = false;  // combine with "keyup" listener to trigger sample speech
    });

// Speak a sample when user releases slider at different location:
document.getElementById('speakSpeed').addEventListener('change', speakSample);

// Speak a sample when user releases slider at same location:
document.getElementById('speakSpeed').addEventListener('mouseup', speakIfSameSpd);
document.getElementById('speakSpeed').addEventListener('touchend', speakIfSameSpd);

function speakIfSameSpd() {
    if (sameSpeakSpd) {
        speakSample();
        sameSpeakSpd = false;
    }
}

function speakSample() {
    // todo: internationalize:
    let sampleSpeakMsg = new SpeechSynthesisUtterance("I am now speaking at rate " + currentSpeakSpd);
    sampleSpeakMsg.rate = currentSpeakSpd;
    speechSynthesis.speak(sampleSpeakMsg);
    lastSpeakSpd = currentSpeakSpd;
}

////////// Change font size

document.getElementById('currentTextSize').innerHTML =
    document.getElementById('textSize').value + "px";

// document.getElementById('textSize').addEventListener('change',
// todo: fix slow performance on some tablets:
document.getElementById('textSize').addEventListener('input',
    function () {
        const textSize = document.getElementById('textSize').value;
        document.getElementById('currentTextSize').innerHTML = textSize + "px";
        document.getElementById('textColumns').style.fontSize = textSize + "px";
    }
);

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// Reveal the <select> node when the button is clicked:
let fileChooserModal = document.querySelector('#fileChooserModal');
document.getElementById('libraryLoadButton').addEventListener('click',
    function () {
        makeClick();
        document.getElementById('fileChooserModal').style.display = 'block';
        document.getElementById('leftFilePopup').style.display = 'block';

        // Clicking anywhere outside the file chooser closes it:
        document.addEventListener('click',
            function docClick(f) {
                // if (f.target.id === 'fileChooserModal') {
                if (f.target.getAttribute('id') === 'fileChooserModal') {
                    document.getElementById('fileChooserModal').style.display = 'none';
                    document.removeEventListener('click', docClick);
                }
            }
        )
    }, false
);

document.getElementById('helpButton').addEventListener('click',
    function () {
        makeClick();
        document.getElementById('Help').style.display = 'inline-block';
        // Click anywhere except Help button turns it off:
        document.addEventListener('click',
            function docClick(f) {
                if (f.target.id !== 'helpButton') {
                    document.getElementById('Help').style.display = 'none';
                    document.removeEventListener('click', docClick);
                }
            }
        )
    }, false);

document.getElementById('helpCloseButton').addEventListener('click',
    function () {
        makeClick();
        document.getElementById('Help').style.display = 'none';
    });

let leftSel = null;
let libFileOK = false; // Global flag for library file load result

// Load a file when a library selection is made.
document.getElementById('leftFileSelect').addEventListener('change', function () {
    makeClick();
    leftSel = document.getElementById('leftFileSelect');
    let leftlibFilePath = leftSel.options[leftSel.selectedIndex].text;  // Left-hand file
    let libFileName = leftlibFilePath.replace(/\.[a-z][a-z]$/, "");

    // Select right-hand file:
    // Populate chooser (derived from https://stackoverflow.com/a/17002049/5025060):
    let rightList = document.getElementById("rightFileSelect");
    rightList.length = 0; // empty it
    // rightList.insertAdjacentHTML("beforebegin", "Select right-hand file:");

    // NB: set this BEFORE populating selectList, else first is set as default choice:
    rightList.size = (linkArray.length < 12 ? linkArray.length : 12);

    // Try to deal w/mobile where size attribute doesn't cause dropdown.
    // Adapted from https://stackoverflow.com/a/18180032/5025060:
    let RFopt = document.createElement("option");
    RFopt.disabled = true;
    RFopt.selected = true;
    RFopt.value = "";  // prevent rumored autofill of "choose one" by some browsers
    // RFopt.style = "font-weight: bold; font-size: 125%; color: red; background-color: yellow";
    RFopt.setAttribute("style", "font-weight: bold; font-size: 125%; color: red; background-color: yellow");
    RFopt.text = "Select right-hand file:";
    rightList.appendChild(RFopt);

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

    // Now that user has selected lefthand file, expose righthand file menu:
    // document.getElementById('rightFilePopup').style.display = 'inline-block';
    document.getElementById('rightFilePopup').style.display = 'block';

    if (leftlibFilePath.length)
    // getFileFromLibrary('leftPara', leftlibFilePath, 'leftTitle');
        getFileFromLibrary('leftPara', leftlibFilePath, 'leftColumnHeader');
});

document.getElementById('rightFileSelect').addEventListener('change', function () {
    makeClick();
    let rightSel = document.getElementById('rightFileSelect');
    let rightlibFilePath = rightSel.options[rightSel.selectedIndex].text;  // Right-hand file
    if (rightlibFilePath.length)
        getFileFromLibrary('rightPara', rightlibFilePath, 'rightColumnHeader');

    document.getElementById('leftFilePopup').style.display = 'none';
    document.getElementById('rightFilePopup').style.display = 'none';
    document.getElementById('fileChooserModal').style.display = 'none';

    leftSel.value = "";  // Else we won't trigger again on current choice
});

function getFileFromLibrary(contentElement, fileName, titleElement) {
    let request = new XMLHttpRequest(); // Create new request
    // request.open("GET", url); // Specify URL to fetch
    request.open("GET", 'http://bridge.code-read.com/library/' + fileName); // Specify URL to fetch
    request.onreadystatechange = function () { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            // document.getElementById(contentElement).parentElement.textContent = request.responseText;
            document.getElementById(contentElement).textContent = request.responseText;
            document.getElementById(titleElement).textContent = fileName;
        }
    };
    request.onload = function () {
        libFileOK = true;
    };
    return request.send(null);
}

// When user makes a change to the 'leftFilechoice' field, fire this listener to load
// the file to leftPara:
document.getElementById('leftFileChoice').addEventListener('change',
    function () {
        const fr = new FileReader();
        fr.onload = function () {
            document.getElementById('leftPara').textContent = this.result;
        };
        fr.readAsText(this.files[0]);
        document.getElementById('leftColumnHeader').textContent = this.files[0].name;
    }
);

document.getElementById('rightFileChoice').addEventListener('change',
    function () {
        const fr = new FileReader();
        fr.onload = function () {
            document.getElementById('rightPara').textContent = this.result;
        };
        fr.readAsText(this.files[0]);
        document.getElementById('rightColumnHeader').textContent = this.files[0].name;
        // updateLineSpacing();
    }
);

const leftFileColumn = document.getElementById("leftColumn"); // use column rather than para as para isn't inflated before a file is loaded
leftFileColumn.addEventListener("dragenter", keepItLocal, false);
leftFileColumn.addEventListener("dragover", keepItLocal, false);
leftFileColumn.addEventListener("drop", fileDrop, false);
leftFileColumn.addEventListener("paste", pasteToCol, false);

const rightFileColumn = document.getElementById("rightColumn");
rightFileColumn.addEventListener("dragenter", keepItLocal, false);
rightFileColumn.addEventListener("dragover", keepItLocal, false);
rightFileColumn.addEventListener("drop", fileDrop, false);
rightFileColumn.addEventListener("paste", pasteToCol, false);

let leftParaObserver = new MutationObserver(updateLineSpacing);
leftParaObserver.observe(document.getElementById('leftPara'), {childList: true});

let rightParaObserver = new MutationObserver(updateLineSpacing);
rightParaObserver.observe(document.getElementById('rightPara'), {childList: true});

// Configure line spacing so that left and right panels display the same percentage of
// their text (aids in scrolling and synchronization of content:
//
function updateLineSpacing() {
    // First reset both columns to default line height so we can make our computation:
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
        document.getElementById('leftPara').style.lineHeight = (1.4 / leftToRightRatio).toString();
    else if (leftToRightRatio > 1)
    // Stretch right side:
        document.getElementById('rightPara').style.lineHeight = (1.4 * leftToRightRatio).toString();
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
            handleFiles(files, 'leftPara', 'leftColumnHeader');
            break;
        case 'rightColumn':
            handleFiles(files, 'rightPara', 'rightColumnHeader');
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
            document.getElementById('leftColumnHeader').textContent = "(pasted)";
            break;
        case 'rightColumn':
            document.getElementById('rightPara').textContent = pastedData;
            document.getElementById('rightColumnHeader').textContent = "(pasted)";
            break;
        default:
            console.log('pasteToCol: error: source ID is: ' + this.id.toString());
            return;
    }
}

function handleFiles(files, filePara, fileTitle) {
    const fr = new FileReader();
    fr.onload = function () {
        document.getElementById(filePara).textContent = this.result;
        updateLineSpacing();
    };
    fr.readAsText(files[0]);
    document.getElementById(fileTitle).textContent = files[0].name;
}

let mouseWasMoved = false;
let lastX = window.clientX;
let lastY = window.clientY;

// Set boolean if mouse moved a significant amount; otherwise simply absorb the event:
function mouseMoved(ev) {
    // todo: calibrate this to screen dpi?
    if ((Math.abs(ev.clientX - lastX) > 2) || (Math.abs(ev.clientY - lastY) > 2))
        mouseWasMoved = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    return true;    // true = propagation continues
}

function sleep(ms) {
    // return new Promise(resolve => setTimeout(resolve, ms));
    return new Promise(function (resolve) {
        return setTimeout(resolve, ms)
    });
}

function touchMoved() {
    console.log('touchmoved.');
    touchMove = true;
}

let lookingUpWord = false;
let wordLookedUp = false;
let textWasRead = false;
let touchMove = false;

async function lookupWord(ev) {
    // todo: some languages such as Japanese and Chinese do not use word separation characters
    // todo: ..in sentences, so exclude this function for those languages.
    let speakRange;
    lookingUpWord = false;  // Not true until we have waited
    mouseWasMoved = false;
    textWasRead = false;    // Set here and recheck after sleep
    wordLookedUp = false;

    console.log('============ lookupWord: Event is: ' + ev.type);

    let textSel = window.getSelection();
    if (!textSel.isCollapsed) {
        speakRange = textSel.getRangeAt(0);
        console.log('lookupWord: collapsing selection: ' + speakRange.toString().trim());
        speakRange.collapse(true);  // So we can get new selection (below)
    }

    if (speechSynthesis.pending || speechSynthesis.speaking)
        speechSynthesis.cancel();

    await sleep(700); // Android Chrome range change lag

    if (textWasRead)    // A short click occurred, so read text instead
        return true;    // true = propagation continues

    if (ev.type === 'mousedown' && mouseWasMoved) {    // User is dragging over text, rather than long-clicking
        console.log('lookupWord(): mouse was moved, abort.');
        mouseWasMoved = false;  // For next time
        return true; // true = propagation continues
    }

    // Prevent spurious calls on touch screens
    if (touchMove) {
        // speakRange.collapse(true);
        touchMove = false;
        return true;
    }

    wordLookedUp = true;

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
        if (searchStr.search(/[\r\n\s.,:;。、"'\]\)}]/) !== -1) {    // end of word (international)
            speakRange.setEnd(node, speakRange.endOffset - 1); // back 1 char
            break;
        }
    }

    let speakStr = speakRange.toString().trim();

    console.log('lookupWord: ' + speakStr);

    getTranslation("from=fra&dest=eng&phrase=", speakStr);

    let speakMsg = new SpeechSynthesisUtterance(speakStr);
    speakMsg.rate = currentSpeakSpd;
    speechSynthesis.speak(speakMsg);
}

function readTextAloud(ev) {
    if (wordLookedUp) {     // A long mousedown occurred, so ignore following click event
        wordLookedUp = false;
        console.log('RTA skip');
        return true;
    }
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

    // todo: Safari 11.0.3 correctly speaks the text, but does not highlight the selection.
    // ..see https://stackoverflow.com/questions/49758168/how-to-highlight-desktop-safari-text-selection-in-div-after-range-setstart-r

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

    speakMsg.rate = currentSpeakSpd;    // todo: different languages respond to same rate differently (e.g., en vs fr)
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
}

let clickables = document.getElementsByClassName('clickable');

for (let elNum = 0; elNum < clickables.length; elNum++) {
    // noinspection JSUnresolvedFunction
    clickables[elNum].addEventListener('mousedown', lookupWord, {passive: true});
    clickables[elNum].addEventListener('touchstart', lookupWord, {passive: true}); // required for tablet

    clickables[elNum].addEventListener('mousemove', mouseMoved, {passive: true});
    // clickables[elNum].addEventListener('touchmove', mouseMoved, {passive:true}); // tablet

    // noinspection JSUnresolvedFunction
    clickables[elNum].addEventListener('click', readTextAloud, {passive: true});

    // clickables[elNum].addEventListener('mouseup', keepItLocal, false); // else touchscreen browser removes highlighting
    // clickables[elNum].addEventListener('mouseup', setLookupFlag, false);

    clickables[elNum].addEventListener('touchmove', touchMoved, {passive: true}); // tablet
}

// Preload library file list to <select>:
//
let request = new XMLHttpRequest(); // Create new request
const el = document.createElement('html');

request.open("GET", "http://bridge.code-read.com/library/");
request.onreadystatechange = function () { // Define event listener
    // If the request is complete and was successful
    if (request.readyState === 4 && request.status === 200) {
        el.innerHTML = request.responseText;
        let libraryLinks = el.getElementsByTagName('a'); // Live NodeList of anchor elements
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

        // Try to deal w/mobile where size attribute doesn't cause dropdown.
        // Adapted from https://stackoverflow.com/a/18180032/5025060:
        let option = document.createElement("option");
        option.disabled = true;
        option.selected = true;
        option.value = "";  // prevent rumored autofill of "choose one" by some browsers
        option.setAttribute("style", 'font-weight: bold; font-size: 125%; color: red; background-color: yellow');
        option.text = "Select left-hand file:";
        selectList.appendChild(option);

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

function doVoices() {
    // let ssVoices = this.getVoices();
    let ssVoices = speechSynthesis.getVoices();
    for (let voiceInd = 0; voiceInd < ssVoices.length; voiceInd++)
        voiceList[voiceInd] = ssVoices[voiceInd].name + ' (' + ssVoices[voiceInd].lang + ')';

    let vListEl = document.getElementById('vList');
    vListEl.insertAdjacentHTML("beforeend", "<ul>");
    voiceList.forEach(function (listMem) {
        vListEl.insertAdjacentHTML("beforeend", "<li>" + listMem);
    });
    vListEl.insertAdjacentHTML("beforeend", "</ul>");
}

// Workaround for Safari, adapted from https://stackoverflow.com/a/28217250/5025060:
//
if ('onvoiceschanged' in speechSynthesis) {     // trigger on event
    speechSynthesis.onvoiceschanged = doVoices;
} else {
    doVoices();                                 // just run once at startup
}

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
        } else {
            $.getJSON("https://glosbe.com/gapi/translate?format=json&" + toXlate + "&callback=?", function (json) {
                console.log(json);
                $('#glosbeBuf').html('<h3>' + JSON.stringify(json) + '</h3>');
            });
        }
    });
    return false;
}

// Column synchronization code adapted from https://stackoverflow.com/a/41998497/5025060:
//
let isSyncingLeftScroll = false;
let isSyncingRightScroll = false;
let leftDiv = document.getElementById('leftColumn');
let rightDiv = document.getElementById('rightColumn');

leftDiv.onscroll = function () {
    if (!isSyncingLeftScroll) {
        isSyncingRightScroll = true;
        rightDiv.scrollTop = this.scrollTop;
    }
    isSyncingLeftScroll = false;
};

rightDiv.onscroll = function () {
    if (!isSyncingRightScroll) {
        isSyncingLeftScroll = true;
        leftDiv.scrollTop = this.scrollTop;
    }
    isSyncingRightScroll = false;
};

// End of main.js
