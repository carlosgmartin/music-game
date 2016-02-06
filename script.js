// Plot detection function and peaks
// Try energy of first few frequency bins with exponential decay

// Audio context
var audioContext = new AudioContext();
var audioBufferSourceNode = audioContext.createBufferSource();

// File reader
var fileReader = new FileReader();
var decodeSuccessCallback = function(audioBuffer) {
	audioBufferSourceNode.disconnect();
	audioBufferSourceNode = audioContext.createBufferSource();
	audioBufferSourceNode.buffer = audioBuffer;
	audioBufferSourceNode.connect(audioContext.destination);

	processAudioBuffer(audioBuffer);
};
var decodeErrorCallback = function() {
	console.log('Error decoding audio data');
};
fileReader.addEventListener('load', function() {
	var arrayBuffer = fileReader.result;
	audioContext.decodeAudioData(arrayBuffer, decodeSuccessCallback, decodeErrorCallback);
});
fileReader.addEventListener('error', function() {
	console.log('Error reading file');
});

// Input element
var input = document.getElementById('input');
input.addEventListener('change', function() {
	fileReader.readAsArrayBuffer(input.files[0]);
});










var getDifference = function(array1, array2) {
	if (array1.length != array2.length) {
		console.log('Error: Array lengths are not equal');
	}
	var difference = new Float32Array(array1.length);
	for (var n = 0; n < difference.length; ++n) {
		difference[n] = array1[n] - array2[n];
	}
	return difference;
};

var getRectified = function(array) {
	var rectified = new Float32Array(array);
	for (var n = 0; n < rectified.length; ++n) {
		if (rectified[n] < 0) {
			rectified[n] = 0;
		}
	}
	return rectified;
};

var getScaled = function(array, scaleFactor) {
	var scaled = new Float32Array(array);
	for (var n = 0; n < scaled.length; ++n) {
		scaled[n] *= scaleFactor;
	}
	return scaled;
};

var getL1Norm = function(array) {
	var sum = 0;
	for (var n = 0; n < array.length; ++n) {
		sum += Math.abs(array[n]);
	}
	return sum;
};

var getL2Norm = function(array) {
	var sum = 0;
	for (var n = 0; n < array.length; ++n) {
		sum += array[n] * array[n];
	}
	return Math.sqrt(sum);
};

var getSpectralFlux = function(samples, samplesPerFrame, sampleRate) {
	var fft = new FFT(samplesPerFrame, sampleRate);
	var frames = Math.floor(samples.length / samplesPerFrame) - 1;
	var spectralFlux = new Float32Array(frames);
	var lastSpectrum = new Float32Array(samplesPerFrame / 2);
	for (var frame = 0; frame < spectralFlux.length; ++frame) {
		var frameSamples = samples.slice(frame * samplesPerFrame, (frame + 1) * samplesPerFrame);
		fft.forward(frameSamples);
		currentSpectrum = fft.spectrum;

		var difference = getDifference(currentSpectrum, lastSpectrum);
		var rectifiedDifference = getRectified(difference);
		spectralFlux[frame] = getL1Norm(rectifiedDifference);

		lastSpectrum = new Float32Array(currentSpectrum);
	}
	return spectralFlux;
};

var getExponentialMovingAverage = function(data, smoothingFactor) {
	var exponentialMovingAverage = new Float32Array(data.length);
	for (var point = 0; point < exponentialMovingAverage.length - 1; ++point) {
		exponentialMovingAverage[point + 1] = smoothingFactor * exponentialMovingAverage[point] + (1 - smoothingFactor) * data[point];
	}
	return exponentialMovingAverage;
};

var getSimpleMovingAverage = function(data, range) {
	var simpleMovingAverage = new Float32Array(data.length);
	for (var point = 0; point < simpleMovingAverage.length; ++point) {
		var startPoint = Math.max(0, point - range);
		var endPoint = Math.min(data.length - 1, point + range);
		var sum = 0;
		for (var rangePoint = startPoint; rangePoint <= endPoint; ++rangePoint) {
			sum += data[rangePoint];
		}
		simpleMovingAverage[point] = sum / (endPoint - startPoint + 1);
	}
	return simpleMovingAverage;
};





