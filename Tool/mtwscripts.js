//////////////////////////////////////////////////////////////////////////////
//
//             mtwscripts.js - MLP Topology Workbench
//  Copyright (c) 2016 Caio Benatti Moretti <caiodba@gmail.com>
//                    http://www.moretticb.com/
//
//  Last update: 13 April 2017
//
//  This is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This software is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program. If not, see <http://www.gnu.org/licenses/>.
//
//////////////////////////////////////////////////////////////////////////////


var selTab = "topoTab";
var topology;
var activations = [];
var visualOptions = {
	aspectRatio: 0.5,
	pointSize: 10,
	lowResCanvas: 25,
	highResCanvas: 50,
	cDivSize: 300,
	isLowRes: true,
	currentLayer: 1,
	currentNeuron: 1,
	currentThumbLayer: 1,
	currentThumbNeuron: 1,
	captureState: false,
	pointRadius: 4,
	showPoints: true
};

window.onload = function(){
	var randomSizes = [];
	var randomLen = 3+Math.round(Math.random());
	for(var i=0;i<randomLen;i++)
		randomSizes.push(Math.round(Math.random()*6)+1);
	topology = randomSizes;
	
	updateVisualizationInterface();
	
	window.onresize();
	if(window.location.hash.length==0)
		newTopology();
	else
		window.onhashchange();
}

window.onkeydown = function(e){
	if(document.activeElement.tagName == "TEXTAREA" || document.activeElement.tagName == "INPUT")
		return;
	if(window.lastKey == 16){ //shift
		if(e.keyCode == 49)//1
			changeTab(document.getElementById("topoTab"));
		else if(e.keyCode == 50)//2
			changeTab(document.getElementById("cmdTab"));
		else if(e.keyCode == 51 && canTrain())//3
			changeTab(document.getElementById("trainTab"));
		else if(e.keyCode == 52 && canVisualize())//4
			changeTab(document.getElementById("visualizeTab"));
		else if(e.keyCode == 86 && canVisualize())//V
			captureNeuron();
	}
	window.lastKey = e.keyCode;

	if(e.keyCode==27){ //esc
		hideEmbedPrompt();
		disableCaptureState();
	}
}

window.onresize = function(){
	var vp = document.getElementById('viewport');
	var topo = document.getElementById('topoContent');
	topo.style.width = vp.offsetWidth+"px";
	topo.style.height = (vp.offsetWidth/2)+"px";
	
	document.getElementById('trainContent').style.height =
	document.getElementById('cmdContent').style.height = (vp.offsetWidth/2)+"px";
	
	if(window.frameElement){
		window.frameElement.style.height = (topo.offsetHeight+40+document.getElementById('panel').offsetHeight)+"px";
	}
	fixSaveStateArea();
	fixTrainTab();
	fixVisualizeTab();
}

function fixSaveStateArea(){
	var ssArea = document.getElementById("saveStateArea");
	ssArea.style.height = "10px";
	ssArea.style.height = (document.getElementById("cmdContent").offsetHeight-ssArea.offsetTop)+"px";
}

function fixTrainTab(){
	var contArea = document.getElementById("trainContent");
	var pane = document.getElementById("netAreaPane");
	var barDiv = document.getElementById("barDiv");
	var barPieces = [document.getElementById("mseTop"),document.getElementById("mseMid"),document.getElementById("mseBot")];
	var captionHeight = Math.max(document.getElementById("netAreaCaption").offsetHeight,document.getElementById("datasetCaption").offsetHeight);
	
	var toggleDataBtn = document.getElementById("dataToggle");
	if(toggleDataBtn.className == "netToggle")
		toggleData(toggleDataBtn);
	
	document.getElementById("datasetArea").style.height = pane.style.height = (contArea.offsetHeight-captionHeight)+"px";
	
	document.getElementById("datasetData").style.height = "90%";
	document.getElementById("mseBar").style.height = contArea.offsetHeight+"px";
	barDiv.style.height = (319*contArea.offsetHeight/354)+"px";
	barDiv.style.backgroundSize = (19*contArea.offsetHeight/354)+"px";
	
	for(var i=0;i<barPieces.length;i++){
		barPieces[i].style.width = barPieces[i].style.backgroundSize = (40*contArea.offsetHeight/354)+"px";
		barPieces[i].style.height = ((i==1?293:13)*contArea.offsetHeight/354)+"px";
	}
	setMseBar(1);
	
	var ttL = document.getElementById("trainTooltipL");
	var ttM = document.getElementById("trainTooltipM");
	var ttR = document.getElementById("trainTooltipR");
	var maxTDims = [168*contArea.offsetHeight/354,84*contArea.offsetWidth/700]; //168, 84 com largura 700	
	var tsCanvas = document.getElementById("tSpaceCanvas");
	var tpCanvas = document.getElementById("tPointCanvas");
	var tcDiv = document.getElementById("tCanvasDiv");
	var tDims, tcDims;
	
	if(visualOptions.aspectRatio >= 0.5){ //altura maior
		tDims = [1/visualOptions.aspectRatio*maxTDims[1], maxTDims[1]];
		tcDims = [1/visualOptions.aspectRatio*visualOptions.lowResCanvas, visualOptions.lowResCanvas];
	} else { //largura maior
		tDims = [maxTDims[0], visualOptions.aspectRatio*maxTDims[0]];
		tcDims = [visualOptions.lowResCanvas, visualOptions.aspectRatio*visualOptions.lowResCanvas];
	}
	
	tsCanvas.style.width = tpCanvas.style.width = tDims[0]+"px";
	tsCanvas.style.height = tpCanvas.style.height = tDims[1]+"px";
	
	tpCanvas.width = tDims[0];
	tpCanvas.height = tDims[1];
	tsCanvas.width = tcDims[0];
	tsCanvas.height = tcDims[1];
	
	tcDiv.style.width = tDims[0]+"px";
	tcDiv.style.height = tDims[1]+"px";
	
	ttL.style.height = ttM.style.height = ttR.style.height = (100*contArea.offsetWidth/700)+"px";
	ttL.style.width = (19*contArea.offsetWidth/700)+"px";
	tcDiv.style.marginTop = ttR.style.width = (8*contArea.offsetWidth/700)+"px";
	ttL.style.backgroundSize = ttM.style.backgroundSize = ttR.style.backgroundSize = "auto "+(300*contArea.offsetWidth/700)+"px";
}

