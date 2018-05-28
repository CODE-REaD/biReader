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

/*jshint curly: false */
/*jslint devel: true */
/*global speechSynthesis*/

// "use strict";

/*jshint -W097 */

// todo: Mac mobile devices don't respond to fullscreen/landscape code.  Nothing happens.
//       Either don't offer or make it work.
// todo: allow user to select TTS language manually (in case of several voices/lang)
// todo: finish file saving code (https://jsfiddle.net/ourcodeworld/rce6nn3z/2/?utm_source=website&utm_medium=embed&utm_campaign=rce6nn3z)
//       (sometimes saves only "right" file)
// todo: when loading files from computer, use two-character extension as language(?)
// todo: more clickable area around icon buttons
// todo: store filenames as English and translate to native language for display.
// todo: pinch zoom to resize text
// todo: default to bold font on high density screens only

// Show end user any errors rather than silently failing:
window.onerror = function (msg, url, linenumber) {
    alert('Sorry, biReader has encountered an error.  Please report this to support ASAP:\n\n'
        + msg + '\nURL: ' + url + '\nLine Number: ' + linenumber);
    return true;
};

const release = "0.7d";          // "Semantic version" for end users

const defLineHeight = "1.5";    // Default, baseline line height
const deftextSize = "17";    // Default text size

document.getElementById("brVersion").innerHTML = release;

document.body.style.lineHeight = defLineHeight;

let userLanguage = window.navigator.language; // Returns value like 'en-US'
let userLang2char = userLanguage.split("-")[0]; // Change 'en-US' to 'en'
let userLang3char = iso2to3[userLang2char];
let lastTransLang = userLang3char;

let leftRightHeightFactor = 1;
let currentSpeakSpd = 1;

document.getElementById("userLang").textContent = userLanguage;

// Detected language of l/r frames:
let leftLanguage = userLang2char;
let rightLanguage = userLang2char;

switch (localStorage.fontWeight) {
    case undefined:
        localStorage.fontWeight = "bold"; // default to bold
    case "bold":
        document.getElementById("boldCB").checked = true;
        break;
}
/*document.getElementById("leftColumn").style.fontWeight = localStorage.fontWeight;
document.getElementById("rightColumn").style.fontWeight = localStorage.fontWeight;*/
document.getElementById("textColumns").style.fontWeight = localStorage.fontWeight;
document.getElementById("sampleText").style.fontWeight = localStorage.fontWeight;

if (localStorage.textSize === undefined)
    localStorage.textSize = deftextSize; // default to bold

document.getElementById("textSize").value = localStorage.textSize;
document.getElementById("currentTextSize").innerHTML = localStorage.textSize + "px";
document.getElementById("textColumns").style.fontSize = localStorage.textSize + "px";
document.getElementById("sampleText").style.fontSize = localStorage.textSize + "px";

if (localStorage.speakSpeed === undefined)
    localStorage.speakSpeed = 1; // default

currentSpeakSpd = localStorage.speakSpeed;
document.getElementById("currentSpeakSpeed").textContent = currentSpeakSpd;
document.getElementById("speakSpeed").value = currentSpeakSpd;

let buttonClickSound = document.getElementById("buttonClick");
buttonClickSound.volume = 0.6;

function makeClick() {
    // noinspection JSIgnoredPromiseFromCall
    buttonClickSound.play();
}

function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf("IEMobile") !== -1);
}

function launchFullscreen(element) {
    if (isMobileDevice()) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else { // noinspection JSUnresolvedVariable
            if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else { // noinspection JSUnresolvedVariable
                if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                }
            }
        }
        if (document.fullscreenEnabled || document.mozFullScreenEnabled ||
            document.webkitFullscreenEnabled || document.msFullscreenEnabled) {
            // document.querySelector("#fullScreenDialog").style.display = "none";
            document.getElementById("fullScreenDialog").classList.remove("md-show", "md-show-top");
            setTimeout(function () {
                // todo: when we exit, device is still in landscape; attempt to restore to portrait if that is
                // ..how we started:
                window.screen.orientation.lock("landscape");
            }, 200);
        }
    }
}

document.querySelector("#noFullScreenButton").onclick = function () {
    makeClick();
    document.getElementById("fullScreenDialog").classList.remove("md-show", "md-show-top");
};

// Full screen prompt:
document.querySelector("#noFSpromptButton").onclick = function () {
    makeClick();
    // Disable full screen prompt:
    localStorage.showFSprompt = "doNotShow";
    document.getElementById("fullScreenDialog").classList.remove("md-show", "md-show-top");
};

// noinspection RedundantIfStatementJS
if (localStorage.showFSprompt === "Show")
    document.getElementById("FSPromptCB").checked = true;
else
    document.getElementById("FSPromptCB").checked = false;

