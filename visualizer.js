var canvas = document.getElementById('canvas');
var canvasContext = canvas.getContext('2d');

var graphs = [];
var render = function() {
	requestAnimationFrame(render);

	canvasContext.setTransform(1, 0, 0, 1, 0, 0);
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	canvasContext.strokeStyle = 'black';
	canvasContext.strokeRect(0, 0, canvas.width, canvas.height);

	var secondsElapsed = audioContext.currentTime - startTime;
	var currentSample = audioContext.sampleRate * secondsElapsed;
	var currentFrame = currentSample / frameSize;

	var zoom = 1;
	canvasContext.translate(-currentFrame * zoom, canvas.height);
	canvasContext.scale(zoom, -1);

	for (var graph = 0; graph < graphs.length; ++graph) {
		var data = graphs[graph].data;
		canvasContext.beginPath();
		canvasContext.moveTo(0, data[0]);
		for (var point = 1; point < data.length; ++point) {
			canvasContext.lineTo(point, data[point]);
		}
		canvasContext.strokeStyle = graphs[graph].color;
		canvasContext.stroke();
	}
};