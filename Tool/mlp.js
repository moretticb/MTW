//////////////////////////////////////////////////////////////////////////////
//
//                mlp.js - MLP Topology Workbench
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


//MATRIX OPERATIONS

function nrow(matrix){
	return matrix.length;
}

function ncol(matrix){
	if(matrix[0].length)
		return matrix[0].length
	return 1
}

function isMatrix(matrix){
	return matrix[0].length ? true : false;
}

function asMatrix(matrix){
	if(isMatrix(matrix))
		return matrix;

	var outMatrix = [];
	for(var i=0;i<nrow(matrix);i++)
		outMatrix.push([getValue(matrix,i,0)]);

	return outMatrix
}

function getValue(matrix, i, j){
	if(ncol(matrix)==1)
		return matrix[i]
	return +matrix[i][j];
}

function fl(matrix){
	return matrix.toString().split(",").map(Number);
}

function t(matrix){
	matrix = asMatrix(matrix);
	var outMatrix = []
	for(var i=0;i<ncol(matrix);i++){
		outMatrix.push([]);
		for(var j=0;j<nrow(matrix);j++){
			outMatrix[i][j] = getValue(matrix, j, i);
		}
	}

	return outMatrix;
}

function dot(a, b){
	if(ncol(a) != nrow(b))
		if(ncol(t(a)) == nrow(b))
			a = t(a);
		else
			return null;

	a = asMatrix(a);
	b = asMatrix(b);

	var outMatrix = [];
	for(var i=0;i<nrow(a);i++){
		outMatrix[i] = []
		for(var j=0;j<ncol(b);j++){
			outMatrix[i].push(0);

			for(k=0;k<ncol(a);k++){
				outMatrix[i][j] += a[i][k] * b[k][j];
			}
			
		}
	}
	return outMatrix;
}

function view(matrix){
	if(!matrix)
		return "";
	matrix = asMatrix(matrix);
	var str = "";
	for(var i=0;i<nrow(matrix);i++){
		for(var j=0;j<ncol(matrix);j++){
			str += getValue(matrix, i, j) + "\t";
		}
		str += "\n";
	}
	return str;
}

function matrix(data, numCol){
	var outMatrix = [];
	for(var i=0;i<data.length/numCol;i++){
		outMatrix.push([]);
		for(j=0;j<numCol;j++){
			outMatrix[i].push(data[numCol*i+j]);
		}
	}
	return outMatrix;
}

function randomArray(len){
	var outArray = [];
	for(var i=0;i<len;i++)
		outArray.push(Math.random());

	return outArray;
}

//End of MATRIX OPERATIONS

//DATA SCIENCE UTILITIES

function readDataset(str){
	if(str.indexOf("(")+str.indexOf(")")>0)
		return parseDatasetFunction(str);
	
	var dataset = [];
	var lines = str.split("\r\n").join("\n").trim().split("\n");
	for(var i=0;i<lines.length;i++){
		dataset.push([]);
		values = lines[i].split(" ").join("").split(",");
		for(var j=0;j<values.length;j++){
			dataset[i].push(parseFloat(values[j]));
		}
	}

	return dataset;
}

function parseDatasetFunction(str){
	var data = str.split("(");
	var params = data[1].substring(0, data[1].indexOf(")")).split(",");
	if(data[0] == "spiral")
		return (params.length==4?spiralData(params[0].trim(), params[1].trim(), params[2].trim(), params[3].trim()):spiralData());
	else if(data[0] == "ring")
		return (params.length==4?ringData(params[0].trim(), params[1].trim(), params[2].trim(), params[3].trim()):ringData());
	else if(data[0] == "sin")
		return (params.length==3?sinData(params[0].trim(), params[1].trim(), params[2].trim()):sinData());
	return null;
}

function isValidDataset(dataset, topo){
	if(dataset == null || dataset == undefined)
		return false;
	if(nrow(dataset) < 1)
		return false;
	for(var p=0;p<nrow(dataset);p++){
		if(dataset[p].length != topo.inputs+topo.outputs){
			return false;
		}
	}
	return true;
}

function weightLength(topo){
	var len = 0;
	for(var L=0;L<netLen(topo);L++){
		var layer = L==topo.hiddenSizes.length?topo.outputs:topo.hiddenSizes[L];
		var input = L==0?topo.inputs:topo.hiddenSizes[L-1];
		len += layer*(input+1);
	}
	return len;
}

//End of DATA SCIENCE UTILITIES


//MLP

