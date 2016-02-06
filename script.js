// Plot detection function and peaks
// Try energy of first few frequency bins with exponential decay

// Canvas element
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

// Audio context
var audioContext = new AudioContext();
var audioBufferSourceNode = audioContext.createBufferSource();
var startTime = 0;

// File reader
var fileReader = new FileReader();
var decodeSuccessCallback = function(audioBuffer) {
	audioBufferSourceNode.disconnect();
	audioBufferSourceNode = audioContext.createBufferSource();
	audioBufferSourceNode.buffer = audioBuffer;
	audioBufferSourceNode.connect(audioContext.destination);

	process(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
	//processAudioBuffer2(audioBuffer);
	audioBufferSourceNode.start();
	startTime = audioContext.currentTime;
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







var graph1;
var graph2;
var graph3;

var render = function() {
	requestAnimationFrame(render);

	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.strokeRect(0, 0, canvas.width, canvas.height);


	var seconds = audioContext.currentTime - startTime;
	var sample = audioContext.sampleRate * seconds;
	var frame = sample / 1024;

	context.setTransform(1, 0, 0, 1000, -frame, 0);
	
	context.globalAlpha = .5;

	context.strokeStyle = 'red';
	context.beginPath();
	for (var frame = 0; frame < graph1.length; ++frame) {
		context.moveTo(frame, 0);
		context.lineTo(frame, graph1[frame]);
	}
	context.stroke();

	context.strokeStyle = 'green';
	context.beginPath();
	for (var frame = 0; frame < graph2.length; ++frame) {
		context.moveTo(frame, 0);
		context.lineTo(frame, graph2[frame]);
	}
	context.stroke();

	context.strokeStyle = 'blue';
	context.beginPath();
	for (var frame = 0; frame < graph3.length; ++frame) {
		context.moveTo(frame, 0);
		context.lineTo(frame, graph3[frame] * 10);
	}
	context.stroke();

	context.globalAlpha = 1;
};

var process = function(samples, sampleRate) {
	var samplesPerFrame = 1024;
	var fft = new FFT(samplesPerFrame, sampleRate);
	var frames = samples.length / samplesPerFrame - 1;
	var energies = new Float32Array(frames);

	var powers1 = new Float32Array(frames - 1);
	var powers2 = new Float32Array(frames - 1);
	var powers3 = new Float32Array(frames - 1);

	var last_energy = 0;
	for (var frame = 0; frame < frames; ++frame) {
		var frameSamples = samples.slice(frame * samplesPerFrame, (frame + 1) * samplesPerFrame);
		fft.forward(frameSamples);

		var energy;

		var band1 = fft.spectrum.slice(0, 10);
		energy = 0;
		for (var bin = 0; bin < band1.length; ++bin) {
			energy += band1[bin] * band1[bin];
		}
		powers1[frame] = energy - last_energy;

		var band2 = fft.spectrum.slice(10, 100);
		energy = 0;
		for (var bin = 0; bin < band2.length; ++bin) {
			energy += band2[bin] * band2[bin];
		}
		powers2[frame] = energy - last_energy;

		var band3 = fft.spectrum.slice(100, 512);
		energy = 0;
		for (var bin = 0; bin < band3.length; ++bin) {
			energy += band3[bin] * band3[bin];
		}
		powers3[frame] = energy - last_energy;
	}

	graph1 = powers1;
	graph2 = powers2;
	graph3 = powers3;

	// Peak picking

	var powers = powers3;

	var movingAverages = getSimpleMovingAverage(powers, 10);
	for (var frame = 0; frame < powers.length - 1; ++frame) {
		if (powers[frame] < 0) continue;

		if (powers[frame] < powers[frame + 1]) continue;
		if (powers[frame] > movingAverages[frame] * 3) {
			var seconds = frame * samplesPerFrame / audioContext.sampleRate;
			setTimeout(function() { console.log('beat'); }, seconds * 1000);
		}
	}

	render();
}






var process2 = function(samples, sampleRate) {
	// var samplesPerFrame = Math.pow(2, Math.ceil(Math.log(sampleRate * 0.02) / Math.LN2));
	var frameSamples = 1024;
	var fft = new FFT(frameSamples, sampleRate);

	var spectrogram = new Float32Array(samples.length);
	for (var sample = frameSamples/2; sample < samples.length - frameSamples/2; ++sample) {
		fft.forward(samples.slice(sample - frameSamples/2, sample + frameSamples/2));
		//spectrogram[sample] = fft.spectrum[0] * fft.spectrum[0];
		spectrogram[sample] = 0;
	}

	console.log(spectrogram[0]);
};

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
var processAudioBuffer2 = function(audioBuffer) {
	// Get audio samples (PCM)
	var samples = audioBuffer.getChannelData(0);
	var samplesPerFrame = 1024;

	// Calculate spectral flux
	var spectralFlux = getSpectralFlux(samples, samplesPerFrame, audioBuffer.sampleRate);

	graph1 = spectralFlux;

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
};

// Process audio buffer
var processAudioBuffer1 = function(audioBuffer) {
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
};