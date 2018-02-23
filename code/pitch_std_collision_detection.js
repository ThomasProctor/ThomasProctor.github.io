function sample_std(array) {
	var len = array.length;
	var sum = array.reduce(sumation);
	var mean = sum / len;
	var centered = array.map(x => x - mean);
	var squared = centered.map(x => Math.pow(x, 2));
	var sum_of_squares = squared.reduce(sumation);
	return Math.sqrt((1 / (len - 1.5) * sum_of_squares));
}

function square(number) {
	Math.pow(number, 2);
}

function sumation(total, number) {
	return total + number;
}

function turnOffLED() {
	setMainLed({
		r: 0,
		g: 0,
		b: 0
	});
}

async function flashPrimaryColors() {
	var red = {
		r: 255,
		g: 0,
		b: 0
	};
	var green = {
		r: 0,
		g: 255,
		b: 0
	};
	var blue = {
		r: 0,
		g: 0,
		b: 255
	};
	setMainLed(red);
	await delay(0.75);
	setMainLed(green);
	await delay(0.75);
	setMainLed(blue);
	await delay(0.75);
}

async function collectPitchDeltaStd(time) {
	var time_delta = 0.05;
	var n_samples = time / time_delta;
	var pitch_deltas = [];
	for (var sampled = 0; sampled < n_samples; sampled++) {
		pitch_deltas.push(getGyroscope().pitch);
		await delay(time_delta);
	}
	return sample_std(pitch_deltas);
}

async function turnAround() {
	await stopRoll();
	await delay(1.5);
	var heading = (getHeading() + 105 + Math.random() * 130)
	setHeading(heading);
	await delay(0.5);
	setMainLed({
		r: Math.sin(heading) * 255,
		g: Math.cos(heading) * 255,
		b: 0
	});
	setSpeed(200);
}

async function onCollision() {
	setMainLed({r: 255, g: 0, b: 0});
	await turnAround();
}

registerEvent(EventType.onCollision, onCollision);
async function startProgram() {
	setHeading(0);
	await delay(0.1);
	setSpeed(200);
	var not_stuck = true;
	var pitch_delta_std;
	while (true) {
		pitch_delta_std = await collectPitchDeltaStd(8);
		if (pitch_delta_std > 250) {
			not_stuck = false;
			await stopRoll();
			await flashPrimaryColors();
			await turnAround();
		}
	}
	turnOffLED();
}
