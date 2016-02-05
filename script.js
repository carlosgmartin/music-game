// TODO: Separate different audio processing stages into functions
// Try exponential decaying technique
// Plot detection function and peaks

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

// Process audio buffer
var processAudioBuffer = function(audioBuffer) {
	// Calculate spectral flux
	var samples = audioBuffer.getChannelData(0);
	var samplesPerFrame = 1024;
	var fft = new FFT(samplesPerFrame, audioBuffer.sampleRate);

	var frames = Math.floor(samples.length / samplesPerFrame) - 1;
	var spectralFlux = new Float32Array(frames);

	var lastSpectrum = new Float32Array(samplesPerFrame);
	for (var frame = 0; frame < frames; ++frame) {
		var frameSamples = samples.slice(frame * samplesPerFrame, (frame + 1) * samplesPerFrame);
		fft.forward(frameSamples);
		currentSpectrum = fft.spectrum;
		for (var bin = 0; bin < currentSpectrum.length; ++bin) {
			var difference = currentSpectrum[bin] - lastSpectrum[bin];
			if (difference > 0) {
				spectralFlux[frame] += difference;
			}
		}
		lastSpectrum = new Float32Array(currentSpectrum);
	}
	// Calculate smoothed spectral flux (exponential moving average)
	var exponentialSmoothedSpectralFlux = new Float32Array(frames);
	var smoothingFactor = .5;
	for (var frame = 0; frame < frames - 1; ++frame) {
		exponentialSmoothedSpectralFlux[frame + 1] = smoothingFactor * spectralFlux[frame] + (1 - smoothingFactor) * exponentialSmoothedSpectralFlux[frame];
	}
	// Calculate smoothed spectral flux (simple moving average) with multiplier
	var multiplier = 2;
	var simpleSmoothedSpectralFlux = new Float32Array(frames);
	var windowSize = 5;
	for (var frame = 0; frame < frames; ++frame) {
		var start = Math.max(0, frame - windowSize);
		var end = Math.min(frames - 1, frame + windowSize);
		var sum = 0;
		for (var windowFrame = start; windowFrame <= end; ++windowFrame) {
			sum += spectralFlux[windowFrame];
		}
		var mean = sum / (end - start + 1);
		simpleSmoothedSpectralFlux[frame] = mean * multiplier;
	}
	// Find pruned spectral flux
	var prunedSpectralFlux = new Float32Array(frames);
	for (var frame = 0; frame < frames; ++frame) {
		var offset = spectralFlux[frame] - simpleSmoothedSpectralFlux[frame];
		if (offset > 0) {
			prunedSpectralFlux[frame] = offset;
		} else {
			prunedSpectralFlux[frame] = 0;
		}
	}
	// Find spectral flux peaks
	var spectralFluxPeaks = new Float32Array(frames);
	for (var frame = 0; frame < frames - 1; ++frame) {
		if (prunedSpectralFlux[frame] > prunedSpectralFlux[frame + 1]) {
			spectralFluxPeaks[frame] = prunedSpectralFlux[frame];
		} else {
			spectralFluxPeaks[frame] = 0;
		}
	}
	// Remove close peaks
	var lastPeakFrame = 0;
	var peakWindowSize = 5;
	for (var frame = 0; frame < frames - 1; ++frame) {
		if (frame - lastPeakFrame < peakWindowSize) {
			spectralFluxPeaks[frame] = 0;
		} else {
			if (spectralFluxPeaks[frame] > 0) {
				lastPeakFrame = frame;
			}
		}
	}
	// Schedule beats
	for (var frame = 0; frame < frames; ++frame) {
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