if (isMobileDevice()) {
    // This element will be empty unless mobile, so listener is only defined
    // here, in this conditional:
    document.querySelector("#FSPromptCB").onchange = function () {
        if (this.checked)
            localStorage.showFSprompt = "Show";
        else
            localStorage.showFSprompt = "doNotShow";
    };
    // Prompt at startup if mobile (FS won't start w/o user interaction):
    if (localStorage.showFSprompt !== "doNotShow")
        document.getElementById("fullScreenDialog").classList.add("md-show", "md-show-top");
}
else {
    document.getElementById("fullScreenControls").innerHTML = ""; // Only show opts for mobile
    document.getElementById("leftColumn").style.borderRadius = "0 0 6px 6px";
    document.getElementById("rightColumn").style.borderRadius = "0 0 6px 6px";
}

// Splash screen:
if (localStorage.showSplash !== "doNotShow") {
    document.getElementById("biReaderSplash").classList.add("md-show");
    document.getElementById("splashCB").checked = true;
    // Close if user clicks outside modal:
    document.addEventListener("click",
        function docClick(f) {
            // todo: our <div> extends over part of mdOverlay,
            // so our clicks don't always deactivate:
            if (f.target.id === "mdOverlay") {
                document.getElementById("biReaderSplash").classList.remove("md-show");
                document.removeEventListener("click", docClick);
            }
        }
    );
} else {
    document.getElementById("biReaderSplash").classList.remove("md-show");
    document.getElementById("splashCB").checked = false;
}

document.querySelector("#closeSplash").onclick = function () {
    makeClick();
    document.getElementById("biReaderSplash").classList.remove("md-show");
};

document.querySelector("#noSplashButton").onclick = function () {
    makeClick();
    // Disable splash screen:
    localStorage.showSplash = "doNotShow";
    document.getElementById("biReaderSplash").classList.remove("md-show");
};

document.querySelector("#splashCB").onchange = function () {
    makeClick();
    if (this.checked)
        localStorage.showSplash = "Show";
    else
        localStorage.showSplash = "doNotShow";
};

// Controls:
document.getElementById("controlsButton").addEventListener("click",
    function () {
        makeClick();
        document.getElementById("controlsBackground").classList.add("md-show");
        // Clicking anywhere outside the control panel closes it:
        document.addEventListener("click",
            function docClick(f) {
                if (f.target.id === "controlsBackground") {
                    document.getElementById("controlsBackground").classList.remove("md-show");
                    document.removeEventListener("click", docClick);
                }
            }
        );
    }, false
);

document.querySelector("#closeControls").onclick = function () {
    // $('body').addClass('waiting');
    makeClick();
    if (speechSynthesis.pending || speechSynthesis.speaking)
        speechSynthesis.cancel();

    // Apply settings:
    document.getElementById("textColumns").style.fontSize = localStorage.textSize + "px";
    document.getElementById("textColumns").style.fontWeight = localStorage.fontWeight;

    // For performance, set size & weight in single operation but
    // NB: "sets the complete inline style for the element by overriding the
    // existing inline styles."
    /*    document.getElementById("textColumns").style.cssText =
            `font-size: ${localStorage.textSize}px; font-weight: ${localStorage.fontWeight}`;*/
    // (The above didn't actually improve performance w/several emulators)

    setLineSpacing();
    document.getElementById("controlsBackground").classList.remove("md-show");
    // $('body').removeClass('waiting');
};

// Toggle bold/normal font:
document.querySelector("#boldCB").onchange = function () {
    makeClick();
    if (document.querySelector("#boldCB").checked)
        localStorage.fontWeight = "bold";
    else
        localStorage.fontWeight = "normal";

    document.getElementById("sampleText").style.fontWeight = localStorage.fontWeight;

    /*    document.getElementById("leftColumn").style.fontWeight = localStorage.fontWeight;
        document.getElementById("rightColumn").style.fontWeight = localStorage.fontWeight;
        setLineSpacing();*/
};

let libFilePaths;
let libFileURLs;

// This prevents Chrome from opening a cut/paste dialog, but does not prevent
// ..it from displaying a popup search link at bottom of screen.  No known
// ..programmatic way of disabling that "feature," user must disable it from
// ..Chrome's 'privacy' settings menu.  NOTE: configuring the page as a "home page"
// ..disables popup search.
window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    return true;    // true = propagation continues
});

////////// Auxiliary functions:

///////// Change speech rate:
let lastSpeakSpd = null;
let sameSpeakSpd = false;

document.getElementById("currentSpeakSpeed").textContent = currentSpeakSpd.toString();
document.getElementById("speakSpeed").value = currentSpeakSpd;

// (Next several functions) adjust numeric indicator as user moves slider, but only
// speak a sample when user releases the slider.  Special logic to speak sample if
// user releases slider at original location (no "change" event fires if so):

// Adjust numeric indicator:
document.getElementById("speakSpeed").addEventListener("input",
    function () {
        if (speechSynthesis.pending || speechSynthesis.speaking)
            speechSynthesis.cancel();
        currentSpeakSpd = document.getElementById("speakSpeed").value;
        document.getElementById("currentSpeakSpeed").textContent = currentSpeakSpd;
        localStorage.speakSpeed = currentSpeakSpd;
        // noinspection RedundantIfStatementJS
        if (currentSpeakSpd === lastSpeakSpd)
            sameSpeakSpd = true;
        else
            sameSpeakSpd = false;  // combine with "keyup" listener to trigger sample speech
    });