function fixVisualizeTab(){
	var visualizeCont = document.getElementById("visualizeContent");
	
	var maxDims = [600*visualizeCont.offsetHeight/354,300*visualizeCont.offsetWidth/700]; //600, 300 com largura 700
	
	var sCanvas = document.getElementById("spaceCanvas");
	var pCanvas = document.getElementById("pointCanvas");
	
	var cRes = visualOptions.isLowRes ? visualOptions.lowResCanvas : visualOptions.highResCanvas;
	var dims, cDims;
	
	visualizeCont.style.height = (354*visualizeCont.offsetWidth/700)+"px";
	
	if(visualOptions.aspectRatio >= 0.5){ //altura maior
		dims = [1/visualOptions.aspectRatio*maxDims[1], maxDims[1]];
		cDims = [1/visualOptions.aspectRatio*cRes, cRes];
	} else { //largura maior
		dims = [maxDims[0], visualOptions.aspectRatio*maxDims[0]];
		cDims = [cRes, visualOptions.aspectRatio*cRes];
	}
	
	sCanvas.style.width = pCanvas.style.width = dims[0]+"px";
	sCanvas.style.height = pCanvas.style.height = dims[1]+"px";
	
	sCanvas.style.marginLeft = pCanvas.style.marginLeft = (-visualizeCont.offsetWidth/2-dims[0]/2)+"px";
	
	pCanvas.width = dims[0];
	pCanvas.height = dims[1];
	sCanvas.width = cDims[0];
	sCanvas.height = cDims[1];
}

window.onhashchange = function(){
	if(window.trainConf)
		if(!trainConf.idle)
			return;
	var params = window.location.hash.substr(1).split(',');
	topology = [];

	window.activations = [];
	try{
		if(params.length<=1)
			throw "invalid parameters";
		var size;
		for(var i=0;i<params.length && params[i]!="-1";i++){
			size = parseInt(params[i]);
			if(!isNaN(size))
				topology.push(size);
			else if(params[i].charAt(0)=='l'){
				activations.push(false);
			}else if(params[i].charAt(0)=='s'){
				activations.push(true);
			}else if(params[i].charAt(0)=='e'){
				var epsilon = parseFloat(params[i].substr(1));
				epsilon = isNaN(epsilon)?0.01:epsilon;
				document.getElementById("epsilonTxt").value = epsilon;
			} else if(params[i].charAt(0)=='r'){
				var rate = parseFloat(params[i].substr(1));
				rate = isNaN(rate)?0.1:rate;
				document.getElementById("etaNum").value = rate;
			} else if(params[i].charAt(0)=='w'){
				var weights = params[i].substr(1).split("|").join("\n");
				document.getElementById("saveStateArea").value = weights;
			} else {
				throw "invalid parameters";
			}
		}

		if(activations.length != topology.length-1)
			activations = [];
		else if(window.trainConf)
			trainConf.topo.activations = undefined;

		newTopology();
		
	} catch(e) {
		console.log(e.stack);
		window.location.hash="";
		window.onload();
	}

}

function embedPrompt(embedIcon){
	var ett = document.getElementById("shareTooltip");
	var txtArea = ett.getElementsByTagName("textarea")[0];
	txtArea.value = '<iframe width="600" height="560" src="http://www.moretticb.com/MTW/embed.html'+generateHash()+'" style="max-width: 600px; width: 100%; height: 568px;" frameborder="0"></iframe>';
	ett.style.display = "inline-block";
	ett.style.left = (embedIcon.offsetLeft + embedIcon.offsetWidth/2 - ett.offsetWidth/2)+"px";
	ett.style.top = (embedIcon.offsetHeight + embedIcon.offsetTop)+"px";
	
	txtArea.select();
}

function hideEmbedPrompt(){
	document.getElementById("shareTooltip").style.display = "none";
}

function generateHash(){
	var hash="#";
	hash += trainConf.topo.inputs+","+trainConf.topo.hiddenSizes.toString()+","+trainConf.topo.outputs;
	hash += ",";
	for(var i=0;i<trainConf.topo.activations.length;i++)
		hash += trainConf.topo.activations[i]?"s,":"l,";
	hash += "e"+trainConf.epsilon;
	hash += ",";
	hash += "r"+trainConf.eta;
	//hash += ",";
	//hash += "m"+trainConf.momentum;
	
	if(document.getElementById("weights").checked && canTrain())
		hash += ",w"+getWeightString(5).split("\n").join("|");
	
	return hash;
}

function drawNetwork(sizes){
	var html="";
	for(var i=0;i<sizes.length && i<4;i++)
		sizes[i] = sizes[i]==0?1:sizes[i];
	
	for(var i=0;i<sizes.length && i<4;i++){
		html += '<div class="'+(i==0?'i':'n')+'layer'+(sizes[i]<=3?sizes[i]:4)+'">';
		for(var j=1;j<=sizes[i];j++){
			j = j<3?j:sizes[i]>3?sizes[i]:3;
			html += '<div class="'+(i==0?'x':'n')+(j>3?4:j)+'">'+(i==0?'x<sub>'+j+'</sub>':j)+'</div>';
		}
		html += "</div>";
		
		if(i<sizes.length-1 && i<3)
			html += '<div class="w'+(sizes[i]>3?4:sizes[i])+(sizes[i+1]>3?4:sizes[i+1])+'"><div class="bias">&minus; &theta;</div></div>';
		else
			html += '<div class="arrow'+(sizes[i]>3?4:sizes[i])+'"></div>';
	}
	
	return html;
}

