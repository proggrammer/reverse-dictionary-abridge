
angular.module('myApp', [])
    .controller('MyController', function($scope, $http) {
        //var svg = d3.select(".d3js-canvas").append("svg").attr("width", "100%").attr("height", "100%");
        $scope.headerid="headerid";
        $scope.inputid="infieldid";
        $scope.exactMatchSuggestion = "";
        $scope.nextCharSuggestion="";
        $scope.suggestion="";
        $scope.inCache = {};
        $scope.searchInput = undefined;
        $scope.cleanedWordsInputCache = {};
        $scope.hideprogress=true
        $scope.cache={};
        $scope.lastUpdated= Date.now();
        $scope.hideprogress=true;
        $http.get("corpus/tries.json")
            .then(function(response) {
                $scope.tries = response.data;
            });
        $http.get("corpus/dict.json")
            .then(function(response) {
                $scope.dictFile = response.data;
            });
        $http.get("corpus/hashes.json")
            .then(function(response) {
                $scope.hashesFile = response.data;
            });

        $http.get("corpus/hashedHashes.json")
            .then(function(response) {
                $scope.hashedHashes = {};
                let keysArr = Object.keys(response.data)
                keysArr.forEach(k => $scope.hashedHashes[k] = new Set(response.data[k]));
            });
        $scope.moveCursor = function (){
            if(d3.select("[contenteditable]").text().includes("Search for words in Dictionary by their def") || d3.select("[contenteditable]").text().trim().length == 0) {
                return;
            }
            var r = getCaretPositionn();

            if(r == undefined || r[0] == 0) {
                d3.select(".inWowSuggest").html("");
                return;
            }
            var inputText = d3.select("[contenteditable]").text();
            setCursorPositionAtGiven(r[0]);
            inputText = inputText.substring(0, r[0]);
            let arrrr = inputText.trim().split(/[^A-Za-z0-9]/).filter(s => s.trim()!="");
            if(inputText.endsWith(" "))
                $scope.suggestion="";
            else {
                var lastTerm = arrrr[arrrr.length-1];
                if($scope.tries[lastTerm.trim()] == undefined)
                    d3.select(".inWowSuggest").html("");
                else
                    $scope.suggestion = stringiFySuggestion($scope.tries[lastTerm.trim()].map(s => s.replace(lastTerm, "")), lastTerm);
            }
        }
        $scope.changeSearch = function () {
            var inputText = d3.select("[contenteditable]").text();
            if(inputText == undefined || inputText == "" || inputText.endsWith(String.fromCharCode(160)) || inputText.includes("Search for words in Dictionary by their def"))  {
                d3.select(".inWowSuggest").html("");
                drawOPItems($scope.dictFile, $scope.hashesFile);
                return;
            }
            var r = getCaretPositionn();
            updateInputTextHtml(inputText);
            if(r == undefined) {
                return;
            }
            setCursorPositionAtGiven(r[0]);
            inputText = inputText.substring(0, r[0]);
            let arrrr = inputText.trim().split(/[^A-Za-z0-9]/).filter(s => s.trim()!="");
            if(inputText.endsWith(" "))
                $scope.suggestion="";
            else {
                var lastTerm = arrrr[arrrr.length-1];
                if(arrrr.length == 0 || $scope.tries[lastTerm.trim()] == undefined)
                    d3.select(".inWowSuggest").html("");
                else
                    $scope.suggestion = stringiFySuggestion($scope.tries[lastTerm.trim()].map(s => s.replace(lastTerm, "")), lastTerm);
            }
            drawOPItems($scope.dictFile, $scope.hashesFile);
        }
        function setCaret( nodePos, offset) {
            var el = document.getElementById("inWow");
            var range = document.createRange();
            var sel = window.getSelection();
            if(el.childNodes[nodePos].childNodes.length == 0) {
                if(el.childNodes[nodePos].length<offset)
                    offset = el.childNodes[nodePos].length
                range.setStart(el.childNodes[nodePos], offset);
            }
            else {
                if(el.childNodes[nodePos].childNodes[0].length<offset)
                    offset = el.childNodes[nodePos].length
                range.setStart(el.childNodes[nodePos].childNodes[0], offset);
            }
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
        function setCursorPositionAtGiven(caretPos) {
            var fullText = document.getElementById("inWow").textContent;
            var tillNowText = fullText.substring(0,caretPos);
            var totalString = "";
            var nnode = -1;
            var nnodeOS = -1
            for(var i=0; i<document.getElementById("inWow").childNodes.length; i++)   {
                var txt = document.getElementById("inWow").childNodes[i].textContent;
                totalString = totalString+txt;
                if(tillNowText.length<=totalString.length) {
                    nnode = i;
                    nnodeOS = caretPos-totalString.length+txt.length;
                    break;
                }
            }
            setCaret(nnode, nnodeOS);
        }
        function updateInputTextHtml(inputStr)  {
            let text = inputStr.toLowerCase();
            let endSpace = text.endsWith(String.fromCharCode(160)) || text.endsWith(" ") ? text.substring(text.length-1, text.length) : "";
            let arrrr = text.split(/[^A-Za-z0-9]/).filter(s => s.trim()!="");

            var htmlContent = "";
            const strs = [];
            arrrr.forEach(a => {
                var r = "";
                if($scope.tries[a] != undefined && $scope.tries[a].includes("<"+a+">"))    {
                    let s = "<span style=\"color: green\">"+a+"</span>";
                    strs.push(s);
                }
                // else if($scope.tries[a] != undefined)   {
                //     let s = "<span style=\"color: blue\">"+a+"</span>";
                //     strs.push(s);
                // }
                else{
                    var notMatchIndex=0;
                    for(notMatchIndex=1; notMatchIndex<=a.length;notMatchIndex++)    {
                        var subStr = a.substring(0, notMatchIndex);
                        if($scope.tries[subStr] == undefined)
                            break
                    }
                    notMatchIndex-=1;
                    let s = "<span style=\"color: orange\">"+a.substring(0,notMatchIndex)+"</span>"+
                        "<span style=\"color: red\">"+a.substring(notMatchIndex,a.length)+"</span>"
                    strs.push(s);
                }
            });
            htmlContent = strs.join(" ")+(endSpace==""? "" : String.fromCharCode(160)   );
            d3.select(".inWow").html(htmlContent);
        }

        function node_walk(node, func) {
            var result = func(node);
            for(node = node.firstChild; result !== false && node; node = node.nextSibling)
                result = node_walk(node, func);
            return result;
        };
        function getCaretPositionn() {
            var elem  = document.getElementById("inWow");
            var sel = window.getSelection();
            var cum_length = [0, 0];

            if(sel.anchorNode == elem)
                cum_length = [sel.anchorOffset, sel.extentOffset];
            else {
                var nodes_to_find = [sel.anchorNode, sel.extentNode];
                if(!elem.contains(sel.anchorNode) || !elem.contains(sel.extentNode))
                    return undefined;
                else {
                    var found = [0,0];
                    var i;
                    node_walk(elem, function(node) {
                        for(i = 0; i < 2; i++) {
                            if(node == nodes_to_find[i]) {
                                found[i] = true;
                                if(found[i == 0 ? 1 : 0])
                                    return false; // all done
                            }
                        }

                        if(node.textContent && !node.firstChild) {
                            for(i = 0; i < 2; i++) {
                                if(!found[i])
                                    cum_length[i] += node.textContent.length;
                            }
                        }
                    });
                    cum_length[0] += sel.anchorOffset;
                    cum_length[1] += sel.extentOffset;
                }
            }
            if(cum_length[0] <= cum_length[1])
                return cum_length;
            return [cum_length[1], cum_length[0]];
        }
        function createRange(node, chars, range) {
            if (!range) {
                range = document.createRange()
                range.selectNode(node);
                range.setStart(node, 0);
            }

            if (chars.count === 0) {
                range.setEnd(node, chars.count);
            } else if (node && chars.count >0) {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.length < chars.count) {
                        chars.count -= node.textContent.length;
                    } else {
                        range.setEnd(node, chars.count);
                        chars.count = 0;
                    }
                } else {
                    for (var lp = 0; lp < node.childNodes.length; lp++) {
                        range = createRange(node.childNodes[lp], chars, range);

                        if (chars.count === 0) {
                            break;
                        }
                    }
                }
            }

            return range;
        };

        $scope.onFocus = function ()    {
            $scope.searchInput = d3.select("[contenteditable]").html();
            if($scope.searchInput.includes("Search for words in Dictionary by their def"))
                d3.select("[contenteditable]").html("");
        }
        $scope.onFocusout = function ()    {
            $scope.searchInput = d3.select("[contenteditable]").html();
            if($scope.searchInput == undefined || $scope.searchInput.trim() == "" || $scope.searchInput.replace("<br>","").trim()=="")
                d3.select("[contenteditable]").html("Search for words in Dictionary by their def<span style=\"color: red\">initions..</span> example : 'someone who donates' or 'female dog'");
        }
        function stringiFySuggestion(list, lastTerm)  {
            if(list == undefined || list.length == 0)
                return "";
            var correctWordArr = list.filter(s => s.startsWith("<") && s.endsWith(">"));
            var result = "";
            $scope.exactMatchSuggestion = result;
            result="";
            var suggestCharArr = list.filter(s => !(s.startsWith("<") && s.endsWith(">"))).sort();
            if(suggestCharArr.length>0)
                result += "<span style=\"color: rosybrown\">Next character suggestion: </span>" + suggestCharArr.join(" ");
            //$scope.nextCharSuggestion = result;
            d3.select(".inWowSuggest").html(result);
            return result;
        }
        function approxWordProcess(word)   {
            let allKeys = $scope.hashedHashes[word.substring(0,1)];
            if(allKeys.has(word))
                return word;
            else
            {
                let minEdit = 100;
                let approxWord = "";
                allKeys = Array.from(allKeys);
                for(let i=0; i<allKeys.length; i++)  {
                    let ed = fasterEditDist(allKeys[i], word, allKeys[i].length, word.length)

                    if(minEdit > ed) {
                        minEdit = ed;
                        approxWord = allKeys[i];
                    }
                    if(minEdit==1)
                        break;
                }
                if(minEdit <= word.length)
                    return approxWord;
                else return "";
            }
        }

    }).directive('contenteditable', function() {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, elm, attr, ngModel) {

            function updateViewValue() {
                ngModel.$setViewValue(this.innerHTML);
            }

            //Or bind it to any other events
            elm.on('keyup', updateViewValue);

            scope.$on('$destroy', function() {
                elm.off('keyup', updateViewValue);
            });

            ngModel.$render = function() {
                elm.html(ngModel.$viewValue);
            }

        }
    }
});;
function min(x, y, z)
{
    if (x <= y && x <= z)
        return x;
    if (y <= x && y <= z)
        return y;
    else
        return z;
}
function fasterEditDist(str1, str2, m, n) {
    let set1 = new Set(Array.from(str1));
    let set2 = new Set(Array.from(str2));

    let intersect = new Set([...set1].filter(i => set2.has(i))) //set1.filter(e => set2.has(e))
    let minLength = min(set1.length, set2.length)
    if(intersect.length < minLength/2 || intersect.length+2<minLength)
        return 100;
    else return editDist(str1, str2, m, n)
}

function editDist(str1, str2, m, n)
{

    // If first string is empty, the
    // only option is to insert all
    // characters of second string into first
    if (m == 0)
        return n;

    // If second string is empty, the only
    // option is to remove all characters
    // of first string
    if (n == 0)
        return m;

    // If last characters of two strings are
    // same, nothing much to do. Ignore last
    // characters and get count for remaining
    // strings.
    if (str1[m - 1] == str2[n - 1])
        return editDist(str1, str2, m - 1, n - 1);

    // If last characters are not same, consider all
    // three operations on last character of first
    // string, recursively compute minimum cost for all
    // three operations and take minimum of three
    // values.
    return 1 +
        min(editDist(str1, str2, m, n - 1), // Insert
            editDist(str1, str2, m - 1, n), // Remove
            editDist(str1, str2, m - 1, n - 1)); // Replace
}