function applyWeights(w,topo){
	w = w.trim().split("\r\n").join("\n").split("\n");
	var offset = 0;
	if(w.length < weightLength(topo))
		return false;
	for(var i=0;i<w.length;i++){
		w[i] = parseFloat(w[i]);
		if(isNaN(w[i]))
			return false;
	}

	for(var L=0;L<netLen(topo);L++){
		var isOutput = L==topo.hiddenSizes.length;
		
		if(!isOutput){
			//var lengths = topo.hiddenSizes[L] * ((L==0?topo.inputs:topo.hiddenSizes[L-1])+1);
			//topo.weights.hidden[L] = matrix(w.slice(offset,offset+lengths),topo.hiddenSizes[L]);
			//offset += lengths;

			for(var j=0;j<topo.hiddenSizes[L];j++){
				for(var i=0; i < (L==0?topo.inputs:topo.hiddenSizes[L-1])+1; i++){
					topo.weights.hidden[L][i][j] = w[offset++];
				}
			}

		} else {
			//topo.weights.output = matrix(w.slice(offset,w.length),topo.outputs);

			for(var k=0;k<topo.outputs;k++){
				for(var j=0; j < topo.hiddenSizes[L-1]+1; j++){
					topo.weights.output[j][k] = w[offset++];
				}
			}
		}
	}

	return true;
}

function createTopology(inputs, hiddenSizes, outputs){
	var topo = {};
	topo.inputs = inputs;
	topo.hiddenSizes = hiddenSizes;
	topo.outputs = outputs;
	
	if(window.activations.length > 0){
		topo.activations = activations;
	} else {
		topo.activations = [];
		for(var i=0;i<hiddenSizes.length+1;i++)
			topo.activations.push(true);
	}

	topo.weights = {};
	topo.weights.output = matrix(randomArray((hiddenSizes[hiddenSizes.length-1]+1)*outputs), outputs);
	topo.weights.hidden = [];
	for(var L=0;L<hiddenSizes.length;L++){
		topo.weights.hidden.push(matrix(randomArray(((L==0?inputs:hiddenSizes[L-1])+1)*topo.hiddenSizes[L]), topo.hiddenSizes[L]));
	}

	return topo;
}

function netLen(topo){
	return topo.hiddenSizes.length+1;
}

function g(u){
	return 1/(1+Math.exp(-u));
}

function uu(u){
	return u;
}

function mFunc(func, arg){
	if(typeof(arg) == "number") //if arg is a scalar
		return func(arg);

	var outMatrix = [];
	arg = asMatrix(arg);
	for(var i=0;i<nrow(arg);i++){
		outMatrix.push([]);
		for(var j=0;j<ncol(arg);j++){
			outMatrix[i].push(func(+getValue(arg,i,j)));
		}
	}
	return outMatrix;
}

function forward(topo, input){
	var feed = {};
	feed.i_p = [];
	for(var L=0;L<topo.hiddenSizes.length;L++){
		feed.i_p.push(fl(mFunc(trainConf.topo.activations[L]?g:uu, dot(fl([-1,L==0?input:feed.i_p[L-1]]),topo.weights.hidden[L]))));
	}
	feed.o_p = fl(mFunc(trainConf.topo.activations[trainConf.topo.hiddenSizes.length]?g:uu, dot(fl([-1,feed.i_p[topo.hiddenSizes.length-1]]), topo.weights.output)));

	return feed;
}

function getDelta(topo, layer, feed, x_p, y_p){ //layer beginning at 1
	if(layer < 1)
		return null;
	var deltaOut = [];

	if(layer == netLen(topo)){
		for(var k=0;k<topo.outputs;k++){
			var activationDeriv = trainConf.topo.activations[layer-1]?feed.o_p[k] * (1 - feed.o_p[k]):1;
			deltaOut.push((y_p[k] - feed.o_p[k]) * activationDeriv);
		}

		return deltaOut;
	}
	
	var lastHidden = layer==topo.hiddenSizes.length;
	for(var j=0;j<topo.hiddenSizes[layer-1];j++){ //current layer (index)
		deltaOut.push(0);
		var deltaFromForward = getDelta(topo, layer+1, feed, x_p, y_p);
		for(var k=0;k<(lastHidden?topo.outputs:topo.hiddenSizes[layer]);k++){ //next layer
			deltaOut[j] = deltaOut[j] + deltaFromForward[k] * (lastHidden?topo.weights.output:topo.weights.hidden[layer])[j+1][k];
		}
		var activationDeriv = trainConf.topo.activations[layer-1] ? feed.i_p[layer-1][j] * (1 - feed.i_p[layer-1][j]) : 1;
		deltaOut[j] = deltaOut[j] * activationDeriv;
	}

	return deltaOut;
}