// Process audio buffer
var processAudioBuffer = function(audioBuffer) {
	// Get audio samples (PCM)
	var samples = audioBuffer.getChannelData(0);
	var samplesPerFrame = 1024;

	// Calculate spectral flux
	var spectralFlux = getSpectralFlux(samples, samplesPerFrame, audioBuffer.sampleRate);

	// Calculate smoothed spectral flux (exponential moving average)
	var spectralFluxEMA = getExponentialMovingAverage(spectralFlux, .5);

	// Calculate smoothed spectral flux (simple moving average) with multiplier
	var spectralFluxSMA = getSimpleMovingAverage(spectralFlux, 5);
	spectralFluxSMA = getScaled(spectralFluxSMA, 1.75);

	// Find pruned spectral flux
	var prunedSpectralFlux = getDifference(spectralFlux, spectralFluxSMA);
	prunedSpectralFlux = getRectified(prunedSpectralFlux);

	// Find spectral flux peaks
	var spectralFluxPeaks = new Float32Array(prunedSpectralFlux.length);
	for (var frame = 0; frame < spectralFluxPeaks.length - 1; ++frame) {
		if (prunedSpectralFlux[frame] > prunedSpectralFlux[frame + 1]) {
			spectralFluxPeaks[frame] = prunedSpectralFlux[frame];
		} else {
			spectralFluxPeaks[frame] = 0;
		}
	}
	// Remove close peaks
	var lastPeakFrame = 0;
	var peakWindowSize = 5;
	for (var frame = 0; frame < spectralFluxPeaks.length - 1; ++frame) {
		if (frame - lastPeakFrame < peakWindowSize) {
			spectralFluxPeaks[frame] = 0;
		} else {
			if (spectralFluxPeaks[frame] > 0) {
				lastPeakFrame = frame;
			}
		}
	}
	// Schedule beats
	for (var frame = 0; frame < spectralFluxPeaks.length; ++frame) {
		if (spectralFluxPeaks[frame] > 0) {
			var seconds = frame * samplesPerFrame / audioBuffer.sampleRate;
			setTimeout(function() { console.log('beat'); }, seconds * 1000);
		}
	}
	// Play music
	audioBufferSourceNode.start();
};








// Process audio buffer (old)
var processAudioBufferOld = function(audioBuffer) {
	var frameSize = 2048;
	// Get PCM data (samples)
	var data = audioBuffer.getChannelData(0);
	var fft = new FFT(frameSize, audioBuffer.sampleRate);

	var frames = Math.floor((data.length - frameSize) / frameSize);
	var spectralFlux = new Float32Array(frames);
	var lastSpectrum = new Float32Array(frameSize);
	var frame = 0;

	for (var sample = 0; sample < data.length - frameSize; sample += frameSize) {
		// Get samples belonging to current frame
		var frameData = data.slice(sample, sample + frameSize);
		// Get current time in seconds
		var seconds = sample / audioBuffer.sampleRate;
		// Calculate current frame FFT with windowing
    	fft.forward(frameData);
		var currentSpectrum = fft.spectrum;

		for (var freq = 0; freq < currentSpectrum.length; ++freq) {
			var logdifference = Math.log(1 + currentSpectrum[freq]) - Math.log(1 + lastSpectrum[freq]);
			//var logdifference = currentSpectrum[freq] - lastSpectrum[freq];
			if (logdifference > 0) {
				spectralFlux[frame] += logdifference;
			}
		}
		lastSpectrum = new Float32Array(currentSpectrum);
		++frame;
	}

	/*
	// Other method
	var lastKick = 0;
	for (var frame = 0; frame < spectralFlux.length; ++frame) {
		lastKick *= .95;
		if (spectralFlux[frame] > lastKick) {
			var seconds = frame * frameSize / audioBuffer.sampleRate;
			//console.log('Time ' + seconds + ': ' + spectralFlux[frame]);
			setTimeout(function() { console.log('beat'); }, seconds * 1000);
			lastKick = spectralFlux[frame];
		}
	}
	*/

	// Simple peak-picking
	var lastBeatFrame = 0;
	for (var frame = 5; frame < spectralFlux.length - 5; ++frame) {

		maxSamples = spectralFlux.slice(frame - 1, frame + 1);
		max = Math.max(...maxSamples);

		meanSamples = spectralFlux.slice(frame - 3, frame + 2);
		var mean = 0;
		for (var i = 0; i < meanSamples.length; ++i) {
			mean += meanSamples[i];
		}
		mean /= meanSamples.length;

		if (spectralFlux[frame] = max && spectralFlux[frame] >= mean + 2.3 && frame - lastBeatFrame > 1) {
			var seconds = frame * frameSize / audioBuffer.sampleRate;
			//console.log('Time ' + seconds + ': ' + spectralFlux[frame]);
			setTimeout(function() { console.log('beat'); }, seconds * 1000);
			lastBeatFrame = frame;
		}
	}

	audioBufferSourceNode.start();
};























