function drawOPItems(dict, hashes)  {
    var inputText = d3.select("[contenteditable]").text();
    var inputTextAsArray = inputText.split(/\s+/);
    if(window.bi == undefined)
        window.bi = {};
    if(window.allOPWords == undefined)
        window.allOPWords = {};
    var itemsToBeAdded = inputTextAsArray.filter(s => window.bi[s] === undefined);
    var itemsToBeRemoved = Object.keys(window.bi).filter(s => !inputTextAsArray.includes(s));
    window.wordsToBeAdded = [];
    window.wordsToBeRemoved = [];

    itemsToBeAdded.forEach( (e, i) => {
        if(e.trim() != "") {
            var stem = stemIt(e);
            var presentIn = hashes[stem] == undefined ? undefined : hashes[stem].map(s => dict[s]);
            if (presentIn != undefined) {
                presentIn.forEach((ei) => {
                    if (window.allOPWords[ei["w"]] == undefined) {
                        window.allOPWords[ei["w"]] = [];
                        window.wordsToBeAdded.push(ei["w"]);
                    }
                    if (!window.allOPWords[ei["w"]].includes(e))
                        window.allOPWords[ei["w"]].push(e);
                })
            }
            var index = i;
            window.bi[e] = {"stem": stem, "presentIn": presentIn, "index": index};
        }
    });
    itemsToBeRemoved.forEach( (e, i) => {
        var allKeys = Object.keys(window.allOPWords);
        allKeys.forEach(k => {
            window.allOPWords[k] = window.allOPWords[k].filter(s => s!=e);
            if(window.allOPWords[k].length == 0) {
                window.wordsToBeRemoved.push(k);
                delete window.allOPWords[k];
            }
        });
        delete window.bi[e];
    });
    window.allOPWordSet = Object.keys(window.allOPWords);
    var totalScore = 0;
    Object.keys(window.bi).forEach(key => {
        if(window.bi[key] !=undefined && window.bi[key]["presentIn"] != undefined)
            totalScore+=window.bi[key]["presentIn"].length;
    });

    window.wordsInSortedForm={};
    var scores = [];
    var dataFinal = [];
    var maxScore=0;
    window.allOPWordSet.forEach( w => {
        var score = getScoreOfWord(w, window.allOPWords[w], window.bi, totalScore);
        maxScore = Math.max(maxScore, score);
        dataFinal.push({"text": w, "size":score, "present": window.allOPWords[w]})
    });
    window.maxScore = maxScore
    drwCld2(dataFinal);
}
function drwCld2(data)  {
    window.data = data;
    console.log("fffff"+data.length);
    console.log(data);
    var dataSize = data.length;
    if( dataSize === 0)
    {
        window.maxScore = 40;
        var arrayOfExample = ["mental science", "male cow", "cut hair occupation", "mosquito diseases", "fewer words retaining sense"];
        var randomNumber = Math.round(arrayOfExample.length*Math.random());
        data = [{"text": "Reverse Dictionary", size: 40},
            {"text": "Use fewer words without loosing sense!", size:16},
            {"text": "Learn new words using this tool!", size:12},
            {"text": "Find Connection between words!", size:12},
            {"text": "Type any word(s) in the textbox, example: '"+arrayOfExample[randomNumber]+"'!", size:30},
            {"text": "Type any words in the textbox!", size:15},
            {"text": "Abridge!", size:12},
            {"text": "Shorten your ideas!", size:12},
            {"text": "Be precise!", size:12},
            {"text": "Enrich your Vocabulary!", size:12},
            {"text": "Use next character suggestion for spelling correction!", size:15},
            {"text": "Search dictionary words with their definitions!", size:35}
        ];
        arrayOfExample.forEach(s =>{
            if(s != arrayOfExample[randomNumber])   {
                data.push({"text":"Type '"+s+"'!", "size":12});
            }
        })
    }
    var maxScore = Math.floor(window.maxScore);
    var w = parseInt(d3.select(".d3js-canvas").style("width"), 10);
    var h = parseInt(d3.select(".d3js-canvas").style("height"), 10);
    var layout = d3.layout.cloud()
        .size([w, h*.9])
        .words(data)
        .padding(0)
        //.rotate(function(d) { return (d.size >= 40 ? 0 : (Math.random()) * 90); })
        .rotate(function(d) { return 0; })
        .font("Impact")
        .fontSize(function(d) { return d.size; })
        .on("end", draw);
    layout.start();

    function draw(words) {
        var maxScore = Math.floor(window.maxScore);
            d3.select(".d3js-canvas").select("svg")
                .attr("width", layout.size()[0])
                .attr("height", layout.size()[1])
                .select("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(words)
                //.join()
                .join("text")
                .transition()
                .duration(1500)
                .ease(d3.easeLinear)
                .style("font-size", function(d) { return d.size + "px"; })
                .style("fill", function(d) { return d.size == maxScore ? "rgb(0,0,255)" :"rgb("+(maxScore-d.size)*255/maxScore+","+(maxScore-d.size)*255/maxScore+","+(maxScore-d.size)*255/maxScore+")"; })
                //.style("fill", "rgb(0,0,255)")
                .style("font-family", "Impact")
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function(d) { return d.text; });
        window.huha = true;
    }
}
function beautifyAsArrayOfArray(arrayOfTexts, maxElementsInColumn, maxCharPerRow)   {
    var result =[];
    var rowOfText = "";
    arrayOfTexts.forEach(text => {
        if(text.length+rowOfText.length<maxCharPerRow)   {
            rowOfText = rowOfText+(rowOfText==""? "" :" ")+text;
        }
        else{
            result.push(rowOfText);
            rowOfText="";
        }
    })
}
function getScoreOfWord(word, listOfInputWordWhereItExists, allInputDetails, ts)    {
    var fullMarks=ts;
    listOfInputWordWhereItExists.forEach(s => ts= ts-allInputDetails[s]["presentIn"].length);
    return ts==0 && Object.keys(allInputDetails).length>1? (fullMarks-ts)*40.1/fullMarks : (fullMarks-ts)*20.1/fullMarks;
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
var stemIt = function ( word ) {
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