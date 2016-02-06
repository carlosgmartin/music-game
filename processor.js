var frameSize = 1024;
var frameOffset = 512;

// Process audio samples
var process = function(samples, sampleRate) {
	// Create FFT analyser
	var fft = new FFT(frameSize, sampleRate);

	// Calculate sound energies for each frame
	var energies = [];
	var lowFreqEnergies = [];
	for (var sample = 0; sample < samples.length - frameSize; sample += frameOffset) {
		// Get samples for this frame
		var frameSamples = samples.slice(sample, sample + frameSize);

		// Record energy for this frame
		var energy = getEnergy(frameSamples);
		energies.push(energy);

		// Get FFT of frame samples
		fft.forward(frameSamples);
		// Record energy for this frame for low frequencies
		var lowFrequencies = fft.spectrum.slice(0, 10);
		var lowFreqEnergy = getEnergy(lowFrequencies);
		lowFreqEnergies.push(lowFreqEnergy * 1000);
	}

	// Plot energy levels
	graphs.push({data: energies, color: '#f00'});
	graphs.push({data: getMovingAverage(energies, 4), color: '#800'});
	graphs.push({data: getMovingMaximum(energies, 8), color: '#f88'});

	// Calculate changes in energy levels
	var powers = getDifference(energies);
	graphs.push({data: powers, color: '#00f'});
	graphs.push({data: getMovingAverage(powers, 4), color: '#008'});
	graphs.push({data: getMovingMaximum(powers, 8), color: '#88f'});

	// Plot energy levels for low frequencies
	graphs.push({data: lowFreqEnergies, color: '#fa0'});

	render();
};

// Calculate the squared amplitude (energy)
var getEnergy = function(data) {
	var result = 0;
	for (var i = 0; i < data.length; ++i) {
		result += data[i] * data[i];
	}
	return result;
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