function train(topo, dataset, eta, epsilon){
	if(!eta) eta = 0.1;
	if(!epsilon) epsilon = 0.1;

	if(!hasTempDataset() || trainConf.tempDatasetOffset == 0 || trainConf.tempDatasetOffset+trainConf.dataset.length-1 == trainConf.tempDataset.length){
		if(typeof(topo.epoch) == "number"){
				topo.epoch+=1;
		} else
			topo.epoch=1;
	}
	
	
	topo.mse = 0;
	for(var p=0;p<nrow(dataset);p++){
		x_p = dataset[p].slice(0,topo.inputs);
		y_p = dataset[p].slice(topo.inputs,ncol(dataset));

		feed = forward(topo, x_p);

		for(var L=netLen(topo); L>0; L--){ //current layer (index): L-1

			var isOutput = L==netLen(topo);
			var isFirst = L==1;
			var delta = getDelta(topo, L, feed, x_p, y_p);
			var flatInput = fl([-1, isFirst?x_p:feed.i_p[L-2] ]);
			for(var k=0; k<(isOutput?topo.outputs:topo.hiddenSizes[L-1]); k++){
				for(var j=0; j<(L==1?topo.inputs:topo.hiddenSizes[L-2])+1; j++){
					if(isOutput){
						topo.weights.output[j][k] = topo.weights.output[j][k] + eta * delta[k] * flatInput[j];
					}else{
						topo.weights.hidden[L-1][j][k] = topo.weights.hidden[L-1][j][k] + eta * delta[k] * flatInput[j];
					}
						
				}
			}


		}

		for(var k=0;k<topo.outputs;k++){
			topo.mse += Math.pow(y_p[k] - feed.o_p[k],2);
		}
	}
	topo.mse /= nrow(dataset);
	if(hasTempDataset()){
		topo.tempMse += topo.mse*nrow(dataset);
		if(trainConf.tempDatasetOffset == 0)
			topo.mse = topo.tempMse/trainConf.tempDataset.length;
	}
		
	if(hasTempDataset())
		return false;

	return topo.mse > epsilon;
}

function getWeightString(fixed){
	var str = "";
	for(var L=0;L<=trainConf.topo.weights.hidden.length;L++){
		var l = L<(netLen(trainConf.topo)-1)?trainConf.topo.weights.hidden[L]:trainConf.topo.weights.output;

		for(var j=0;j<ncol(l);j++){
			for(var i=0;i<nrow(l);i++){
				str += (fixed ? l[i][j].toFixed(fixed) : l[i][j])+"\n";
			}
		}
	}
	
	return str;
}

//End of MLP

//Dataset generators

function normalizeDataset(dataset){
	dataset = t(dataset);

	for(var col=0;col<nrow(dataset);col++){ //nrow because dataset is transposed
		var minMax = [Math.min.apply(null,dataset[col]),Math.max.apply(null,dataset[col])];

		for(var row=0;row<ncol(dataset);row++){ //ncol because dataset is transposed
			dataset[col][row] = (dataset[col][row] - minMax[0])/(minMax[1]- minMax[0]);
		}
	}
	
	return t(dataset);
}

function addNoise(noise){
	return (Math.random()-0.5)*noise;
}

function sinData(points, periods, noise){
	points = isNaN(points)?100:points;
	periods = isNaN(periods)?1:periods;
	noise = isNaN(noise)?0:noise;
	
	var len = 2*Math.PI*periods;
	var step = len/points;
	var data = [];
	
	for(var p=0;p<points;p++){
		data.push([step*p, Math.sin(step*p) + addNoise(noise)]);
	}
	return normalizeDataset(data);
}

function spiralData(points, twirl, noise, flipLabels){
	points = isNaN(points)?200:points;
	twirl = isNaN(twirl)?7:twirl;
	noise = isNaN(noise)?0:noise;
	flipLabels = flipLabels==undefined?false:flipLabels=="true"?true:flipLabels=="false"?false:flipLabels;
	
	var data = [];
	var step = twirl/(points/2);
	
	for(var i=0;i<points/2;i++){
		data.push([
			(twirl-i*step)*Math.cos(i*step) + addNoise(noise),
			(twirl-i*step)*Math.sin(i*step) + addNoise(noise),
			flipLabels?1:0
		]);
		data.push([
			-(twirl-i*step)*Math.cos(i*step) + addNoise(noise),
			-(twirl-i*step)*Math.sin(i*step) + addNoise(noise),
			flipLabels?0:1
		]);
	}
	return normalizeDataset(data);
}

