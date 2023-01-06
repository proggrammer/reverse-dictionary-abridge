function updateCanvasAndGetCanvasState(inputText, presentCanvasState){
    return drawOPItemsAndGetNewCanvasState(window.dictionary, window.hashes, presentCanvasState, inputText);
}
function drawOPItemsAndGetNewCanvasState(dictionary, hashes, presentCanvasState, inputText){
    //presentCanvasState
    //it has ipState Map word -> (stem, index)
    // opState words Map word -> defContains[],

    if (presentCanvasState == undefined) presentCanvasState = {};

    if (presentCanvasState.ipState == undefined) presentCanvasState.ipState = {};
    if (presentCanvasState.opState == undefined) presentCanvasState.opState = {};

    const wordsTillNow = Object.keys(presentCanvasState.ipState);//words till now
    var inputTextAsArray = inputText.split(/\s+/).filter(s => s.trim() !== "");
    const wordsToAdd = inputTextAsArray.filter(s => !wordsTillNow.includes(s));//words to add
    const wordsToRemove = wordsTillNow.filter(s => !inputTextAsArray.includes(s));//words to remove
    console.log(wordsToRemove);
    presentCanvasState = updateCanvasStateAndReturnIt(wordsToAdd, wordsToRemove, presentCanvasState, hashes, inputTextAsArray);
    const data = dataToDigest(presentCanvasState);
    drawCloud(data, dictionary);
    window.data = data;
    return presentCanvasState
}

function updateCanvasStateAndReturnIt(wordsToAdd, wordsToRemove, presentCanvasState, hashes, inputTextAsArray)  {
    const result = getUpdatedIpOpState(wordsToAdd, wordsToRemove, presentCanvasState, inputTextAsArray, hashes);
    return result;
}
function getUpdatedIpOpState(wordsToAdd, wordsToRemove, presentCanvasState, inputTextAsArray, hashes) {
    var ipState = presentCanvasState.ipState;
    var opState = presentCanvasState.opState;
    wordsToRemove.forEach(defWord => {
        const stem = ipState[defWord].stem;
        const presentIn = hashes[stem];
        if (presentIn != undefined) {
            presentIn.forEach((dictWord) => {
                if (opState[dictWord] != undefined) {
                    // opState[dictWord] = opState[dictWord].map(s => s != defWord);
                    const index = opState[dictWord].indexOf(defWord);
                    if (index > -1) { // only splice array when item is found
                        opState[dictWord].splice(index, 1); // 2nd parameter means remove one item only
                    }
                    if(opState[dictWord].length == 0)
                        delete opState[dictWord];
                }
            });
        }
        delete ipState[defWord];
    });
    for(var k in opState)   {
        if(opState[k].includes(true)) {
            console.log("jhamela");
            console.log(opState[k]);
        }
    }

    console.log("inputTextAsArray");
    console.log(inputTextAsArray);
    inputTextAsArray.forEach((defWord, i) => {
        if(wordsToAdd.includes(defWord)) {
            var stem = stemIt(defWord);
            ipState[defWord] = {"stem": stem, "index": i};
            const presentIn = hashes[stem];
            if (presentIn != undefined) {
                presentIn.forEach((dictWord) => {
                    if (opState[dictWord] == undefined) {
                        opState[dictWord] = [];
                    }
                    if (!opState[dictWord].includes(defWord)) ///optimization , have set instead of array
                        opState[dictWord].push(defWord);
                });
            }
        }
    });

    return {"ipState": ipState, "opState": opState};
}
