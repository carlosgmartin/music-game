var frameSize = 1024;

// Process audio samples
var process = function(samples, sampleRate) {
	// Calculate sound energies for each frame
	var energies = [];
	for (var sample = 0; sample < samples.length - frameSize; sample += frameSize) {
		var frameSamples = samples.slice(sample, sample + frameSize);
		var energy = 0;
		for (var frameSample = 0; frameSample < frameSamples.length; ++frameSample) {
			energy += frameSamples[frameSample] * frameSamples[frameSample];
		}
		energies.push(energy);
	}

	// Plot energy levels with moving averages
	graphs.push({data: energies, color: 'red'});
	graphs.push({data: getMovingAverage(energies, 4), color: 'green'});
	graphs.push({data: getMovingAverage(energies, 16), color: 'blue'});

	// Calculate energy changes and plot them
	var difference = getDifference(energies);
	graphs.push({data: difference, color: 'orange'});

	render();
};

// Calculate the moving average of the data with a specified range or window size
var getMovingAverage = function(data, range) {
	var result = new Float32Array(data.length);
	for (var i = 0; i < data.length; ++i) {
		var start = Math.max(0, i - range);
		var end = Math.min(data.length - 1, i + range);
		var sum = 0;
		for (var j = start; j <= end; ++j) {
			sum += data[j];
		}
		result[i] = sum / (end - start + 1);
	}
	return result;
};

// Calculate the first order discrete difference of the data
var getDifference = function(data) {
	var result = new Float32Array(data.length - 1);
	for (var i = 0; i < data.length - 1; ++i) {
		result[i] = data[i + 1] - data[i];
	}
	return result;
};