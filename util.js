function utilChangeSearch() {

    const inputText = d3.select("[contenteditable]").text();
    if (inputBoxHasNoValue(inputText)) return;

    const sel = window.getSelection();
    const inputElement = document.getElementById("input-id");
    const cursor = getCursorPosition(sel, inputElement);

    utilUpdateInput(inputText);
    if (cursor != undefined) {
        setCursorPositionAtGiven(cursor[0], inputElement);
        utilUpdateSuggestion(cursor[0], inputText);
    }
    const amyDebounce = debounce(drawingWork, 1000);
    setTimeout(amyDebounce, 1000);
}

function drawingWork() {
    const presentCanvasState = (window.canvasState == undefined) ? {} : window.canvasState;
    window.canvasState = updateCanvasAndGetCanvasState(d3.select("[contenteditable]").text(), presentCanvasState);
}

function debounce(func, wait) {
    if (window.timeoutList == undefined) window.timeoutList = [];
    let timeout;
    return (...args) => {
        window.timeoutList.forEach(t => clearTimeout(t));
        window.timeoutList = [];
        timeout = setTimeout(() => func(...args), wait)
        window.timeoutList.push(timeout);
    }
}

function setCursorPositionAtGiven(caretPos, ele) {
    if (ele == undefined) return;
    var fullText = ele.textContent;
    var tillNowText = fullText.substring(0, caretPos);
    var totalString = "";
    var nnode = -1;
    var nnodeOS = -1
    for (var i = 0; i < ele.childNodes.length; i++) {
        var txt = ele.childNodes[i].textContent;
        totalString = totalString + txt;
        if (tillNowText.length <= totalString.length) {
            nnode = i;
            nnodeOS = caretPos - totalString.length + txt.length;
            break;
        }
    }
    setCaret(nnode, nnodeOS);
}

function setCaret(nodePos, offset) {
    var el = document.getElementById("input-id");
    var range = document.createRange();
    var sel = window.getSelection();
    if (el.childNodes[nodePos].childNodes.length == 0) {
        if (el.childNodes[nodePos].length < offset)
            offset = el.childNodes[nodePos].length
        range.setStart(el.childNodes[nodePos], offset);
    } else {
        if (el.childNodes[nodePos].childNodes[0].length < offset)
            offset = el.childNodes[nodePos].length
        range.setStart(el.childNodes[nodePos].childNodes[0], offset);
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function utilUpdateInput(inputStr) {
    let text = inputStr.toLowerCase();
    let endSpace = text.endsWith(String.fromCharCode(160)) || text.endsWith(" ") ? text.substring(text.length - 1, text.length) : "";
    let arrrr = text.split(/[^A-Za-z0-9]/).filter(s => s.trim() != "");

    var htmlContent = "";
    const strs = [];
    arrrr.forEach(a => {
        var r = "";
        if (window.tries[a] != undefined && window.tries[a].includes("<" + a + ">")) {
            let s = "<span style=\"color: green\">" + a + "</span>";
            strs.push(s);
        } else {
            var notMatchIndex = 0;
            for (notMatchIndex = 1; notMatchIndex <= a.length; notMatchIndex++) {
                var subStr = a.substring(0, notMatchIndex);
                if (window.tries[subStr] == undefined)
                    break
            }
            notMatchIndex -= 1;
            let s = "<span style=\"color: orange\">" + a.substring(0, notMatchIndex) + "</span>" +
                "<span style=\"color: red\">" + a.substring(notMatchIndex, a.length) + "</span>"
            strs.push(s);
        }
    });
    htmlContent = strs.join(" ") + (endSpace == "" ? "" : String.fromCharCode(160));
    d3.select(".input-box").html(htmlContent);
}

function utilUpdateSuggestion(cursorPosition, inputText) {
    if (cursorPosition == 0 || cursorPosition == undefined) {
        setHTML(".input-suggestion", "");
        return;
    }
    if (inputBoxHasNoValue(inputText)) {
        return;
    }
    setCursorPositionAtGiven(cursorPosition);
    inputText = inputText.substring(0, cursorPosition);
    let arrrr = inputText.trim().split(/[^A-Za-z0-9]/).filter(s => s.trim() != "");
    if (inputText.endsWith(" "))
        setHTML(".input-suggestion", "");
    else {
        var lastTerm = arrrr[arrrr.length - 1];
        if (window.tries[lastTerm.trim()] == undefined)
            setHTML(".input-suggestion", "");
        else {
            const suggestion = stringiFySuggestion(window.tries[lastTerm.trim()].map(s => s.replace(lastTerm, "")), lastTerm);
            setHTML(".input-suggestion", suggestion);
        }
    }
}

function utilMoveCursor() {
    const sel = window.getSelection();
    const inputElement = document.getElementById("input-id");
    const cursor = getCursorPosition(sel, inputElement);
    utilUpdateSuggestion((cursor == undefined ? 0 : cursor[0]), d3.select("[contenteditable]").text());
}

function utilFocus() {
    const searchInput = d3.select("[contenteditable]").html();
    if (searchInput.includes("Search for words in Dictionary by their def"))
        d3.select("[contenteditable]").html("");
}

function utilFocusOut() {
    const searchInput = d3.select("[contenteditable]").html();
    if (searchInput == undefined || searchInput.trim() == "" || searchInput.replace("<br>", "").trim() == "")
        d3.select("[contenteditable]").html("Search for words in Dictionary by their def<span style=\"color: red\">initions..</span> example : 'hair cut occupation' or 'male cow'");
}

function inputBoxHasNoValue(inputText) {
    return inputText == undefined || inputText.includes("Search for words in Dictionary by their def") || inputText.trim().length == 0;
}

function setHTML(selector, value) {
    d3.select(selector).html(value);
}

function stringiFySuggestion(list, lastTerm) {
    if (list == undefined || list.length == 0)
        return "";
    var correctWordArr = list.filter(s => s.startsWith("<") && s.endsWith(">"));
    var result = "";
    result = "";
    var suggestCharArr = list.filter(s => !(s.startsWith("<") && s.endsWith(">"))).sort();
    if (suggestCharArr.length > 0)
        result += "<span style=\"color: rosybrown\">Next character suggestion: </span>" + suggestCharArr.join(" ");
    return result;
}

function node_walk(node, func) {
    var result = func(node);
    for (node = node.firstChild; result !== false && node; node = node.nextSibling)
        result = node_walk(node, func);
    return result;
};

function getCursorPosition(sel, elem) {

    var cum_length = [0, 0];

    if (sel.anchorNode == elem)
        cum_length = [sel.anchorOffset, sel.extentOffset];
    else {
        var nodes_to_find = [sel.anchorNode, sel.extentNode];
        if (!elem.contains(sel.anchorNode) || !elem.contains(sel.extentNode))
            return undefined;
        else {
            var found = [0, 0];
            var i;
            node_walk(elem, function (node) {
                for (i = 0; i < 2; i++) {
                    if (node == nodes_to_find[i]) {
                        found[i] = true;
                        if (found[i == 0 ? 1 : 0])
                            return false; // all done
                    }
                }

                if (node.textContent && !node.firstChild) {
                    for (i = 0; i < 2; i++) {
                        if (!found[i])
                            cum_length[i] += node.textContent.length;
                    }
                }
            });
            cum_length[0] += sel.anchorOffset;
            cum_length[1] += sel.extentOffset;
        }
    }
    if (cum_length[0] <= cum_length[1])
        return cum_length;
    return [cum_length[1], cum_length[0]];
}