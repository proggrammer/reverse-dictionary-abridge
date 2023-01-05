function drawOPItems(dict, hashes, dictMap)  {
    window.dictMap = dictMap;
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
                });
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
    var dataSize = data.length;
    if( dataSize === 0)
    {
        window.maxScore = 40;
        var arrayOfExample = ["mental science", "male cow", "cut hair occupation", "mosquito diseases", "fewer words retaining sense"];
        var randomNumber = Math.round((arrayOfExample.length-1)*Math.random());
        data = [{"text": "Reverse Dictionary", size: 40, color: "blue", link:"NA"},
            {"text": "Use fewer words without loosing sense!", size:16, link:"NA"},
            {"text": "Learn new words using this tool!", size:12, link:"NA"},
            {"text": "Find Connection between words!", size:12, link:"NA"},
            {"text": "Type any word(s) in the textbox, example: '"+arrayOfExample[randomNumber]+"'!", size:30, link:"NA"},
            {"text": "Type any words in the textbox!", size:15, link:"NA"},
            {"text": "Abridge!", size:12, link:"NA"},
            {"text": "Shorten your ideas!", size:12, link:"NA"},
            {"text": "Be precise!", size:12, link:"NA"},
            {"text": "Enrich your Vocabulary!", size:12, link:"NA"},
            {"text": "Use next character suggestion for spelling correction!", size:15, link:"NA"},
            {"text": "Search dictionary words with their definitions!", size:35, link:"NA"},
            {"text": "About the Author!", size:20, color: "green", link:"https://proggrammer.github.io/homepage/"},
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
        window.huha = true;
    }
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
    if(window.dictMap == undefined) return;
    var svgWidth = d3.select("svg").style("width").replace("px", "")*.8;
    var svgHeight = d3.select("svg").style("height").replace("px", "");
    var gLeft = d3.select("g").style("transform").split(",")[4];
    var gTop = d3.select("g").style("transform").split(",")[5].replace(")","");
    var margin = svgWidth*.1;
    var textItem = d.text+"\u00A0" + window.dictMap[d.text];
    // var textItem = d.text+"\u00A0[Input Connection ("+window.allOPWords[d.text]+")]\u00A0" + window.dictMap[d.text];
    textItem = textItem.replaceAll(", ", ",").replaceAll(",", ", ");
    var textItemAsList = textItem.split("<br>").flatMap(ti => beautiffyLine(capitaliseAndRemoveUnderScore(ti), svgWidth/6.67));
    var textWidth = Math.min(textItem.length*10,svgWidth);

    var minSVG = margin-gLeft;//-
    var maxSVG = minSVG+svgWidth;//+
    var gBB = d3.select("svg");
    var yHighlightInput = 100;
    var inputWords = Object.keys(window.bi);
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
            arrSizesOfFontOfWords.splice(window.bi[w]["index"], 0, textItemNode.node().getBBox().width);
        textItemNode.remove();
        })
    console.log(d3.select("svg").node().getBBox());
    console.log(d.y);
    console.log(d3.select("g").style("transform"));
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
    var toDrawPathPoints = window.allOPWords[d.text].map(word => window.bi[word].index);
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