// Speak a sample when user releases slider at different location:
document.getElementById("speakSpeed").addEventListener("change", speakSample);

// Speak a sample when user releases slider at same location:
document.getElementById("speakSpeed").addEventListener("mouseup", speakIfSameSpd);
document.getElementById("speakSpeed").addEventListener("touchend", speakIfSameSpd);

function speakIfSameSpd() {
    if (sameSpeakSpd) {
        speakSample();
        sameSpeakSpd = false;
    }
}

/* global SpeechSynthesisUtterance */
function speakSample() {
    // todo: internationalize:
    let sampleSpeakMsg = new SpeechSynthesisUtterance("I am now speaking at rate " + currentSpeakSpd);
    sampleSpeakMsg.rate = currentSpeakSpd;
    sampleSpeakMsg.lang = userLanguage;
    speechSynthesis.speak(sampleSpeakMsg);
    lastSpeakSpd = currentSpeakSpd;
}

// Change font size:
document.getElementById("currentTextSize").innerHTML =
    document.getElementById("textSize").value + "px";

// Here we only update the sampleText for performance reasons.  We change
// ..display text size when user clicks the exit control:
document.getElementById("textSize").addEventListener("input",
    function () {
        const textSize = document.getElementById("textSize").value;
        document.getElementById("currentTextSize").innerHTML = textSize + "px";
        document.getElementById("sampleText").style.fontSize = textSize + "px";
        localStorage.textSize = textSize;
    }
);

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications

// Reveal the <select> node when the button is clicked:
document.getElementById("libraryLoadButton").addEventListener("click",
    function () {
        makeClick();
        document.getElementById("fileChooserModal").classList.add("md-show");
        // Clicking anywhere outside the file chooser closes it:
        document.addEventListener("click",
            function docClick(f) {
                let targID = f.target.getAttribute("id");
                if (targID === "fileChooserModal" || targID === "mdOverlay") {
                    document.getElementById("fileChooserModal").classList.remove("md-show");
                    document.removeEventListener("click", docClick);
                }
            }
        );
    }, false
);

// Save files to computer:

// Derived from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
function saveToComputer(saveFileName, saveText) {
    console.log(`saveToComputer: ${saveFileName}`);
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(saveText));
    element.setAttribute('download', saveFileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    return true;
}

document.getElementById("saveButton").addEventListener("click",
    function () {
        makeClick();
        // Use Promise to ensure file output is sequential, avoid "race":
        let fileSavePromise = new Promise(function (resolve, reject) {
            console.log("Saving left file.");
            let outfileText = document.getElementById("leftPara").innerText;
            let outFilename = `biReaderLeft.${leftLanguage}`;
            saveToComputer(outFilename, outfileText);
            resolve();
        });

        fileSavePromise.then(function () {
                console.log("Saving right file.");
                let outfileText = document.getElementById("rightPara").innerText;
                let outFilename = `biReaderRight.${rightLanguage}`;
                saveToComputer(outFilename, outfileText);
            }
        );
    }
);

// Help popup:
document.getElementById("helpButton").addEventListener("click",
    function () {
        makeClick();
        document.getElementById("Help").classList.add("md-show");
        // Clicking background turns it off:
        document.addEventListener("click",
            function docClick(f) {
                // todo: "help" and "info" <div>s extend over part of mdOverlay,
                // so our clicks don't always deactivate:
                if (f.target.id === "mdOverlay") {
                    document.getElementById("Help").classList.remove("md-show");
                    document.removeEventListener("click", docClick);
                }
            }
        );
    }, false);

document.getElementById("helpCloseButton").addEventListener("click",
    function () {
        makeClick();
        document.getElementById("Help").classList.remove("md-show");
    });

// Info popup:
document.getElementById("infoButton").addEventListener("click",
    function () {
        makeClick();
        document.getElementById("Info").classList.add("md-show");
        // Clicking background turns it off:
        document.addEventListener("click",
            function docClick(f) {
                if (f.target.id === "mdOverlay") {
                    document.getElementById("Info").classList.remove("md-show");
                    document.removeEventListener("click", docClick);
                }
            }
        );
    }, false);

document.getElementById("closeInfo").onclick = function () {
    makeClick();
    document.getElementById("Info").classList.remove("md-show");
};

////////// File i/o functions:

// Column synchronized scroll code adapted from https://stackoverflow.com/a/41998497/5025060:
//
let isSyncingLeftScroll = false;
let isSyncingRightScroll = false;
let leftDiv = document.getElementById("leftColumn");
let rightDiv = document.getElementById("rightColumn");

leftDiv.onscroll = function () {
    if (!isSyncingLeftScroll) {
        isSyncingRightScroll = true;
        // console.log(`left onScroll: right top = ${rightDiv.scrollTop}, left top = ${leftDiv.scrollTop}`);
        rightDiv.scrollTop = this.scrollTop / leftRightHeightFactor;
    }
    isSyncingLeftScroll = false;
};

rightDiv.onscroll = function () {
    if (!isSyncingRightScroll) {
        isSyncingLeftScroll = true;
        // leftDiv.scrollTop = this.scrollTop;
        leftDiv.scrollTop = this.scrollTop * leftRightHeightFactor;
    }
    isSyncingRightScroll = false;
};

