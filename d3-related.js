function drawCloud(data, dictionary)    {
    //text, size, link
    window.data = data;
    var dataSize = data.length;
    if( dataSize === 0)
    {
        window.maxScore = 40;
        var arrayOfExample = getArrayOfExamples();
        var randomNumber = Math.round((arrayOfExample.length-1)*Math.random());
        data = getHomePageData(randomNumber);
        arrayOfExample.forEach(s =>{
            if(s != arrayOfExample[randomNumber])   {
                data.push({"text":"Type '"+s+"'!", "size":12});
            }
        });
    }
    var maxScore = Math.floor(window.maxScore);
    var w = parseInt(d3.select(".d3js-canvas").style("width"), 10);
    var h = parseInt(d3.select(".d3js-canvas").style("height"), 10);
    var layout = d3.layout.cloud()
        .size([w, h*.9])
        .words(data)
        .padding(0)
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
            .on("mouseover", overed)
            .on("mouseout", outed)
            .on("click", clickHandle)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .style("font-size", function(d) { return d.size + "px"; })
            .style("fill", function (d) {
                if(d.color != undefined)
                    return d.color;
                else
                    return d.size == maxScore ?
                        "rgb(0,0,255)" :
                        "rgb("+(maxScore-d.size)*255/maxScore+","+(maxScore-d.size)*255/maxScore+","+(maxScore-d.size)*255/maxScore+")";
            })
            .style("font-family", "Impact")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
            })
            .text(function(d) { return d.text; });
    }
}
function getHomePageData(randomNumber)  {
    return [{"text": "Reverse Dictionary", size: 40, color: "blue", link:"NA"},
        {"text": "Use fewer words without loosing sense!", size:16, link:"NA"},
        {"text": "Learn new words using this tool!", size:12, link:"NA"},
        {"text": "Find Connection between words!", size:12, link:"NA"},
        {"text": "Type any word(s) in the textbox, example: '"+getArrayOfExamples()[randomNumber]+"'!", size:30, link:"NA"},
        {"text": "Type any words in the textbox!", size:15, link:"NA"},
        {"text": "Abridge!", size:12, link:"NA"},
        {"text": "Shorten your ideas!", size:12, link:"NA"},
        {"text": "Be precise!", size:12, link:"NA"},
        {"text": "Enrich your Vocabulary!", size:12, link:"NA"},
        {"text": "Use next character suggestion for spelling correction!", size:15, link:"NA"},
        {"text": "Search dictionary words with their definitions!", size:35, link:"NA"},
        {"text": "About the Author!", size:20, color: "green", link:"https://proggrammer.github.io/homepage/"},
    ];
}
//it has ipState Map word -> (stem, index)
// opState words Map word -> defContains[],
function dataToDigest(presentCanvasState){
    var minFontSize = 8;
    var maxFontSize = 40;
    var resultData = [];
    var sumSizeOfHashes = 0;
    var wordWiseScore = {};
    for (var keyIp in presentCanvasState.ipState) {
        var v = window.hashes[presentCanvasState.ipState[keyIp].stem] == undefined? 0: window.hashes[presentCanvasState.ipState[keyIp].stem].length;
        wordWiseScore[keyIp] = v;
        sumSizeOfHashes+=v;
    }
    var sumReverseScore =0;
    var minScore = -1;
    for (var keyIp in wordWiseScore) {
        wordWiseScore[keyIp] = sumSizeOfHashes - wordWiseScore[keyIp];
        if(minScore == -1)
            minScore = wordWiseScore[keyIp];
        minScore = Math.min(minScore, wordWiseScore[keyIp])
        sumReverseScore+= wordWiseScore[keyIp];
    }
    for (var keyOp in presentCanvasState.opState) {
        var sumSizeOfHashesForThisWord = 0;
        presentCanvasState.opState[keyOp].forEach(w => {
            sumSizeOfHashesForThisWord += wordWiseScore[w];
        });
        var score = normalise(minFontSize, maxFontSize, minScore, sumReverseScore, sumSizeOfHashesForThisWord);
        const obj = {"text": keyOp, size: score}
        resultData.push(obj);
    }
    return resultData;
}
function normalise(minFontSize, maxFontSize, minScore, maxScore, score){
    if(minScore == maxScore) return (maxFontSize+maxFontSize)/2;
    return ((maxScore - score)*minFontSize + (score - minScore)*maxFontSize)/(maxScore - minScore);
}
function getArrayOfExamples()   {
    return ["mental science", "male cow", "cut hair occupation", "mosquito diseases", "fewer words retaining sense"];
}
function clickHandle(evet, d)   {
    if(d.text == "About the Author!")
        window.location = d.link;
}
function capitaliseAndRemoveUnderScore(string)   {
    string = string.replace("_"," ");
    return string.charAt(0).toUpperCase() + string.slice(1)
}
function overed(event, d) {

    const bbox = this.getBBox();

    if(d.text == "About the Author!") {
        var aa = d3.select("g")
            .append("rect")
            .attr("width", bbox.width)
            .attr("height", 3)
            .attr("x", d.x - bbox.width / 2)
            .attr("y", d.y)
            .attr("fill", "red");
        //d3.select(this).style("cursor", "pointer");
        d3.select(this).text(d.link).style("font-size", "10px");
    }
    d3.select(this)
        .transition().duration(300).ease(d3.easeLinear)
        .style("fill", "red");
    if(d.link != "NA")
        d3.select(this).style("cursor", "pointer");
    if(window.dictionary == undefined) return;
    var svgWidth = d3.select("svg").style("width").replace("px", "")*.8;
    var svgHeight = d3.select("svg").style("height").replace("px", "");
    var gLeft = d3.select("g").style("transform").split(",")[4];
    var gTop = d3.select("g").style("transform").split(",")[5].replace(")","");
    var margin = svgWidth*.1;
    var textItem = d.text+"\u00A0" + "["+window.dictionary[d.text].g+"]<br>"+window.dictionary[d.text].m+"<br>"+window.dictionary[d.text].u;
    // var textItem = d.text+"\u00A0[Input Connection ("+window.allOPWords[d.text]+")]\u00A0" + window.dictMap[d.text];
    textItem = textItem.replaceAll(", ", ",").replaceAll(",", ", ");
    var textItemAsList = textItem.split("<br>").flatMap(ti => beautiffyLine(capitaliseAndRemoveUnderScore(ti), svgWidth/6.67));
    var textWidth = Math.min(textItem.length*10,svgWidth);

    var minSVG = margin-gLeft;//-
    var maxSVG = minSVG+svgWidth;//+
    var gBB = d3.select("svg");
    var yHighlightInput = 100;
    var inputWords = Object.keys(window.canvasState.ipState);
    var arrSizesOfFontOfWords = [];
    var textItemNode = d3.select("g").append("text")
        .attr("id", "testItem")
        .text("\u00A0");
    var spaceWidth = textItemNode.node().getBBox().width;
    textItemNode.remove();
    inputWords.forEach(w => {
        textItemNode = d3.select("g").append("text")
            .attr("id", "testItem")
            .text(w);
        arrSizesOfFontOfWords.splice(window.canvasState.ipState[w]["index"], 0, textItemNode.node().getBBox().width);
        textItemNode.remove();
    })
    window.delimeters =[];
    var tillSizeNow = 0;
    var totalSize = (arrSizesOfFontOfWords.length-1)*spaceWidth+d3.sum(arrSizesOfFontOfWords);
    arrSizesOfFontOfWords.forEach(v => {
        const valueNow = (tillSizeNow + v / 2) - totalSize/2;
        window.delimeters.push(valueNow);
        tillSizeNow = tillSizeNow + (tillSizeNow == 0 ? 0 : 1) + v + 1;
    });

    d3.select("g").append("text")
        .attr("id", "testItem")
    var avgBetweenPointsX = d3.sum(window.delimeters)/window.delimeters.length;
    //var avgBetweenPointsY =
    var toDrawPathPoints = window.canvasState.opState[d.text].map(word => window.canvasState.ipState[word].index);
    var drawIndexPoints = 0;
    window.delimeters.forEach(valueInside =>{
        if(toDrawPathPoints.includes(drawIndexPoints)) {
            d3.select("g").append('circle')
                .style("stroke", "red")
                .style("stroke-width", 8)
                .attr("r", 2)
                .attr("cx", 0 + valueInside)
                .attr("cy", d3.select("svg").attr("height") - gTop - 3);
            const curve = d3.line().curve(d3.curveNatural);

            const points = [[d.x, d.y], [avgBetweenPointsX, (d3.select("svg").attr("height") - gTop - 3 + d.y) / 2], [0 + valueInside, d3.select("svg").attr("height") - gTop - 3]];
            d3.select("g")
                .append('path')
                .attr('d', curve(points))
                .style("stroke-width", 3)
                .attr('stroke', 'red')
                .attr('fill', 'none');
        }
        drawIndexPoints++;
    });
    var maxWidthEachText = 0;
    var a = d3.select("g")
        .append("rect");
    var allBs = []
    for(var i=0; i<textItemAsList.length; i++) {
        var b = d3.select("g")
            .append("text")
            .attr("class", "meanText")
            .attr("id", "meanText"+i)
            .text(textItemAsList[i])
            .attr("fill", "white")
            .attr("y", (d.y>0) ? 7+(d.y-bbox.height-(10+textItemAsList.length*14)) + 14+i*14 : 7+d.y + 14+i*14)
            .attr("x", minSVG);
        if(i==0)
            b.style("font-size", "18px").attr("fill", "red");
        allBs.push(b);
        maxWidthEachText = Math.max(b.node().getBBox().width, maxWidthEachText);
    }
    var leftSide = d.x - minSVG;
    var rightSide = maxSVG - d.x;
    var minSide = Math.min(leftSide, rightSide);
    if(minSide>=maxWidthEachText/2) {
        finalX = d.x - (maxWidthEachText / 2);
    }
    else if(leftSide < rightSide) {
        finalX = minSVG;
    }
    else {
        finalX = maxSVG - maxWidthEachText;
    }
    if(d.y>0)    {
        a.attr("width", maxWidthEachText+7)
            .attr("height", 14+textItemAsList.length*14)
            .attr("x", finalX)
            .attr("y", d.y-bbox.height-(10+textItemAsList.length*14))
            .attr("fill",  "darkblue");
    }
    else {
        a.attr("width", maxWidthEachText + 7)
            .attr("height", 14 + textItemAsList.length * 14)
            .attr("x", finalX)
            .attr("y", d.y)
            .attr("fill", "darkblue");
    }
    allBs.forEach(el => el.attr("x", finalX));
}
function beautiffyLine(textItem, maxText){
    var result = [];
    var textArr = textItem.split(" ");
    var index = 0;
    result[index] = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"
    textArr.forEach(t => {
        var curLength = result[index].length + t.length;
        if(curLength > maxText)  {
            index++;
            result[index] = "\u00A0"+t;
        }
        else {
            result[index] = (result[index]+" "+t);
        }

    });
    return result;
}
function outed(event, d) {
    d3.select(this)
        .transition().duration(300).ease(d3.easeLinear)
        //.style("font-size", function(d) { return d.size + "px"; })
        .style("fill", function (d) {
            var maxScore = Math.floor(window.maxScore);
            if(d.color != undefined)
                return d.color;
            else
                return d.size == maxScore ?
                    "rgb(0,0,255)" :
                    "rgb("+(maxScore-d.size)*255/maxScore+","+(maxScore-d.size)*255/maxScore+","+(maxScore-d.size)*255/maxScore+")";
        })
    if(d.text == "About the Author!"){
        d3.select(this).text("About the Author!")
            .style("font-size", d.size);
    }
    // d3.selectAll(".textexplanation").remove();
    // d3.selectAll(".rectexplanation").remove(); divExplanation
    d3.selectAll("rect").transition().duration(50).ease(d3.easeLinear).remove();
    d3.selectAll("path").transition().duration(50).ease(d3.easeLinear).remove();
    d3.selectAll("circle").transition().duration(50).ease(d3.easeLinear).remove();
    d3.selectAll(".meanText").transition().duration(50).ease(d3.easeLinear).remove();
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