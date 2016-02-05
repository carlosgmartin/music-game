// Canvas element
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
context.fillRect(0, 0, canvas.width, canvas.height);

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
var frameSize = 2048;
var processAudioBuffer = function(audioBuffer) {
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
			var difference = currentSpectrum[freq] - lastSpectrum[freq];
			if (difference > 0) {
				spectralFlux[frame] += difference;
			}
		}
		lastSpectrum = new Float32Array(currentSpectrum);
		++frame;
	}
	for (var frame = 0; frame < spectralFlux.length; ++frame) {
		if (spectralFlux[frame] > 2.3) {
			var seconds = frame * frameSize / audioBuffer.sampleRate;
			// console.log('Time ' + seconds + ': ' + spectralFlux[frame]);
			setTimeout(function() { console.log('beat'); }, seconds * 1000);
		}
	}
	audioBufferSourceNode.start();
};
