// Load a file when a library selection is made.
let leftSel = null;
let libFileOK = false; // Global flag for library file load result

$('#leftFileSelect').change(function () {
    makeClick();
    leftSel = document.getElementById("leftFileSelect");
    let leftlibFilePath = leftSel.options[leftSel.selectedIndex].text;  // Left-hand file
    let leftFileName = leftlibFilePath.replace(/\.[a-z][a-z]$/, "");

    // Select right-hand file:
    // Populate chooser (derived from https://stackoverflow.com/a/17002049/5025060):
    let rightList = document.getElementById("rightFileSelect");
    rightList.length = 1; // truncate to header

    // Create and append the right-file choice options
    // (only show files (translations) whose names match the name of the left hand file).
    // See also, Option object at http://www.javascriptkit.com/jsref/select.shtml#section2
    //
    libFilePaths.forEach(function (libraryFN) {
        if ((libraryFN.replace(/\.[a-z][a-z]$/, "") === leftFileName) &&
            (libraryFN !== leftlibFilePath)) {
            let RFopt = document.createElement("option");
            RFopt.value = libraryFN;
            RFopt.text = libraryFN;
            rightList.appendChild(RFopt);
        }
    });

    $('#rightFileSelect').selectBox('refresh'); // Reinitialize (show rightList entries)

    // Now that user has selected lefthand file, expose righthand file menu:
    document.getElementById("rightFilePopup").style.display = "block";

    // Load lefthand file to its window:
    if (leftlibFilePath.length) {
        getFileFromLibrary("leftPara", leftlibFilePath, "leftColumnHeader");

        // If a ".url" file matching the left file is found, load its content to Info element:
        libFileURLs.forEach(function (urlPath) {
            if ((urlPath.replace(/\.url$/i, "") === leftFileName)) {
                getFileFromLibrary("fileURL", urlPath); // Load contents of "url" file if present
            }
        });
    }
});

$('#rightFileSelect').change(function () {
// document.getElementById("rightFileSelect").addEventListener("change", function () {
    makeClick();
    let rightSel = document.getElementById("rightFileSelect");
    let rightlibFilePath = rightSel.options[rightSel.selectedIndex].text;  // Right-hand file
    if (rightlibFilePath.length)
        getFileFromLibrary("rightPara", rightlibFilePath, "rightColumnHeader");

    // document.getElementById("leftFilePopup").style.display = "none";
    document.getElementById("rightFilePopup").style.display = "none";
    // document.getElementById("fileChooserModal").style.display = "none";
    document.getElementById("fileChooserModal").classList.remove("md-show");


    leftSel.value = "";  // Else we won't trigger again on current choice
});

let leftLangFromLibrary = false;
let rightLangFromLibrary = false;

function getFileFromLibrary(contentElement, fileName, titleElement) {
    let request = new XMLHttpRequest(); // Create new request
    request.open("GET", "http://bireader.com/library/" + fileName); // Specify URL to fetch
    request.onreadystatechange = function () { // Define event listener
        // If the request is complete and was successful
        if (request.readyState === 4 && request.status === 200) {
            document.getElementById(contentElement).textContent = request.responseText;
            if (titleElement) {
                document.getElementById(titleElement).textContent = fileName;
                let langName = fileName.split(".")[1];
                if (langName.length === 2)
                    switch (contentElement) {
                        case "leftPara":
                            leftLanguage = langName;
                            console.log(`library setting left language to ${langName}.`);
                            leftLangFromLibrary = true; // Skip mutation test
                            break;
                        case "rightPara":
                            rightLanguage = langName;
                            console.log(`library setting right language to ${langName}.`);
                            rightLangFromLibrary = true;
                            break;
                    }
            }
        }
    };
    request.onload = function () {
        libFileOK = true;
    };
    return request.send(null);
}

// When user makes a change to the "leftFilechoice" field, fire this listener to load
// the file to leftPara:
document.getElementById("leftFileChoice").addEventListener("change",
    function () {
        const fr = new FileReader();
        fr.onload = function () {
            document.getElementById("leftPara").textContent = this.result;
        };
        fr.readAsText(this.files[0]);
        document.getElementById("leftColumnHeader").textContent = this.files[0].name;
    }
);