var tabAndTools = {
	topoTab: "topologyTools",
	cmdTab: "topologyTools",
	trainTab: "trainTools",
	visualizeTab: "trainTools"
};
function changeTab(domTab){
	disableCaptureState();
	
	if(domTab.id == "visualizeTab" && !isValidDataset(trainConf.dataset, trainConf.topo)){
		alert("Dataset is not valid, or not matching the topology IO");
		return;
	}
	
	if(domTab.id==selTab)
		return
	if(tabAndTools[selTab] != tabAndTools[domTab.id]){
		document.getElementById(tabAndTools[selTab]).style.display = "none";
		document.getElementById(tabAndTools[domTab.id]).style.display = "block";
	}
	if(tabAndTools[domTab.id]=="trainTools"){
		if(domTab.id=="trainTab"){
			document.getElementById("layerAdjustTraining").style.display = "inline-block";
			document.getElementById("layerAdjustVisualize").style.display = "none";
		} else {
			document.getElementById("layerAdjustTraining").style.display = "none";
			document.getElementById("layerAdjustVisualize").style.display = "inline-block";
		}
	}
	document.getElementById(selTab).className = 'tabIdle';
	document.getElementById(selTab.split("Tab").join("Content")).style.display = "none";

	domTab.className = 'tabSel';
	document.getElementById(domTab.id.split("Tab").join("Content")).style.display = "inline-block";
	if(domTab.id.indexOf('cmd')>-1){
		domTab.style.backgroundColor = "#000";
		domTab.style.color = "#FFF";
		fixSaveStateArea();
	}
	fixTrainTab();
	fixVisualizeTab();
	
	selTab=domTab.id;
	
	if(domTab.id=="visualizeTab" && trainConf.idle)
		refreshPlot();
}

function isNum(num){
	for(var i=0;i<num.length;i++)
		if("0123456789".indexOf(num.charAt(i))<0)
			return false;
	return num != "" ? true : false;
}

function upDownLayer(btn){
	if(trainConf && !trainConf.idle)
		return false;
	var lid = btn.id.substr(-1);
	var txtField = document.getElementById('len'+lid);
	if(isNum(txtField.value))
		txtField.value = parseInt(txtField.value)+(btn.id.indexOf('up')>-1?1:-1);
	else
		txtField.value = 1;
	
	adjustLayerUI(lid);
	topology[lid] = txtField.value;
	newTopology();
}

function lenKeyDown(evt){
	if(window.trainConf && !window.trainConf.idle)
		return false;
	var lid = evt.target.id.substr(-1);
	if(evt.key.toLowerCase()=='enter'){
		if(trainConf && !trainConf.idle)
			return false;
		adjustLayerUI(lid);
		//evt.target.blur();
		topology[lid]=evt.target.value;
		newTopology();
	}
	return isNum(evt.key) || evt.key.toLowerCase()=='backspace' || evt.key.toLowerCase()=='delete' || evt.key.toLowerCase()=='enter';
}

function adjustLayerUI(lid){
	var txtField = document.getElementById("len"+lid);
	if(txtField.value <= 1){
		txtField.value = 1;
		document.getElementById('down'+lid).style.visibility = "hidden";
	} else
		document.getElementById('down'+lid).style.visibility = "visible";
}

function drawInterface(){
	var html = '';
	for (var i=0;i<topology.length;i++){
		html += '<div class="layerAdjust" '+(i==0?'style="width: 16%; margin-left: 1%"':'')+'>';
		html += '<div class="left'+(i==0?'Normal':'Hole')+'">'+(i>0&&topology.length>2?'<div class="removeBtn" title="Remove layer" onclick="removeLayer('+i+');"></div>':'')+'</div>';
		html += '<div class="layerAdjustMiddle">';
		
		if(i==0) html += 'inputs';
		else if(i==topology.length-1) html += 'output layer';
		else if(i==1) html += '1<sup>st</sup> hidden layer';
		else if(i==2) html += '2<sup>nd</sup> hidden layer';
		
		html += drawCounter(i);
		
		html += '</div><div class="middle"></div><div class="right'+(i<3?'Hole':'Normal')+'">';
		
		html += i>0?'<div class="'+(trainConf.topo.activations[i-1]?"activation":"linear")+'Btn" id="activ_'+i+'" title="Activation function ('+(trainConf.topo.activations[i-1]?"sigmoid":"linear")+')" onclick="changeActivation(this)"></div>':'';
		
		html += '</div></div>';
		
		var addSwap=i<topology.length-2?'swap':i==topology.length-1?'plus':'swap';
		if(i<3)
			html += '<div class="swapBtnContainer"><div class="'+addSwap+'Btn" title="'+(addSwap=='swap'?'Swap layers':'Add layer')+'" onclick="'+(addSwap=='plus'?'addLayer();':'swapLayers('+i+');')+'"></div></div>';
	}
	
	document.getElementById('layerAdjustContainer').innerHTML = html;
	for (var i=0;i<topology.length;i++)
		adjustLayerUI(i);
}

function drawCounter(lid){
	var html = '<div class="counter"'+(lid==0?' style="padding-top: 25px;"':'')+'>';
	html += '<div class="up" id="up'+lid+'" onmousedown="this.className=\'upDown\';" onmouseup="this.className=\'up\';" onclick="upDownLayer(this);"></div>';
	html += '<div class="len"><input type="text" value="'+topology[lid]+'" id="len'+lid+'" onkeydown="return lenKeyDown(event);" /></div>';
	html += '<div class="down" id="down'+lid+'" onmousedown="this.className=\'downDown\';" onmouseup="this.className=\'down\';" onclick="upDownLayer(this);"></div></div>';
	return html;
}

function newTopology(){
	updateTrainConf();
	disableCaptureState();
	
	document.getElementById("topoContent").innerHTML = drawNetwork(topology);
	drawInterface();
	drawCommands();
	
	hideUpdate();
	setMseBar(1);
	document.getElementById("epochNum").value = "0";
	document.getElementById("mseNum").value = "0.0";
	var ssa = document.getElementById("saveStateArea");
	if(ssa.value.length > 0){
		loadState();
		ssa.value = "";
	}
	
	
	checkToLoad();
	updateNextInstanceBtn();
	drawNetStructure({id: (netLen(trainConf.topo)+5)+"_1"});
	
	visualOptions.currentLayer = netLen(trainConf.topo);
	visualOptions.currentNeuron = 1;
	updatePlotCaption();
	
	controlTrainingTab(canTrain());
	controlVisualizeTab(canVisualize() && canTrain());
	
	disableCaptureState();
	ggeimsonod();
}

