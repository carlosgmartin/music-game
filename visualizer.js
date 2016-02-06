// Get the canvas element
var canvas = document.getElementById('visualizer');
var canvasContext = canvas.getContext('2d');

var graphs = [];
var render = function() {
	// Schedule next animation frame
	requestAnimationFrame(render);

	// Clear canvas and draw canvas outline
	canvasContext.setTransform(1, 0, 0, 1, 0, 0);
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	canvasContext.strokeStyle = 'black';
	canvasContext.strokeRect(0, 0, canvas.width, canvas.height);

	// Find current frame in audio based on elapsed time
	var secondsElapsed = audioContext.currentTime - startTime;
	var currentSample = audioContext.sampleRate * secondsElapsed;
	var currentFrame = currentSample / frameSize;

	var zoom = 1;
	canvasContext.translate(-currentFrame * zoom, canvas.height);
	canvasContext.scale(zoom, -1);

	// Plot graphs
	for (var i = 0; i < graphs.length; ++i) {
		var data = graphs[i].data;
		canvasContext.beginPath();
		canvasContext.moveTo(0, data[0]);
		for (var j = 1; j < data.length; ++j) {
			canvasContext.lineTo(j, data[j]);
		}
		canvasContext.strokeStyle = graphs[i].color;
		canvasContext.stroke();
	}
};