angular.module('myApp', [])
    .controller('MyController', function($scope, $http) {
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
        drwCld2([]);
        $http.get("corpus/tries.json")
            .then(function(response) {
                $scope.tries = response.data;
            });
        $http.get("corpus/dict.json")
            .then(function(response) {
                $scope.dictFile = response.data;
                $scope.dictFileMap = getDictMapForOPConsumption(response.data);
            });
        $http.get("corpus/hashes.json")
            .then(function(response) {
                $scope.hashesFile = response.data;
            });
        $scope.moveCursor = function (){
            if(d3.select("[contenteditable]").text().includes("Search for words in Dictionary by their def") || d3.select("[contenteditable]").text().trim().length == 0) {
                return;
            }
            var r = getCaretPositionn();

            if(r == undefined || r[0] == 0) {
                d3.select(".input-suggestion").html("");
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
                    d3.select(".input-suggestion").html("");
                else
                    $scope.suggestion = stringiFySuggestion($scope.tries[lastTerm.trim()].map(s => s.replace(lastTerm, "")), lastTerm);
            }
        }
        $scope.changeSearch = function () {
            var inputText = d3.select("[contenteditable]").text();

            if(inputText == undefined || inputText == "" || inputText.endsWith(String.fromCharCode(160)) || inputText.includes("Search for words in Dictionary by their def"))  {
                d3.select(".input-suggestion").html("");
                drawOPItems($scope.dictFile, $scope.hashesFile, $scope.dictFileMap);
                return;
            }
            var r = getCaretPositionn();
            updateInputTextHtml(inputText);
            if(r == undefined) {
                drawOPItems($scope.dictFile, $scope.hashesFile, $scope.dictFileMap);
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
                    d3.select(".input-suggestion").html("");
                else
                    $scope.suggestion = stringiFySuggestion($scope.tries[lastTerm.trim()].map(s => s.replace(lastTerm, "")), lastTerm);
            }
            setTimeout(function (){
                drawOPItems($scope.dictFile, $scope.hashesFile, $scope.dictFileMap);
            }, 1500);
        }
        function setCaret( nodePos, offset) {
            var el = document.getElementById("input-id");
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
            var fullText = document.getElementById("input-id").textContent;
            var tillNowText = fullText.substring(0,caretPos);
            var totalString = "";
            var nnode = -1;
            var nnodeOS = -1
            for(var i=0; i<document.getElementById("input-id").childNodes.length; i++)   {
                var txt = document.getElementById("input-id").childNodes[i].textContent;
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
            d3.select(".input-id").html(htmlContent);
        }

        function node_walk(node, func) {
            var result = func(node);
            for(node = node.firstChild; result !== false && node; node = node.nextSibling)
                result = node_walk(node, func);
            return result;
        };
        function getCaretPositionn() {
            var elem  = document.getElementById("input-id");
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
                d3.select("[contenteditable]").html("Search for words in Dictionary by their def<span style=\"color: red\">initions..</span> example : 'hair cut occupation' or 'male cow'");
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
            d3.select(".input-suggestion").html(result);
            return result;
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
});
function getDictMapForOPConsumption(dict)   {
    var map = {};
    dict.forEach(el => {
        map[el.w] = "."+el.g+".<br>"+ el.m +"<br>" +el.u;
    })
    return map;
}

