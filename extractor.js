// Create an audio context and source node
var audioContext = new AudioContext();
var audioBufferSourceNode = audioContext.createBufferSource();
var startTime = 0;

// Create a file reader and extract audio samples
var fileReader = new FileReader();
var decodeSuccessCallback = function(audioBuffer) {
	// Send audio samples to processor
	process(audioBuffer.getChannelData(0), audioBuffer.sampleRate);

	// Play audio
	audioBufferSourceNode.disconnect();
	audioBufferSourceNode = audioContext.createBufferSource();
	audioBufferSourceNode.buffer = audioBuffer;
	audioBufferSourceNode.connect(audioContext.destination);
	audioBufferSourceNode.start();

	// Record current time as audio start time
	startTime = audioContext.currentTime;
};
var decodeErrorCallback = function() {
	console.log('Error decoding audio data');
};
fileReader.addEventListener('load', function() {
	// Extract audio samples
	var arrayBuffer = fileReader.result;
	audioContext.decodeAudioData(arrayBuffer, decodeSuccessCallback, decodeErrorCallback);
});
fileReader.addEventListener('error', function() {
	console.log('Error reading file');
});

// Set action for input element on input change
var input = document.getElementById('input');
input.addEventListener('change', function() {
	fileReader.readAsArrayBuffer(input.files[0]);
});