function addLayer(){
	if(trainConf && !trainConf.idle)
		return false;
	
	topology.push(1);
	trainConf.topo.activations.push(true);
	newTopology();
}

function removeLayer(lid){
	if(trainConf && !trainConf.idle)
		return false;
	if(topology.length<=2)
		return;
	topology.splice(lid,1);
	trainConf.topo.activations.splice(lid-1,1);
	newTopology();
}

function swapLayers(lid){
	if(trainConf && !trainConf.idle)
		return false;
	var temp = topology[lid];
	topology[lid]=topology[lid+1];
	topology[lid+1]=temp;
	if(lid>0){
		temp = trainConf.topo.activations[lid-1];
		trainConf.topo.activations[lid-1] = trainConf.topo.activations[lid];
		trainConf.topo.activations[lid] = temp;
	}
	newTopology();
}

function changeActivation(domBtn){
	if(!trainConf.idle)
		return;
	var l = parseInt(domBtn.id.split("_")[1]);
	trainConf.topo.activations[l-1] = !trainConf.topo.activations[l-1];
	drawInterface();
}

function generateCommands(){
	var coreCmd = "./mlp -i "+topology[0]+" -o "+topology[topology.length-1]+" -l "+(topology.length-1);
	//cat inputFile | ./mlp -i INPUTS -o OUTPUTS -l LAYERS n1 n2 n3 [-[e | E | W]]
	//                ./mlp -i INPUTS -o OUTPUTS -l LAYERS n1 n2 nLAYERS -w
	
	for(var i=1;i<topology.length;i++)
		coreCmd += ' '+topology[i];
	
	var cmds = [coreCmd,coreCmd];
	var params = [document.getElementById('epochs').checked,document.getElementById('mse').checked,!document.getElementById('weights').checked]
	cmds[0] = 'cat inputFile | '+cmds[0]+(params[0]||params[1]||params[2]?' -':'')+(params[0]?'e':'')+(params[1]?'E':'')+(params[2]?'W':'');
	cmds[1] = cmds[1]+' -w';
	return cmds;
}

function drawCommands(){
	var cmds = generateCommands();
	document.getElementById('cmdTrain').innerHTML = cmds[0];
	document.getElementById('cmdTest').innerHTML = cmds[1];
}

/* scripts related to training tab */

function ordinal(num){
	return num>3?"th":(["st","nd","rd"])[num-1];
}

function saveLastInput(){
	var input = [];
	var i=1;
	var domObj = document.getElementById("i"+i);
	do{
		if(!domObj)
			return [];
		else if(domObj.value == null || domObj.value.length == 0 || isNaN(domObj.value))
			return [];
		input.push(domObj.value);
		domObj = document.getElementById("i"+(++i));
	} while(domObj);
	return input;
}

function visualWeightFocusBlur(e, domObj){
	if(!trainConf.idle)
		return false;
	var capCap = document.getElementById("captionCaption");
	if(e.type=="focus"){
		capCap.style.display="block";
	} else {
		var conn = domObj.id.split("_"); //nothing, current layer, neuron behind, actual neuron
		
		capCap.style.display="none";
		domObj.value = (conn[1]==netLen(trainConf.topo)-1?trainConf.topo.weights.output:trainConf.topo.weights.hidden[conn[1]])[conn[2]][conn[3]-1];
	}
	return true;
}

function updateVisualWeightEvt(e, domObj){
	if(trainConf.idle && e.keyCode == 13){
		var conn = domObj.id.split("_"); //nothing, current layer, neuron behind, actual neuron
		var newValue = parseInt(domObj.value);
		if(!isNaN(newValue)){
			(conn[1]==netLen(trainConf.topo)-1?trainConf.topo.weights.output:trainConf.topo.weights.hidden[conn[1]])[conn[2]][conn[3]-1] = parseFloat(domObj.value);
			feedVisual();
			refreshPlot();
		}
		domObj.blur();
	}
}

