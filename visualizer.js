// Get the visualizer element
var visualizer = document.getElementById('visualizer');
var visualizerContext = visualizer.getContext('2d');

var graphs = [];
var render = function() {
	// Schedule next animation frame
	requestAnimationFrame(render);

	// Clear visualizer and draw visualizer outline
	visualizerContext.setTransform(1, 0, 0, 1, 0, 0);
	visualizerContext.clearRect(0, 0, visualizer.width, visualizer.height);
	visualizerContext.strokeStyle = 'black';
	visualizerContext.strokeRect(0, 0, visualizer.width, visualizer.height);

	// Find current frame in audio based on elapsed time
	var secondsElapsed = audioContext.currentTime - startTime;
	var currentSample = audioContext.sampleRate * secondsElapsed;
	var currentFrame = currentSample / frameOffset;

	// Adjust zoom level for visualizerion
	var zoom = 1;
	visualizerContext.translate(-currentFrame * zoom, visualizer.height);
	visualizerContext.scale(zoom, -1);

	// Plot graphs
	for (var i = 0; i < graphs.length; ++i) {
		var data = graphs[i].data;
		visualizerContext.beginPath();
		visualizerContext.moveTo(0, data[0]);
		for (var j = 1; j < data.length; ++j) {
			visualizerContext.lineTo(j, data[j]);
		}
		visualizerContext.strokeStyle = graphs[i].color;
		visualizerContext.stroke();
	}
};