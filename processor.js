var startTime = 0;
var frameSize = 1024;

var process = function(samples, sampleRate) {
	startTime = audioContext.currentTime;
	
	var energies = [];
	for (var sample = 0; sample < samples.length - frameSize; sample += frameSize) {
		var frameSamples = samples.slice(sample, sample + frameSize);
		var energy = 0;
		for (var frameSample = 0; frameSample < frameSamples.length; ++frameSample) {
			energy += frameSamples[frameSample] * frameSamples[frameSample];
		}
		energies.push(energy);
	}
	graphs.push({data: energies, color: 'red'});
	graphs.push({data: getSimpleMovingAverage(energies, 20), color: 'green'});

	render();
};

var getSimpleMovingAverage = function(data, range) {
	var movingAverage = new Float32Array(data.length);
	for (var point = 0; point < movingAverage.length; ++point) {
		var startPoint = Math.max(0, point - range);
		var endPoint = Math.min(data.length - 1, point + range);
		var sum = 0;
		for (var rangePoint = startPoint; rangePoint <= endPoint; ++rangePoint) {
			sum += data[rangePoint];
		}
		movingAverage[point] = sum / (endPoint - startPoint + 1);
	}
	return movingAverage;
};