function ringData(points, ringPairs, noise, flipLabels){
	points = isNaN(points) || points < ringPairs*2 ? 100 : points;
	ringPairs = isNaN(ringPairs) || ringPairs < 1 ? 1 : ringPairs;
	noise = isNaN(noise) ? 0.15 : noise;
	flipLabels = flipLabels==undefined?false:flipLabels=="true"?true:flipLabels=="false"?false:flipLabels;
	
	var data = [];
	var pointsPerRing = points / (ringPairs*2);
	for(var i=1; i<=ringPairs*2; i++){
		
		for(var p=0; p<pointsPerRing; p++){
				data.push([
					1/ringPairs*i*Math.cos(2*Math.PI/pointsPerRing*p) + addNoise(noise),
					1/ringPairs*i*Math.sin(2*Math.PI/pointsPerRing*p) + addNoise(noise),
					i%2==0?flipLabels?0:1:flipLabels?1:0
				]);
		}
		
	}
	
	return normalizeDataset(data);
}

//End of Dataset generators

//MISC

function updateTrainConf(){
	for(var i=0;i<topology.length;i++)
		topology[i] = parseInt(topology[i]);
	var oldActiv;
	if(window.trainConf)
		if(trainConf.topo.activations)
			oldActiv = trainConf.topo.activations;
		
	window.trainConf = {
		topo: createTopology(topology[0],topology.slice(1,topology.length-1),topology[topology.length-1]),
		//dataset: readDataset("0.0,0.0,0.0,1.0\n0.0,1.0,1.0,0.0\n1.0,0.0,1.0,0.0\n1.0,1.0,0.0,1.0"),
		dataset: window.trainConf?window.trainConf.dataset:readDataset(document.getElementById("datasetData").value),
		tempDataset: [],
		tempDatasetOffset: 0,
		eta: parseFloat(document.getElementById("etaNum").value),
		epsilon: parseFloat(document.getElementById("epsilonTxt").value),
		idle: true
	};
	
	if(oldActiv)
		window.trainConf.topo.activations = oldActiv;
}

function training(trainBtn){
	if(trainBtn){
		if(!isValidDataset(trainConf.dataset, trainConf.topo)){
			alert("Dataset is not valid, or not matching the topology IO");
			return false;
		}
		if(trainBtn.id=="iterateBtn" && hasTempDataset()){
			if(trainConf.tempDatasetOffset==0){
				swapDatasets();
			}else{
				setTempDataset(trainConf.tempDatasetOffset,-1);
				trainConf.tempDatasetOffset=0;
			}
		}
		if(isBtnDisabled(trainBtn))
			return false;
		else{
			disableButton(trainBtn);
			disableButton("updateParBtn");
			disableButton("saveStateBtn");
			disableButton("loadStateBtn");
			disableButton("randStateBtn");
			disableButton("instanceBtn");
		}
	}
	var interrupt = document.getElementById("interrupt").checked;
	var trainResp = train(trainConf.topo,trainConf.dataset,trainConf.eta,trainConf.epsilon);

	updateVisual();

	trainConf.idle = !(trainResp && !interrupt);
	if(!trainConf.idle){
		setTimeout(training,0);
		document.getElementById("netState").innerHTML = "";
	} else {
		document.getElementById("netState").innerHTML = "idle";
		enableButton("iterateBtn");
		enableButton("updateParBtn");
		enableButton("saveStateBtn");
		checkToLoad();
		enableButton("randStateBtn");
		enableButton("instanceBtn");
	}
}

function setTempDataset(offset, len){
	var hasTemp = hasTempDataset();
	len = len<0?(hasTemp?trainConf.tempDataset.length:trainConf.dataset.length)-offset:len;
	if(hasTemp)
		swapDatasets()
	trainConf.tempDataset = trainConf.dataset.slice(offset,offset+len);
	if(hasTemp)
		swapDatasets()
	
	var instances = hasTemp?trainConf.tempDataset.length:trainConf.dataset.length;
	trainConf.tempDatasetOffset = (++offset)%instances;
}

function swapDatasets(){
	var temp = trainConf.tempDataset;
	trainConf.tempDataset = trainConf.dataset;
	trainConf.dataset = temp;
}

function hasTempDataset(){
	return trainConf.dataset.length < trainConf.tempDataset.length;
}

//End of MISC
