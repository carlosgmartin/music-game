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










// Canvas element
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

var chart, chart2;
var render = function() {
	requestAnimationFrame(render);

	context.setTransform(1, 0, 0, 1, 0, 0);
	context.fillStyle = '#666';
	context.fillRect(0, 0, canvas.width, canvas.height);

	var seconds = audioContext.currentTime - startTime;
	var sample = audioContext.sampleRate * seconds;
	var frame = sample / 1024;

	var width = 10;

	context.translate(-frame * width, canvas.height);
	context.scale(width, -1);


	context.beginPath();
	for (var frame = 1; frame < chart.length; ++frame) {
		if (chart[frame] >= chart2[frame - 1]) {
			context.moveTo(frame, 0);
			context.lineTo(frame, canvas.height);
		}
	}
	context.strokeStyle = '#800';
	context.stroke();



	context.beginPath();
	for (var frame = 0; frame < chart2.length; ++frame) {
		context.moveTo(frame, 0);
		context.lineTo(frame, chart2[frame]);
	}
	context.strokeStyle = '#888';
	context.stroke();



	context.beginPath();
	for (var frame = 0; frame < chart.length; ++frame) {
		context.moveTo(frame, 0);
		context.lineTo(frame, chart[frame]);
	}
	context.strokeStyle = '#aaa';
	context.stroke();
};

var process = function(samples, sampleRate) {
	var samplesPerFrame = 1024;
	var frames = samples.length / samplesPerFrame;
	var energies = new Float32Array(frames);
	for (var frame = 0; frame < frames; ++frame) {
		var startSample = frame * samplesPerFrame;
		var endSample = (frame + 1) * samplesPerFrame;
		for (var sample = startSample; sample < endSample; ++sample) {
			energies[frame] += samples[sample] * samples[sample];
		}
	}
	chart = energies;

	var energyThresholds = new Float32Array(frames);
	var decayRate = .95;
	for (var frame = 1; frame < frames; ++frame) {
		if (energies[frame] / energyThresholds[frame - 1] > 1.2) {
			energyThresholds[frame] = energies[frame];

			var seconds = frame * samplesPerFrame / audioContext.sampleRate;
			setTimeout(function() { console.log('beat'); }, seconds * 1000);
		}
		else {
			energyThresholds[frame] = energyThresholds[frame - 1] * decayRate;
		}
	}
	chart2 = energyThresholds;

	render();
};