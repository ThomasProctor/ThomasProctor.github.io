async function onCollision() {
	await stopRoll();
	await delay(1.5);
	setMainLed({
		r: 0,
		g: 0,
		b: 255
	});
	var heading = (getHeading() + 135 + Math.random() * 90)
	setHeading(heading);
	await delay(0.5);
	setMainLed({
		r: Math.sin(heading) * 255,
		g: Math.cos(heading) * 255,
		b: 0
	});
	setSpeed(200);
}

registerEvent(EventType.onCollision, onCollision);
async function startProgram() {
	setSpeed(200);
}