function drawNetStructure(domObj){
	if(visualOptions.captureState){
		visualizeNeuron(domObj.id);
		return;
	}
		
	window.trainConf.selectedNodeId = domObj.id;
	var idData = domObj.id.split("_");
	var layer = idData[0];
	var neuron = idData[1];
	var topo = window.trainConf.topo;
	var netArea = document.getElementById("netArea");
	var markup = "";
	var nlen = netLen(topo);
	
	var lastInput = saveLastInput();

	var caption = "Click on any <b>node</b> to see its weights";
	if(layer<=nlen){
		caption = "<b>"+neuron+"<sup>"+ordinal(neuron)+"</sup> node</b> (";
		if(layer==nlen)
			caption += "output ";
		else
			caption += layer+"<sup>"+ordinal(layer)+"</sup> hidden ";
		caption += "layer) and <b>";
		if(layer==1)
			caption += "input";
		else
			caption += (layer-1)+"<sup>"+ordinal(layer-1)+"</sup> hidden";
		caption += " layer</b>";
	} else {
		netArea.style.minWidth = "432px";
	}
	
	caption += '<div class="subCaption" style="display: none;" id="captionCaption"><sup>press <b>return</b> to update this weight</sup></div>';
	caption += '<div class="subCaption" id="subCaption"></div>';
	
	document.getElementById("netAreaCaption").innerHTML = caption;
	
	markup += '<div class="ioCont"><div class="dummyNode"></div>';
	for(var i=1;i<=topo.inputs;i++)
		markup += '<input type="text" class="in" id="i'+i+'" value="'+(topo.inputs==lastInput.length?lastInput[i-1]:'')+'" onkeyup="feedVisual()" />';
	markup += '</div>';

	var awayLayerMargin = layer>1?' style="margin: 0px 8px 0px 0px;"':'';
	markup += '<div class="layerCont"'+awayLayerMargin+'><div class="biasNode">-&theta;&nbsp;</div>';
	for(var i=1;i<=topo.inputs;i++)
		markup += '<div class="biasNode">x<sub>'+i+'</sub></div>';
	markup += '</div>';


	for(var L=1;L<=netLen(topo);L++){
		var isOutput = L == netLen(topo);

		if(L == layer){
			var prevLayerSize = L==1?topo.inputs:topo.hiddenSizes[L-2];

			markup += '<div class="cCont">';
			for(var i=0;i<=prevLayerSize;i++)
				markup += '<div class="cOn"></div>';

			markup += '</div><div class="weightCont">';

			for(var i=0;i<=prevLayerSize;i++)
				markup += '<input id="_'+(L-1)+'_'+i+'_'+neuron+'" type="text" value="'+(isOutput?topo.weights.output:topo.weights.hidden[L-1])[i][neuron-1]+'" onfocus="return visualWeightFocusBlur(event, this)" onblur="return visualWeightFocusBlur(event, this)" onkeyup="updateVisualWeightEvt(event, this)" />';

			markup += '</div><div class="cCont">';
		
			for(var i=0;i<=prevLayerSize;i++)
				markup += '<div class="cOn"></div>';
			
			var barHeight = 45*Math.max(prevLayerSize, neuron-(isOutput?1:0));
			markup += '</div><div class="barCont" style="height: '+barHeight+'px"></div>';

			markup += '<div class="cCont">'+(!isOutput?'<div class="cOff"></div>':'');

			for(var j=1;j<=(isOutput?topo.outputs:topo.hiddenSizes[L-1]);j++)
				markup += '<div class="c'+(j==neuron?"On":"Off")+'"></div>';
			
			markup += '</div><div class="layerCont">';

			for(var j=isOutput?1:0;j<=(isOutput?topo.outputs:topo.hiddenSizes[L-1]);j++){
				if(j==0)
					markup += '<div class="biasNode">-&theta;&nbsp;</div>';
				else
					markup += '<div class="neuronNode" id="'+(neuron==j?nlen+10+L:L)+'_'+j+'" onclick="drawNetStructure(this);" onmouseover="placeTooltipAt(this);" onmouseout="hideTooltip()">'+j+'</div>';
			}

			markup += '</div>';

		} else {
			var awayLayerMargin = Math.abs(L - layer) >= 1 && layer != L+1?' style="margin: 0px '+(isOutput || L+1 == nlen?0:8)+'px 0px '+(L==1 || (L+1==nlen && layer>nlen )?0:8)+'px;"':'';
			markup += '<div class="layerCont"'+awayLayerMargin+'>';

			for(var j=isOutput?1:0;j<=(isOutput?topo.outputs:topo.hiddenSizes[L-1]);j++)
				if(j==0)
					markup += '<div class="biasNode">-&theta;&nbsp;</div>';
				else
					markup += '<div class="neuronNode" id="'+L+'_'+j+'" onclick="drawNetStructure(this);" onmouseover="placeTooltipAt(this);" onmouseout="hideTooltip()">'+j+'</div>';
			markup += '</div>';
		}

	}


	markup += '<div class="ioCont">';
	for(var i=1;i<=topo.outputs;i++)
		markup += '<input type="text" class="out" id="o'+i+'" disabled="true" />';
	markup += '</div>';

	netArea.innerHTML = markup;
	if(lastInput.length==topo.inputs){
		var feed = feedVisual();
		if(layer <= nlen)
			displayActivation(feed, layer, neuron, nlen);
	}
}

function hideActivation(){
	document.getElementById("subCaption").innerHTML = '';
}

function displayActivation(feed, layer, neuron, nlen){
	if(layer < 0)
		return;
	document.getElementById("subCaption").innerHTML = '<sup>activation = '+(layer==nlen?feed.o_p[neuron-1]:feed.i_p[layer-1][neuron-1])+'</sup>';
}

function toggleData(domObj){
	disableCaptureState();
	var toggleToData = domObj.className.indexOf("data")>-1;
	domObj.className = toggleToData?"netToggle":"dataToggle";

	var datasetArea = document.getElementById("datasetArea");
	var datasetCaption = document.getElementById('datasetCaption');
	var netAreaPane = document.getElementById("netAreaPane");
	var netAreaCaption = document.getElementById('netAreaCaption');

	if(toggleToData){
		datasetCaption.style.display = datasetArea.style.display = "inline-block";
		netAreaCaption.style.display = netAreaPane.style.display = "none";
		domObj.title = "Structure";
	} else {
		datasetCaption.style.display = datasetArea.style.display = "none";
		netAreaCaption.style.display = netAreaPane.style.display = "inline-block";
		domObj.title = "Dataset";
	}
		
}

function updateTrainConfParams(){
	trainConf.eta = parseFloat(document.getElementById("etaNum").value);
	trainConf.epsilon = parseFloat(document.getElementById("epsilonTxt").value);
	trainConf.dataset = readDataset(document.getElementById("datasetData").value);
	
	if(trainConf.idle)
		enableButton("iterateBtn");

	hideUpdate();

	updateNextInstanceBtn();
}

function updateNextInstanceBtn(){
	var total = hasTempDataset()?trainConf.tempDataset.length:trainConf.dataset.length;
	//updating next instance button, related to the dataset
	document.getElementById("nextInstanceText").innerHTML = "next instance <sub>"+(trainConf.tempDatasetOffset+1)+"/"+total+"</sub>";
}

function ggeimsonod(){
	//evu dnuof na ggeretsae
	document.getElementById("leftLogo").style.backgroundPosition=topology.join("")==1935&&!trainConf.topo.activations[0]&&trainConf.topo.activations[1]&&trainConf.topo.activations[2]?"left bottom":"left top";
}

function updateChk(domObj){
	var checked = domObj.className.indexOf("_")==-1;
	var checkbox = document.getElementById(domObj.id.split("Lbl")[0]);
	checkbox.checked = !checked;

	if(checked)
		domObj.className = domObj.className+"_";
	else
		domObj.className = domObj.className.substring(0,domObj.className.indexOf("_"));
}

function asDOM(el){
	if(typeof(el)=="string")
		el = document.getElementById(el);
	return el;
}