document.getElementById("rightFileChoice").addEventListener("change",
    function () {
        const fr = new FileReader();
        fr.onload = function () {
            document.getElementById("rightPara").textContent = this.result;
        };
        fr.readAsText(this.files[0]);
        document.getElementById("rightColumnHeader").textContent = this.files[0].name;
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


// "Observe" the text panes and trigger textEval() when content changes:
//
let leftParaObserver = new MutationObserver(textEval);
leftParaObserver.observe(document.getElementById("leftPara"), {childList: true});

let rightParaObserver = new MutationObserver(textEval);
rightParaObserver.observe(document.getElementById("rightPara"), {childList: true});

function textEval(mutationsList) {
    // console.log(`wholeText: ${mutationsList[0].addedNodes[0].wholeText}`);
    // console.log(`target: ${mutationsList[0].target.id}`);

    $('body').addClass('waiting');

    let fullText = mutationsList[0].addedNodes[0].wholeText;
    // let textSample = fullText.substr(fullText.length / 4, 100);
    let textSample = fullText.substr(fullText.length / 20, 100); // Try to skip initial headings
    let nodeName = mutationsList[0].target.id;

    let doLangGuess = true;
    switch (nodeName) {
        case "leftPara":
            if (leftLangFromLibrary) {
                doLangGuess = false;
                leftLangFromLibrary = false;  // first mutation only
            }
            break;
        case "rightPara":
            if (rightLangFromLibrary) {
                doLangGuess = false;
                rightLangFromLibrary = false;
            }
            break;
    }

    // Detect and store language of new text:
    if (doLangGuess) {
        /* global guessLanguage */
        guessLanguage.info(textSample, function (languageInfo) {
            if (languageInfo[0] === "unknown") {
                console.log(`${nodeName} does not contain enough text to determine the source language.`);
            } else {
                console.log(`Detected language of ${nodeName} is ${languageInfo[2]} [${languageInfo[0]}].`);
                if (nodeName === "leftPara") leftLanguage = languageInfo[0];
                else if (nodeName === "rightPara") rightLanguage = languageInfo[0];
            }

            // todo: improve to give more exact information whether no language voices, or just this voice:
            if ((languageInfo[0] !== userLanguage.substr(0, 2)) &&
                (speechSynthesis.getVoices().length < 2))
                alert(`Notice: this browser does not have access to a voice for ${languageInfo[2]}.`);
        });
    }
    setLineSpacing();
    $('body').removeClass('waiting');
}

function setLineSpacing() {
    // Configure line spacing so that left and right panels display the same percentage of
    // their text (aids in scrolling and synchronization of content:

    // New content, so display from its top:
    leftDiv.scrollTop = 0;
    rightDiv.scrollTop = 0;

    /*    if (document.getElementById("leftPara").scrollHeight > 2000) {
            console.log(`SLS: left SH is ${document.getElementById("leftPara").scrollHeight}.`);
            $('body').addClass('waiting');
        }*/

    // Reformat display to match length of new text:
    // First reset both columns to default line height so we can make our computation:
    document.getElementById("leftPara").style.lineHeight = defLineHeight;
    document.getElementById("rightPara").style.lineHeight = defLineHeight;

    let leftHeight = document.getElementById("leftPara").scrollHeight;
    let rightHeight = document.getElementById("rightPara").scrollHeight;
    let leftToRightRatio = leftHeight / rightHeight;
    console.log("left height: " + leftHeight + " right height: " + rightHeight
        + ", Ratio = " + leftToRightRatio);

    //todo: check for "edge" cases here (e.g., less that a screenful of text):
    if (leftToRightRatio < 1)
    // Stretch left side:
        document.getElementById("leftPara").style.lineHeight = (defLineHeight / leftToRightRatio).toString();
    else if (leftToRightRatio > 1)
    // Stretch right side:
        document.getElementById("rightPara").style.lineHeight = (defLineHeight * leftToRightRatio).toString();

    // Due to browser rounding (a "line height" set to 1.59296523517382412 reads back as
    // 1.59297), calculate a compensation factor:
    //
    leftHeight = document.getElementById("leftPara").scrollHeight;
    rightHeight = document.getElementById("rightPara").scrollHeight;
    leftRightHeightFactor = leftHeight / rightHeight;
    // console.log(`After calibration: left column is ${leftHeight} high, right is ${rightHeight}.`);
    // console.log(`                   left line height is ${leftLineHeight}, right is ${rightLineHeight}.`);
    // $('body').removeClass('waiting');
    // console.log(`SLS: exit.`)
}

// Prevent an event from "bubbling" to parent elements:
function keepItLocal(e) {
    e.stopPropagation();
    e.preventDefault();
}

// A file was dropped over a column:
function fileDrop(ev) {
    keepItLocal(ev);
    let dt = ev.dataTransfer;
    let files = dt.files;

    // switch (this.id.toString()) {
    switch (ev.currentTarget.id.toString()) {
        case "leftColumn":
            handleFiles(files, "leftPara", "leftColumnHeader");
            break;
        case "rightColumn":
            handleFiles(files, "rightPara", "rightColumnHeader");
            break;
        default:
            // console.log("fileDrop: error: source ID is: " + this.id.toString());
            console.log("fileDrop: error: source ID is: " + ev.currentTarget.id.toString());
            return;
    }
}

// Text was pasted to a column:
function pasteToCol(ev) {
    let clipboardData, pastedData;
    clipboardData = ev.clipboardData;
    pastedData = clipboardData.getData("Text");

    switch (ev.currentTarget.id.toString()) {
        case "leftColumn":
            document.getElementById("leftPara").textContent = pastedData;
            document.getElementById("leftColumnHeader").textContent = "(pasted)";
            break;
        case "rightColumn":
            document.getElementById("rightPara").textContent = pastedData;
            document.getElementById("rightColumnHeader").textContent = "(pasted)";
            break;
        default:
            console.log("pasteToCol: error: source ID is: " + ev.currentTarget.id.toString());
            return;
    }
}

function handleFiles(files, filePara, fileTitle) {
    const fr = new FileReader();
    fr.onload = function () {
        document.getElementById(filePara).textContent = this.result;
        textEval();
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
    return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
    });
}

function touchMoved() {
    // console.log('touchmoved.');
    touchMove = true;
}

let lookingUpWord = false;
let wordLookedUp = false;
let textWasRead = false;
let touchMove = false;

// A word was long-clicked, look up definition:
async function lookupWord(ev) { // jshint ignore:line

    if (isSyncingLeftScroll || isSyncingRightScroll) return; // Prevent spurious lookups

    // todo: some languages such as Japanese and Chinese do not use word separation characters
    // todo: ..in sentences, so exclude this function for those languages.
    let speakRange;
    lookingUpWord = false;  // Not true until we have waited
    mouseWasMoved = false;
    textWasRead = false;    // Set here and recheck after sleep
    wordLookedUp = false;

    let textSel = window.getSelection();
    if (!textSel.isCollapsed) {
        speakRange = textSel.getRangeAt(0);
        console.log("lookupWord: collapsing selection: " + speakRange.toString().trim());
        speakRange.collapse(true);  // So we can get new selection (below)
    }

    if (speechSynthesis.pending || speechSynthesis.speaking)
        speechSynthesis.cancel();

    //  Android Chrome range change lag:
    await sleep(700); // jshint ignore:line

    if (textWasRead)    // A short click occurred, so read text instead
        return true;    // true = propagation continues

    if (ev.type === "mousedown" && mouseWasMoved) {    // User is dragging over text, rather than long-clicking
        console.log("lookupWord(): mouse was moved, abort.");
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
        // noinspection JSLint
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

    // For Safari and Edge:
    textSel.removeAllRanges();
    textSel.addRange(speakRange);

    let speakStr = speakRange.toString().trim();

    if (!speakStr.length) return;

    let sourceLang = userLang2char;
    if (this.id.toString() === "leftPara")
        sourceLang = leftLanguage;
    else if (this.id.toString() === "rightPara")
        sourceLang = rightLanguage;
    else if (this.id.toString() === "glosbeBuf")
        sourceLang = lastTransLang; // User clicked word in vocab panel; try to drill down

    // Glosbe requires 3-char code (and stores it for next time); speechSynthesis requires 2-char:
    let sourceLang3char = sourceLang;
    if (sourceLang.length === 2)
    /* global iso2to3 */
        sourceLang3char = iso2to3[sourceLang];
    else
        sourceLang = sourceLang.substr(0, 2);

    // Not sure why but the following passes only ONE parameter, with speakStr appended:
    // getTranslation(`from=${sourceLangISO6393}&dest=${destLangISO6393}&phrase=`, speakStr);

    lastTransLang = sourceLang;
    getTranslation(sourceLang3char, userLang3char, speakStr);

    let speakMsg = new SpeechSynthesisUtterance(speakStr);
    speakMsg.lang = sourceLang;

    // Some browsers (e.g., Safari) don't deduce .voice from .lang, we must set .voice also:
    //
    let ssVoice =
        speechSynthesis.getVoices().filter(function (voice) {
            return voice.lang.split(/[-_]/)[0] === speakMsg.lang;
        })[0];

    if (ssVoice)
        speakMsg.voice = ssVoice;
    else {
        console.log(`Notice: this browser does not have a voice for: ${speakMsg.lang}`);
        alert(`Notice: this browser does not have access to a voice for: ${speakMsg.lang}.  See help screen for support.`);
    }

    speakMsg.rate = currentSpeakSpd;
    speechSynthesis.speak(speakMsg);
}

let clickables = document.getElementsByClassName("clickable");

for (let elNum = 0; elNum < clickables.length; elNum++) {
    // noinspection JSUnresolvedFunction
    clickables[elNum].addEventListener("mousedown", lookupWord, {passive: true});
    clickables[elNum].addEventListener("touchstart", lookupWord, {passive: true}); // required for tablet

    clickables[elNum].addEventListener("mousemove", mouseMoved, {passive: true});
    // clickables[elNum].addEventListener("touchmove", mouseMoved, {passive:true}); // tablet

    // noinspection JSUnresolvedFunction
    clickables[elNum].addEventListener("click", readTextAloud, {passive: true});

    // Prevent some touchscreen browsers removing highlighting:
    clickables[elNum].addEventListener("mouseup", keepItLocal, false);
    // clickables[elNum].addEventListener("vmouseup", keepItLocal, false);
    // clickables[elNum].addEventListener("mouseup", setLookupFlag, false);

    // tablet: monitor touch movement to prevent tap handling
    clickables[elNum].addEventListener("touchmove", touchMoved, {passive: true});
}

// A sentence was short-clicked; read it aloud:
function readTextAloud(ev) {
    if (wordLookedUp) {     // A long mousedown occurred, so ignore following click event
        wordLookedUp = false;
        console.log("RTA skip");
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
        if (speakRange.toString().search(/^[.。!?:\n]\s*/) === 0) { // start of sentence
            speakRange.setStart(node, speakRange.startOffset + 1); // move forward char
            break;
        }
    }

    // Find and include end of sentence containing clicked region:
    let searchStr = "";
    let searchRes;
    findSentEnd: while (speakRange.endOffset < node.length) {                // end of node
        speakRange.setEnd(node, speakRange.endOffset + 1);      // look ahead 1 char

        /*        searchStr = speakRange.toString().slice(-2);            // Last 2 chars
                // if (searchStr.search(/[.!?:][\r\n\s]|(\r|\n|\r\n){2}|。/) === 0) { // end of sentence
                if (searchStr.search(/[.!?:][\r\n\s]|\r\r|\n\n|(\r\n){2}|。/) === 0) { // end of sentence
                    speakRange.setEnd(node, speakRange.endOffset - 1); // back 1 char*/

        searchStr = speakRange.toString().slice(-4);            // Last 4 chars
        searchRes = searchStr.search(/[.!?:][\r\n\s]|\r\r|\n\n|(\r\n){2}|。/);

        switch (searchRes) {
            case -1:
                break;
            case 0:
                // Back up to end of sentence:
                speakRange.setEnd(node, speakRange.endOffset - 4);
                break findSentEnd;
            case 2:
                // Back up to end of sentence:
                speakRange.setEnd(node, speakRange.endOffset - 1);
                break findSentEnd;
            default:
                break;
        }
    }

    //See https://stackoverflow.com/questions/49758168/how-to-highlight-desktop-safari-text-selection-in-div-after-range-setstart-r
    textSel.removeAllRanges();
    textSel.addRange(speakRange);

    let speakStr = speakRange.toString().trim();
    let speakMsg = new SpeechSynthesisUtterance(speakStr);

    // console.log(`ev.target is ${ev.target}, ev.target.id.toString() is ${ev.target.id.toString()}.`);
    // let eventTarget = ev.target;

    speakMsg.lang = userLang2char;  // Default to user's native language (and warn, below)
    // if (ev.currentTarget.id.toString() === "leftPara")
    if (ev.target.id.toString() === "leftPara")
        speakMsg.lang = leftLanguage;
    // else if (ev.currentTarget.id.toString() === "rightPara")
    else if (ev.target.id.toString() === "rightPara")
        speakMsg.lang = rightLanguage;

    // Some browsers (e.g., Safari) don't deduce .voice from .lang, we must set .voice also:
    //
    let ssVoice =
        speechSynthesis.getVoices().filter(function (voice) {
            return voice.lang.split(/[-_]/)[0] == speakMsg.lang;
        })[0];

    if (ssVoice)
        speakMsg.voice = ssVoice;
    else {
        console.log(`Notice: this browser does not have a voice for: ${speakMsg.lang}`);
        alert(`Notice: this browser does not have access to a voice for: ${speakMsg.lang}.  See help screen for support.`);
    }

    speakMsg.rate = currentSpeakSpd;    // todo: different languages respond to same rate differently (e.g., en vs fr)
    speechSynthesis.speak(speakMsg);

    // workaround for Chrome 15 second limit on online TTS,
    // see https://stackoverflow.com/questions/42875726/speechsynthesis-speak-in-web-speech-api-always-stops-after-a-few-seconds-in-go
    if (navigator.userAgent.toLowerCase().indexOf("chrome")) {  // Only run under Chrome
        let resumeTimer = setInterval(function () {
            // console.log(synth.speaking);
            if (!speechSynthesis.speaking) clearInterval(resumeTimer);
            else speechSynthesis.resume();
        }, 14000);
    }
}

// Initialize Online Library selection menu for left hand reading pane:

let request = new XMLHttpRequest(); // Create new request
const el = document.createElement("html");

// Read remote directory contents.  To avoid server-side programming, we parse native "directory"
// output of web server:
request.open("GET", "http://bireader.com/library/");
request.onreadystatechange = function () { // Define event listener
    // If the request is complete and was successful, read all but 1st 5 returned <a> elements:
    if (request.readyState === 4 && request.status === 200) {
        el.innerHTML = request.responseText;
        let libraryLinks = el.getElementsByTagName("a"); // Live NodeList of anchor elements
        libFilePaths = []; // global
        libFileURLs = []; // global
        let libFileName = "";
        for (let linkInd = 5; linkInd < libraryLinks.length; linkInd++) {
            libFileName = libraryLinks[linkInd].href.replace(/.*\//g, ""); // Remove all before last "/"
            if (libFileName.length) {
                if (libFileName.search(/\.url$/i) !== -1) { // A ".url" file is found
                    // console.log("found URL: " + libFileName);
                    libFileURLs.push(libFileName);
                }
                else libFilePaths.push(libFileName);
            }
        }
        // Populate chooser (derived from https://stackoverflow.com/a/17002049/5025060):
        let selectList = document.getElementById("leftFileSelect");
        selectList.length = 0; // empty it

        // NB: set this BEFORE populating selectList, else first is set as default choice:
        selectList.size = (libFilePaths.length < 12 ? libFilePaths.length : 12);

        // selectBox auto-sizes the <select> element based on .size (above).
        // todo: how to make this "responsive?"  Code .size based on screen height?

        let optgroup = document.createElement("optgroup");
        optgroup.label = "Select left-hand file:";
        selectList.appendChild(optgroup);

        optgroup = document.createElement("optgroup");
        optgroup.label = `Language: ${userLanguage}:`;
        selectList.appendChild(optgroup);

        // Create and append the file choice options
        // See also, Option object at http://www.javascriptkit.com/jsref/select.shtml#section2
        let userLangEx = new RegExp(`\.${userLang2char}$`, "i");
        for (let linkNum = 0; linkNum < libFilePaths.length; linkNum++) {
            if (libFilePaths[linkNum].search(userLangEx) !== -1) { // Show native lang files first
                let option = document.createElement("option");
                option.value = libFilePaths[linkNum];
                option.text = libFilePaths[linkNum];
                selectList.appendChild(option);
            }
        }
        optgroup = document.createElement("optgroup");
        optgroup.label = `Other languages:`;
        selectList.appendChild(optgroup);

        for (let linkNum = 0; linkNum < libFilePaths.length; linkNum++) {
            if (libFilePaths[linkNum].search(userLangEx) === -1) { // Show non-native lang files
                let option = document.createElement("option");
                option.value = libFilePaths[linkNum];
                option.text = libFilePaths[linkNum];
                selectList.appendChild(option);
            }
        }

        // Try pre-populating rightFileSelect so that selectBox.js will initialize
        // properly:
        let rightList = document.getElementById("rightFileSelect");
        rightList.length = 0; // empty it

        // NB: set this BEFORE populating selectList, else first is set as default choice:
        rightList.size = (libFilePaths.length < 12 ? libFilePaths.length : 12);

        let RFoptgroup = document.createElement("optgroup");
        RFoptgroup.label = "Select right-hand file:";
        rightList.appendChild(RFoptgroup);

        // Initialize selectBox, enabling mobile usage:
        $('select').selectBox({mobile: true,});
    }
};
request.send(null); // Send the request now

// https://stackoverflow.com/a/22978802 says,
// "...the voice list is loaded async to the page. An                  changed
// event is fired when they are loaded":
let voiceList = [];

function doVoices() {
    let ssVoices = speechSynthesis.getVoices();

    for (let voiceInd = 0; voiceInd < ssVoices.length; voiceInd++)
        voiceList[voiceInd] = ssVoices[voiceInd].name + " (" + ssVoices[voiceInd].lang + ")";

    let vList = "<ul>";
    voiceList.forEach(function (listMem) {
        vList += "<li>" + listMem;
    });
    vList += "</ul>";
    document.getElementById("vList").innerHTML = vList;
}

// Workaround for Safari and Firefox voice lists,
// adapted from https://stackoverflow.com/a/28217250/5025060 and
// http://mdn.github.io/web-speech-api/speak-easy-synthesis/
//
doVoices();
if ("onvoiceschanged" in speechSynthesis) {     // trigger on event
    speechSynthesis.onvoiceschanged = doVoices;
}

function getTranslation(fromLang, toLang, toXlate) {
    // JSONP needed because glosbe.com does not provide CORS:
    // $("#glosbeBuf").html("Translations appear here.");

    // lastTransLang = fromLang;  // Save to allow drill down in vocab. pane

    console.log(`getTranslation of: "${toXlate}" (length: ${toXlate.length}) from: ${fromLang} to: ${toLang}`);

    if (typeof localStorage[`${toXlate}.${fromLang}.${toLang}`] !== 'undefined') {
        // Return saved definition to increase performance/reduce Glosbe calls:
        $("#glosbeBuf").html(toXlate + ": " + localStorage[`${toXlate}.${fromLang}.${toLang}`]);
        return false;
    }

    // $.getJSON("https://glosbe.com/gapi/translate?format=json&" + prefix + toXlate + "&callback=?", function (json) {
    $.getJSON("https://glosbe.com/gapi/translate?format=json&from=" + fromLang + "&dest="
        + toLang + "&phrase=" + toXlate + "&callback=?", function (json) {

        if (json !== "Nothing found.") {
            // todo: faults if json.tuc.length undefined:
            if (json.tuc.length)
                if (json.tuc[0].phrase) {
                    $("#glosbeBuf").html(toXlate + ": " + JSON.stringify(json.tuc[0].phrase.text));
                    localStorage[`${toXlate}.${fromLang}.${toLang}`] = JSON.stringify(json.tuc[0].phrase.text);
                } else {
                    $("#glosbeBuf").html(toXlate + ": " + JSON.stringify(json.tuc[0].meanings[0].text));
                    localStorage[`${toXlate}.${fromLang}.${toLang}`] = JSON.stringify(json.tuc[0].meanings[0].text);
                }
            else {
                $("#glosbeBuf").html(toXlate + ": Not found.");
                localStorage[`${toXlate}.${fromLang}.${toLang}`] = "Not found.";
            }
        } else {
            $.getJSON("https://glosbe.com/gapi/translate?format=json&" + toXlate + "&callback=?", function (json) {
                console.log(json);
                $("#glosbeBuf").html("<h3>" + JSON.stringify(json) + "</h3>");
            });
        }
    });
    return false;
}

// End of main.js
