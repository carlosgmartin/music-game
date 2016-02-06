var frameSize = 1024;
var frameOffset = 512;

// Process audio samples
var process = function(samples, sampleRate) {
	// Calculate sound energies for each frame
	var energies = [];
	for (var sample = 0; sample < samples.length - frameSize; sample += frameOffset) {
		var frameSamples = samples.slice(sample, sample + frameSize);

		var energy = 0;
		for (var frameSample = 0; frameSample < frameSamples.length; ++frameSample) {
			energy += frameSamples[frameSample] * frameSamples[frameSample];
		}
		energies.push(energy);
	}

	// Plot energy levels with moving averages and moving maxima
	graphs.push({data: energies, color: '#f00'});
	graphs.push({data: getMovingAverage(energies, 4), color: '#800'});
	graphs.push({data: getMovingMaximum(energies, 8), color: '#f88'});

	// Calculate changes in energy levels and plot them
	var powers = getDifference(energies);
	graphs.push({data: powers, color: '#00f'});
	graphs.push({data: getMovingAverage(powers, 4), color: '#008'});
	graphs.push({data: getMovingMaximum(powers, 8), color: '#88f'});

	render();
};

// Calculate the moving average with a specified range
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

// Calculate the moving maximum with a specified range
var getMovingMaximum = function(data, range) {
	var result = new Float32Array(data.length);
	for (var i = 0; i < data.length; ++i) {
		var start = Math.max(0, i - range);
		var end = Math.min(data.length - 1, i + range);
		var max = Number.NEGATIVE_INFINITY;
		for (var j = start; j <= end; ++j) {
			if (data[j] > max) {
				max = data[j];
			}
		}
		result[i] = max;
	}
	return result;
};

// Calculate the first order discrete difference
var getDifference = function(data) {
	var result = new Float32Array(data.length - 1);
	for (var i = 0; i < data.length - 1; ++i) {
		result[i] = data[i + 1] - data[i];
	}
	return result;
};