function isBtnDisabled(button){
	button = asDOM(button);
	return button.className.indexOf("_")>-1
}

function disableButton(button){
	button = asDOM(button);
	button.className = "button_";
}

function enableButton(button){
	button = asDOM(button);
	button.className = "button";
}

function updateVisual(){	
	if(trainConf.tempDatasetOffset==0){
		document.getElementById("mseNum").value = trainConf.topo.mse;
		document.getElementById("epochNum").value = trainConf.topo.epoch;
		
		var diff = trainConf.topo.mse-trainConf.epsilon;
		if(!trainConf.initError || trainConf.initError < diff)
			trainConf.initError = diff;
		setMseBar(diff/trainConf.initError);
	}

	updateNextInstanceBtn();
	var feed = feedVisual();
	var inputs = document.getElementById("netArea").getElementsByTagName("input");
	for(var i=trainConf.topo.inputs;i<inputs.length-trainConf.topo.outputs;i++){
		if(inputs[i].id.charAt(0)=='_'){
			var values = inputs[i].id.substr(1).split("_");
			var weightMatrix = parseInt(values[0])>=trainConf.topo.weights.hidden.length?trainConf.topo.weights.output:trainConf.topo.weights.hidden[parseInt(values[0])];

			var vBef = parseFloat(inputs[i].value);
			inputs[i].value = weightMatrix[parseInt(values[1])][parseInt(values[2]-1)];
			var vAft = parseFloat(inputs[i].value);

			inputs[i].style.borderLeft = "2px solid "+(vAft < vBef?"#AA2222":"#22AA22");
		}
	}
	
	if(feed){
		var nodeData = trainConf.selectedNodeId.split("_");
		var nlen = netLen(trainConf.topo);
		if(nodeData[0] <= nlen)
			displayActivation(feed, nodeData[0], nodeData[1], nlen);
	} else {
		hideActivation();
	}
	
	if(trainConf.idle || trainConf.topo.epoch%10 == 0)
		window.requestAnimationFrame(refreshPlot);
}

function feedVisual(){
	var input = [];
	for(var i=1;i<=trainConf.topo.inputs;i++){
		var inField = document.getElementById("i"+i);
		if(i==1 && inField.value.indexOf(",")>0){
			distributeInputs();
		}
		input.push(parseFloat(inField.value));
		if(isNaN(input[i-1])){
			for(var j=1;j<=trainConf.topo.outputs;j++){
				var outField = document.getElementById("o"+j);
				outField.value = "";
				outField.style.borderLeftColor = "#CCCCCC";
				
			}
			return false
		}
	}
	var feed = forward(trainConf.topo, input);
	var out = feed.o_p;
	for(var k=0;k<out.length;k++){
		var outField = document.getElementById("o"+(k+1));
		outField.value = out[k];
		if(Math.round(out[k]))
			outField.style.borderLeftColor = "#0092EB";
		else
			outField.style.borderLeftColor = "#CCCCCC";
	}
	
	var nodeLoc = nodeIdToLocation(trainConf.selectedNodeId);
	displayActivation(feed, nodeLoc[0], nodeLoc[1], netLen(trainConf.topo));
	return feed;
}

function distributeInputs(){
	var inputs = document.getElementById("i1").value.split(",");
	for(var i=1;i<=trainConf.topo.inputs;i++){
		document.getElementById("i"+i).value = inputs[i-1];
	}
}

function isArrowKey(){
	return window.event.keyCode >= 37 && window.event.keyCode <= 40;
}

function isChangeKey(keycode){
        return (keycode > 47 && keycode < 58)   || // number keys
        keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
        (keycode > 64 && keycode < 91)   || // letter keys
        (keycode > 95 && keycode < 112)  || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223) ||   // [\]' (in order)
	(keycode==8 || keycode==46); //backspace
}

function notifyUpdate(){
	var updateBtn = document.getElementById("updateParBtn");
	if(!trainConf.idle || isBtnDisabled(updateBtn))
		return false;
	if(window.event)
		if(!isChangeKey(window.event.keyCode))
			return false;
	document.getElementById("updMark").style.display = "inline-block";
	document.getElementById("updateParBtn").title = "There are changes to update";
	return true;
}

function hideUpdate(){
	document.getElementById("updMark").style.display = "none";
	document.getElementById("updateParBtn").title = "";
}

function notifyPlotUpdate(){
	if(window.event)
		if(!isChangeKey(window.event.keyCode) && window.event.type == "keydown")
			return false;
	
	document.getElementById("plotMark").style.display = "inline-block";
	document.getElementById("plotBtn").title = "Refresh plot";
	return true;
}

function hidePlotUpdate(){
	document.getElementById("plotMark").style.display = "none";
	document.getElementById("plotBtn").title = "";
}

function setMseBar(perc){
	var contArea = document.getElementById("trainContent");
	var fullBarSize = 293*contArea.offsetHeight/354; //293 is full for 354-height tabArea

	perc = perc>1?1:perc<0?0:perc;
	document.getElementById("mseTop").style.marginTop = ((1-perc)*fullBarSize)+"px";
	document.getElementById("mseMid").style.height = (perc*fullBarSize)+"px";
}

function randomState(){
	newTopology();
}

function saveState(){
	document.getElementById("saveStateArea").value = getWeightString();
	changeTab(document.getElementById("cmdTab"));
	fixSaveStateArea();
	//enableBtn("loadStateBtn");
	checkToLoad();
}

function loadState(){
	var ssa = document.getElementById("saveStateArea");
	var w = ssa.value;
	ssa.value = "";
	
	newTopology();
	if(!applyWeights(w,trainConf.topo))
		alert("insufficient weights");
}

function checkToLoad(){
	if(document.getElementById("saveStateArea").value.trim().split("\n").length >= weightLength(trainConf.topo) && trainConf.idle)
		enableButton("loadStateBtn");
	else
		disableButton("loadStateBtn");
		
}

function nextInstanceTrain(nextInstanceBtn){
	if(trainConf.tempDatasetOffset==0){
		trainConf.topo.tempMse = 0;
	}
	setTempDataset(trainConf.tempDatasetOffset,1)
	if(!hasTempDataset())
		swapDatasets();
	
	training(nextInstanceBtn);
}

