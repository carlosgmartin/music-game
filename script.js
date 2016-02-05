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
	audioBufferSourceNode.start();

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
	for (var sample = 0; sample < data.length - frameSize; sample += frameSize) {
		// Get samples belonging to current frame
		var frameData = data.slice(sample, sample + frameSize);
		// Get current time in seconds
		var seconds = sample / audioBuffer.sampleRate;

    	fft.forward(frameData);
		console.log('Time ' + seconds + ': ' + fft.spectrum[0]);
	}
	console.log(audioBuffer.duration);
};
























