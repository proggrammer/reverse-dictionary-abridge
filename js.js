
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
                return;
            }
            var r = getCaretPositionn();

            updateInputTextHtml(inputText);
            if(r == undefined)
                return;
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
                if($scope.tries[a] != undefined)    {
                    let s = "<span style=\"color: green\">"+a+"</span>";
                    strs.push(s);
                }
                else{
                    var notMatchIndex=0;
                    for(notMatchIndex=1; notMatchIndex<a.length;notMatchIndex++)    {
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
                result += "<span style=\"color: rosybrown\">Next Char Suggestion: </span>" + suggestCharArr.join(" ");
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
/// porter stem
var rgxDouble = /(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/;
// Definition for Step Ia suffixes.
var rgxSFXsses = /(.+)(sses)$/;
var rgxSFXiedORies2 = /(.{2,})(ied|ies)$/;
var rgxSFXiedORies1 = /(.{1})(ied|ies)$/;
var rgxSFXusORss = /(.+)(us|ss)$/;
var rgxSFXs = /(.+)(s)$/;
// Definition for Step Ib suffixes.
var rgxSFXeedlyOReed = /(.*)(eedly|eed)$/;
var rgxSFXedORedlyORinglyORing = /([aeiouy].*)(ed|edly|ingly|ing)$/;
var rgxSFXatORblORiz = /(at|bl|iz)$/;
// Definition for Step Ic suffixes.
var rgxSFXyOR3 = /(.+[^aeiouy])([y3])$/;
// Definition for Step II suffixes; note we have spot the longest suffix.
var rgxSFXstep2 = /(ization|ational|fulness|ousness|iveness|tional|biliti|lessli|entli|ation|alism|aliti|ousli|iviti|fulli|enci|anci|abli|izer|ator|alli|bli|ogi|li)$/;
var rgxSFXstep2WithReplacements = [
    // Length 7.
    { rgx: /ational$/, replacement: 'ate' },
    { rgx: /ization$/, replacement: 'ize' },
    { rgx: /fulness$/, replacement: 'ful' },
    { rgx: /ousness$/, replacement: 'ous' },
    { rgx: /iveness$/, replacement: 'ive' },
    // Length 6.
    { rgx: /tional$/, replacement: 'tion' },
    { rgx: /biliti$/, replacement: 'ble' },
    { rgx: /lessli$/, replacement: 'less' },
    // Length 5.
    { rgx: /iviti$/, replacement: 'ive' },
    { rgx: /ousli$/, replacement: 'ous' },
    { rgx: /ation$/, replacement: 'ate' },
    { rgx: /entli$/, replacement: 'ent' },
    { rgx: /(.*)(alism|aliti)$/, replacement: '$1al' },
    { rgx: /fulli$/, replacement: 'ful' },
    // Length 4.
    { rgx: /alli$/, replacement: 'al' },
    { rgx: /ator$/, replacement: 'ate' },
    { rgx: /izer$/, replacement: 'ize' },
    { rgx: /enci$/, replacement: 'ence' },
    { rgx: /anci$/, replacement: 'ance' },
    { rgx: /abli$/, replacement: 'able' },
    // Length 3.
    { rgx: /bli$/, replacement: 'ble' },
    { rgx: /(.*)(l)(ogi)$/, replacement: '$1$2og' },
    // Length 2.
    { rgx: /(.*)([cdeghkmnrt])(li)$/, replacement: '$1$2' }
];
// Definition for Step III suffixes; once again spot the longest one first!
var rgxSFXstep3 = /(ational|tional|alize|icate|iciti|ative|ical|ness|ful)$/;
var rgxSFXstep3WithReplacements = [
    { rgx: /ational$/, replacement: 'ate' },
    { rgx: /tional$/, replacement: 'tion' },
    { rgx: /alize$/, replacement: 'al' },
    { rgx: /(.*)(icate|iciti|ical)$/, replacement: '$1ic' },
    { rgx: /(ness|ful)$/, replacement: '' },
];
// Definition for Step IV suffixes.
var rgxSFXstep4 = /(ement|ance|ence|able|ible|ment|ant|ent|ism|ate|iti|ous|ive|ize|al|er|ic)$/;
var rgxSFXstep4Full = /(ement|ance|ence|able|ible|ment|ant|ent|ism|ate|iti|ous|ive|ize|ion|al|er|ic)$/;
var rgxSFXstep4ion = /(.*)(s|t)(ion)$/;
// Exceptions Set I.
var exceptions1 = Object.create( null );
// Mapped!
exceptions1.skis = 'ski';
exceptions1.skies = 'sky';
exceptions1.dying = 'die';
exceptions1.lying = 'lie';
exceptions1.tying = 'tie';
exceptions1.idly = 'idl';
exceptions1.gently = 'gentl';
exceptions1.ugly = 'ugli';
exceptions1.early = 'earli';
exceptions1.only = 'onli';
exceptions1.singly = 'singl';
// Invariants!
exceptions1.sky = 'sky';
exceptions1.news = 'news';
exceptions1.atlas = 'atlas';
exceptions1.cosmos = 'cosmos';
exceptions1.bias = 'bias';
exceptions1.andes = 'andes';

// Exceptions Set II.
// Note, these are to be treated as full words.
var rgxException2 = /^(inning|outing|canning|herring|proceed|exceed|succeed|earring)$/;

// ## Private functions

// ### prelude
/**
 * Performs initial pre-processing by transforming the input string `s` as
 * per the replacements.
 *
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var prelude = function ( s ) {
    return ( s
            // Handle `y`'s.
            .replace( /^y/, '3' )
            .replace( /([aeiou])y/, '$13' )
            // Handle apostrophe.
            .replace( /\’s$|\'s$/, '' )
            .replace( /s\’$|s\'$/, '' )
            .replace( /[\’\']$/, '' )
    );
}; // prelude()

// ### isShort
/**
 * @param {String} s Input string
 * @return {Boolean} `true` if `s` is a short syllable, `false` otherwise
 * @private
 */
var isShort = function ( s ) {
    // (a) a vowel followed by a non-vowel other than w, x or 3 and
    // preceded by a non-vowel, **or** (b) a vowel at the beginning of the word
    // followed by a non-vowel.
    return (
        (
            (
                ( /[^aeiouy][aeiouy][^aeiouywx3]$/ ).test( s ) ||
                ( /^[aeiouy][^aeiouy]{0,1}$/ ).test( s ) // Removed this new changed??
            )
        )
    );
}; // isShort()

// ### markRegions
/**
 * @param {String} s Input string
 * @return {Object} the `R1` and `R2` regions as an object from the input string `s`.
 * @private
 */
var markRegions = function ( s ) {
    // Matches of `R1` and `R2`.
    var m1, m2;
    // To detect regions i.e. `R1` and `R2`.
    var rgxRegions = /[aeiouy]+([^aeiouy]{1}.+)/;
    m1 = rgxRegions.exec( s );
    if ( !m1 ) return ( { r1: '', r2: '' } );
    m1 = m1[ 1 ].slice( 1 );
    // Handle exceptions here to prevent over stemming.
    m1 = ( ( /^(gener|commun|arsen)/ ).test( s ) ) ? s.replace( /^(gener|commun|arsen)(.*)/, '$2') : m1;
    m2 = rgxRegions.exec( m1 );
    if ( !m2 ) return ( { r1: m1, r2: '' } );
    m2 = m2[ 1 ].slice( 1 );
    return ( { r1: m1, r2: m2 } );
}; // markRegions()

// ### step1a
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step1a = function ( s ) {
    var wordPart;
    if ( rgxSFXsses.test( s ) ) return ( s.replace( rgxSFXsses, '$1ss' ) );
    if ( rgxSFXiedORies2.test( s ) ) return ( s.replace( rgxSFXiedORies2, '$1i' ) );
    if ( rgxSFXiedORies1.test( s ) ) return ( s.replace( rgxSFXiedORies1, '$1ie' ) );
    if ( rgxSFXusORss.test( s ) ) return ( s );
    wordPart = s.replace( rgxSFXs, '$1' );
    if ( ( /[aeiuouy](.+)$/ ).test( wordPart ) ) return ( s.replace( rgxSFXs, '$1' ) );
    return ( s );
}; // step1a()

// ### step1b
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step1b = function ( s ) {
    var rgn = markRegions( s ),
        sd;
    // Search for the longest among the `eedly|eed` suffixes.
    if ( rgxSFXeedlyOReed.test( s ) )
        // Replace by ee if in R1.
        return ( rgxSFXeedlyOReed.test( rgn.r1 ) ? s.replace( rgxSFXeedlyOReed, '$1ee' ) : s );
    // Delete `ed|edly|ingly|ing` if the preceding word part contains a vowel.
    if ( rgxSFXedORedlyORinglyORing.test( s ) ) {
        sd = s.replace( rgxSFXedORedlyORinglyORing, '$1' );
        rgn = markRegions( sd );
        // And after deletion, return either
        return ( rgxSFXatORblORiz.test( sd ) ) ? ( sd + 'e' ) :
            // or
            ( rgxDouble.test( sd ) ) ? ( sd.replace( /.$/, '' ) ) :
                // or
                ( ( isShort( sd ) ) && ( rgn.r1 === '' ) ) ? ( sd + 'e' ) :
                    // or
                    sd;
    }
    return ( s );
}; // step1b()

// ### step1c
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step1c = function ( s ) {
    return ( s.replace( rgxSFXyOR3, '$1i') );
}; // step1c()

// ### step2
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step2 = function ( s ) {
    var i, imax,
        rgn = markRegions( s ),
        us; // updated s.
    var match = s.match( rgxSFXstep2 );
    match = ( match === null ) ? '$$$$$' : match[ 1 ];
    if ( rgn.r1.indexOf( match ) !== -1 ) {
        for ( i = 0, imax = rgxSFXstep2WithReplacements.length; i < imax; i += 1 ) {
            us = s.replace( rgxSFXstep2WithReplacements[ i ].rgx, rgxSFXstep2WithReplacements[ i ].replacement );
            if ( s !== us ) return ( us );
        }
    }
    return ( s );
}; // step2()

// ### step3
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step3 = function ( s ) {
    var i, imax,
        rgn = markRegions( s ),
        us; // updated s.
    var match = s.match( rgxSFXstep3 );
    match = ( match === null ) ? '$$$$$' : match[ 1 ];

    if ( rgn.r1.indexOf( match ) !== -1 ) {
        for ( i = 0, imax = rgxSFXstep3WithReplacements.length; i < imax; i += 1 ) {
            us = s.replace( rgxSFXstep3WithReplacements[ i ].rgx, rgxSFXstep3WithReplacements[ i ].replacement );
            if ( s !== us ) return ( us );
        }
        if ( ( /ative/ ).test( rgn.r2 ) ) return s.replace( /ative$/, '' );
    }
    return ( s );
}; // step3()

// ### step4
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step4 = function ( s ) {
    var rgn = markRegions( s );
    var match = s.match( rgxSFXstep4Full );
    match = ( match === null ) ? '$$$$$' : match[ 1 ];
    if ( rgxSFXstep4Full.test( s ) &&  rgn.r2.indexOf( match ) !== -1 ) {
        return rgxSFXstep4.test( s ) ? s.replace( rgxSFXstep4, '' ) :
            (
                rgxSFXstep4ion.test( s ) ?
                    s.replace( rgxSFXstep4ion, '$1$2') :
                    s
            );
    }
    return ( s );
}; // step4()

// ### step5
/**
 * @param {String} s Input string
 * @return {String} Processed string
 * @private
 */
var step5 = function ( s ) {
    var preceding, rgn;
    // Search for the `e` suffixes.
    rgn = markRegions( s );
    if ( ( /e$/i ).test( s ) ) {
        preceding = s.replace( /e$/, '' );
        return (
            // Found: delete if in R2, or in R1 and not preceded by a short syllable
            ( /e/ ).test( rgn.r2 ) || ( ( /e/ ).test( rgn.r1 ) && !isShort( preceding ) ) ?
                preceding : s
        );
    }
    // Search for the `l` suffixes.
    if ( ( /l$/ ).test( s ) ) {
        rgn = markRegions( s );
        // Found: delete if in R2
        return ( rgn.r2 && ( /l$/ ).test( rgn.r2 ) ? s.replace( ( /ll$/ ), 'l' ) : s );
    }
    // If nothing happens, must return the string!
    return ( s );
}; // step5()

// ## Public functions
// ### stem
/**
 *
 * Stems an inflected `word` using Porter2 stemming algorithm.
 *
 * @param {string} word — word to be stemmed.
 * @return {string} — the stemmed word.
 *
 * @example
 * stem( 'consisting' );
 * // -> consist
 */
var stem = function ( word ) {
    if(word.trim().length == 0) return "";
    var str = word.toLowerCase();
    if ( str.length < 3 ) return ( str );
    if ( exceptions1[ str ] ) return ( exceptions1[ str ] );
    str = prelude( str );
    str = step1a( str );

    if ( !rgxException2.test( str ) ) {
        str = step1b( str );
        str = step1c( str );
        str = step2( str );
        str = step3( str );
        str = step4( str );
        str = step5( str );
    }

    str = str.replace( /3/g , 'y' );
    return ( str );
};