function mapScale(x, y, minx, maxx, miny, maxy){
	return [
		(x-minx)/(maxx-minx),
		(y-miny)/(maxy-miny)
	];
}

function drawSpace(layerIndex,node){
	if(selTab != "trainTab" && selTab != "visualizeTab" || (selTab == "trainTab" && document.getElementById("trainTooltip").offsetWidth==0)){
		if(!trainConf.idle)
			return;
	}
	if(!isValidDataset(trainConf.dataset, trainConf.topo)){
		//alert("Dataset is not valid, or not matching the topology IO");
		return;
	}
	
	if(trainConf.topo.inputs == 2 || trainConf.topo.inputs == 1){
		visualOptions.isLowRes = !trainConf.idle;
		fixVisualizeTab();
	}
	
	if(trainConf.topo.inputs==2)
		drawSpace2(layerIndex,node);
	else if(trainConf.topo.inputs==1)
		drawSpace1(layerIndex,node);
}

function drawPoints(pCanvas, pc2d, minMaxX, minMaxY) {
	var pointRad = visualOptions.pointRadius/(selTab == "visualizeTab"?1:2);
	var pointColors = ["#C5E9FF","#0071B8"];
	pc2d.clearRect(0,0,pCanvas.width,pCanvas.height);
	for(var p=0;p<nrow(trainConf.dataset);p++){
		var point = mapScale(trainConf.dataset[p][0],trainConf.dataset[p][1],minMaxX[0],minMaxX[1],minMaxY[0],minMaxY[1]);

		pc2d.fillStyle = pointColors[trainConf.topo.inputs==1?1:1-trainConf.dataset[p][trainConf.topo.inputs]];//border color
		//alert(trainConf.inputs==1?0:1-trainConf.dataset[p][trainConf.topo.inputs]);
		pc2d.beginPath();
		pc2d.arc(Math.floor(point[0]*pCanvas.width),Math.floor((1-point[1])*pCanvas.height),pointRad+0.5,0,2*Math.PI);
		pc2d.fill();
		
		pc2d.fillStyle = pointColors[trainConf.topo.inputs==1?0:trainConf.dataset[p][trainConf.topo.inputs]];//actual color
		pc2d.beginPath();
		pc2d.arc(Math.floor(point[0]*pCanvas.width),Math.floor((1-point[1])*pCanvas.height),pointRad,0,2*Math.PI);
		pc2d.fill();
		
	}
}

function drawSpace1(layerIndex,node){
	var canvas = document.getElementById(selTab=="trainTab"?"tSpaceCanvas":"spaceCanvas");
	var pCanvas = document.getElementById(selTab=="trainTab"?"tPointCanvas":"pointCanvas");
	var c2d = canvas.getContext("2d");
	var pc2d = pCanvas.getContext("2d");
	
	canvas.width=canvas.height=canvas.offsetWidth;

	var datasetCols = t(trainConf.dataset);
	var minMaxX = [Math.min.apply(null,datasetCols[0]),Math.max.apply(null,datasetCols[0])];
	var minMaxY = [Math.min.apply(null,datasetCols[1]),Math.max.apply(null,datasetCols[1])];
	
	var visualDim = [canvas.width,canvas.height];
	c2d.beginPath();
	c2d.lineWidth=1;
	c2d.strokeStyle="#0071B8";
	for(var j=0;j<visualDim[0];j++){
		var x = j;
		var y = 0;
		
		var pointInput = [minMaxX[0]+(j/visualDim[0])*(minMaxX[1]-minMaxX[0])];
		
		if(layerIndex == undefined || layerIndex>trainConf.topo.hiddenSizes.length)
			y = forward(trainConf.topo, pointInput).o_p[0];
		else
			y = forward(trainConf.topo, pointInput).i_p[layerIndex-1][node-1];

		if(y>minMaxY[1])
			minMaxY[1] = y;
		if(y<minMaxY[0])
			minMaxY[0] = y;
		y = (y-minMaxY[0])/(minMaxY[1]-minMaxY[0]);

		y = visualDim[1] - y*visualDim[1];
		
		if(j==0)
			c2d.moveTo(x, y);
		else
			c2d.lineTo(x, y);
	}
	c2d.stroke();
	
	drawPoints(pCanvas, pc2d, minMaxX, minMaxY);
}

function drawSpace2(layerIndex,node){
	var canvas = document.getElementById(selTab=="trainTab"?"tSpaceCanvas":"spaceCanvas");
	var pCanvas = document.getElementById(selTab=="trainTab"?"tPointCanvas":"pointCanvas");
	var c2d = canvas.getContext("2d");
	var pc2d = pCanvas.getContext("2d");
	
	var datasetCols = t(trainConf.dataset);
	var minMaxX = [Math.min.apply(null,datasetCols[0]),Math.max.apply(null,datasetCols[0])];
	var minMaxY = [Math.min.apply(null,datasetCols[1]),Math.max.apply(null,datasetCols[1])];
	
	var visualDim = [canvas.width,canvas.height];
	for(var i=1;i<=visualDim[1];i++){
		for(var j=0;j<visualDim[0];j++){
			var x = j;
			var y = visualDim[1]-i;
			var x01 = j/visualDim[0];
			var y01 = i/visualDim[1];
			
			var pointInput = [minMaxX[0]+x01*(minMaxX[1]-minMaxX[0]),minMaxY[0]+y01*(minMaxY[1]-minMaxY[0])];
			var lum;
			if(layerIndex == undefined || layerIndex>trainConf.topo.hiddenSizes.length)
				lum = forward(trainConf.topo, pointInput).o_p[0];
			else
				lum = forward(trainConf.topo, pointInput).i_p[layerIndex-1][node-1];

			c2d.fillStyle="hsl(203, 100%, "+(35+(1.0-lum)*55)+"%)";
			
			c2d.fillRect(Math.floor(x), Math.floor(y), 1,1);
		}
	}
	/*
	var pointRad = 2;
	var pointColors = ["#C5E9FF","#0071B8"]
	for(var p=0;p<nrow(trainConf.dataset);p++){
		var point = mapScale(trainConf.dataset[p][0],trainConf.dataset[p][1],minMaxX[0],minMaxX[1],minMaxY[0],minMaxY[1]);

		pc2d.fillStyle = pointColors[1-trainConf.dataset[p][trainConf.topo.inputs]];//border color
		pc2d.beginPath();
		pc2d.arc(Math.floor(point[0]*pCanvas.width),Math.floor((1-point[1])*pCanvas.height),pointRad+0.5,0,2*Math.PI);
		pc2d.fill();
		
		pc2d.fillStyle = pointColors[trainConf.dataset[p][trainConf.topo.inputs]];//actual color
		pc2d.beginPath();
		pc2d.arc(Math.floor(point[0]*pCanvas.width),Math.floor((1-point[1])*pCanvas.height),pointRad,0,2*Math.PI);
		pc2d.fill();
		
	}
	*/
	drawPoints(pCanvas, pc2d, minMaxX, minMaxY);
}

function plot(){
	var aspRatioTxt = document.getElementById("aspectRatioNum");
	var radiusTxt = document.getElementById("ptRadius");
	
	if(isNaN(aspRatioTxt.value))
		aspRatioTxt.value = 0.5;
	
	if(isNaN(radiusTxt.value))
		radiusTxt.value = 2;
	
	visualOptions.showPoints = document.getElementById("showPoints").checked;
	visualOptions.aspectRatio = parseFloat(aspRatioTxt.value);
	visualOptions.pointRadius = parseInt(radiusTxt.value);
	
	if(visualOptions.showPoints)
		document.getElementById("pointCanvas").style.display = "inline-block";
	else
		document.getElementById("pointCanvas").style.display = "none";
	
	if(trainConf.idle)
		refreshPlot();
	hidePlotUpdate();
}

function refreshPlot(){
	if(selTab == "visualizeTab")
		drawSpace(visualOptions.currentLayer, visualOptions.currentNeuron);
	else
		drawSpace(visualOptions.currentThumbLayer, visualOptions.currentThumbNeuron);
}

function canTrain(){
	return netLen(trainConf.topo)>1;
}

function canVisualize(){
	return trainConf.topo.inputs<=2 && trainConf.topo.outputs==1;
}

function controlTrainingTab(enableDisable){
	var tab = document.getElementById("trainTab");
	if(enableDisable){
		tab.style.display = "inline-block";
	} else {
		tab.style.display = "none";
		if(selTab == "trainTab")
			changeTab(document.getElementById("topoTab"));
	}
}

function controlVisualizeTab(enableDisable){
	var tab = document.getElementById("visualizeTab");
	var eyeBtn2 = document.getElementById("eyeBtn2");
	if(enableDisable){
		eyeBtn2.style.display = tab.style.display = "inline-block";
		
	} else {
		eyeBtn2.style.display = tab.style.display = "none";
		if(selTab == "visualizeTab")
			changeTab(document.getElementById("topoTab"));
	}
}

function captureNeuron(){
	changeTab(document.getElementById("trainTab"));
	var toggleDataBtn = document.getElementById("dataToggle");
	if(toggleDataBtn.className == "netToggle")
		toggleData(toggleDataBtn);
	enableCaptureState();
}

function nodeIdToLocation(nodeId){
	var data = nodeId.split("_");
	data[0] = data[0] > netLen(trainConf.topo) ? data[0]-netLen(trainConf.topo)-10 : data[0];
	return data;
}

function visualizeNeuron(nodeId){
	disableCaptureState();
	var data = nodeIdToLocation(nodeId);
	
	visualOptions.currentLayer = parseInt(data[0]);
	visualOptions.currentNeuron = parseInt(data[1]);
	
	updatePlotCaption();
	
	changeTab(document.getElementById("visualizeTab"));
	plot();
}

function updatePlotCaption(){
	document.getElementById("plotCaption").innerHTML = visualOptions.currentNeuron+"<b><sup>"+ordinal(visualOptions.currentNeuron)+"</sup> node</b> of the "+(visualOptions.currentLayer==netLen(trainConf.topo)?"<b>output</b> layer":"<b>"+visualOptions.currentLayer+"<sup>"+ordinal(visualOptions.currentLayer)+"</sup> hidden</b> layer<br>");
}

function enableCaptureState(){
	var netAreaCaption = document.getElementById("netAreaCaption");
	var generalCaption = document.getElementById("generalCaption");
	netAreaCaption.style.display = "none";
	generalCaption.style.display = "inline-block";
	generalCaption.innerHTML = "Select a <b>node</b> for visualization or press <b>ESC</b> to cancel";
	visualOptions.captureState = true;
}

function disableCaptureState(){
	if(document.getElementById("dataToggle").className=="dataToggle")
		document.getElementById("netAreaCaption").style.display = "inline-block";
	document.getElementById("generalCaption").style.display = "none";
	visualOptions.captureState = false;
	hideTooltip();
}

function updateVisualizationInterface(){
	document.getElementById("ptRadius").value = visualOptions.pointRadius;
	document.getElementById("aspectRatioNum").value = visualOptions.aspectRatio;
	if(visualOptions.showPoints){
		updateChk(document.getElementById("showPointsLbl"));
		document.getElementById("showPoints").checked = true;
	}
}

function placeTooltipAt(domNode){
	var tt = document.getElementById("trainTooltip");
	
	if(!visualOptions.captureState || !isValidDataset(trainConf.dataset, trainConf.topo)){
		tt.style.display = "none";
		return;
	}
	
	var data = nodeIdToLocation(domNode.id);
	visualOptions.currentThumbLayer = data[0];
	visualOptions.currentThumbNeuron = data[1];
	
	tt.style.display = "inline-block";
	tt.style.left = (domNode.offsetLeft+domNode.offsetWidth)+"px";
	tt.style.top = (domNode.offsetTop+domNode.offsetHeight/2-tt.offsetHeight/2 - document.getElementById("netAreaPane").scrollTop)+"px";
	
	refreshPlot();
}

function hideTooltip(){
	document.getElementById("trainTooltip").style.display = "none";
}
