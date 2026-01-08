<script lang="ts">
	import { onMount } from 'svelte';
	import Quaternion from 'quaternion';
	import { io } from 'socket.io-client';
	import euan from '$lib/assets/euanbread.jpg';

	// Sounds
	import comment1 from '$lib/assets/sounds/comment/1.mp3?url';
	import comment2 from '$lib/assets/sounds/comment/2.mp3?url';
	import comment3 from '$lib/assets/sounds/comment/3.mp3?url';
	import comment4 from '$lib/assets/sounds/comment/4.mp3?url';
	import comment5 from '$lib/assets/sounds/comment/5.mp3?url';
	import comment6 from '$lib/assets/sounds/comment/6.mp3?url';
	import comment7 from '$lib/assets/sounds/comment/7.mp3?url';
	import fly1 from '$lib/assets/sounds/fly/1.mp3?url';
	import fly2 from '$lib/assets/sounds/fly/2.mp3?url';
	import fly3 from '$lib/assets/sounds/fly/3.mp3?url';
	import fly4 from '$lib/assets/sounds/fly/4.mp3?url';
	import fly5 from '$lib/assets/sounds/fly/5.mp3?url';
	import fly6 from '$lib/assets/sounds/fly/6.mp3?url';
	import fly7 from '$lib/assets/sounds/fly/7.mp3?url';
	import fly8 from '$lib/assets/sounds/fly/8.mp3?url';
	import moan1 from '$lib/assets/sounds/moan/1.mp3?url';
	import moan2 from '$lib/assets/sounds/moan/2.mp3?url';
	import moan3 from '$lib/assets/sounds/moan/3.mp3?url';
	import moan4 from '$lib/assets/sounds/moan/4.mp3?url';
	import moan5 from '$lib/assets/sounds/moan/5.mp3?url';

	const socket = io();
	socket.emit('phone');

	socket.on('reset', reset);

	const THROW_JERK_THRESHOLD = 0.05;
	const THROW_MAX_JERK_THRESHOLD = 0.6;
	const THROW_ACCEL_THRESHOLD = 3.5;
	const THROW_END_JERK_THRESHOLD = 0.008;
	const LAND_JERK_THRESHOLD = 0.2;
	const DEBOUNCE_THROW_TIME_MS = 2500;
	const MAX_THROW_TIME_MS = 500;
	const MIN_THROW_TIME_MS = 50;
	const MAX_FLY_TIME_MS = 2000;
	const MIN_FLY_TIME_MS = 120;

	let accel: number | null = $state(null);
	let accelY: number | null = $state(null);
	let maxAccel = $state(0);
	let avgAccel = $state(0);
	let accelTime = $state(0);

	// 0 = idle, 1 = throwing, 2 = wheeeee
	let phase = $state(0);

	let leoMode = $state(false);
	socket.on('moan', () => {
		leoMode = true;
	});
	socket.on('nomoan', () => {
		leoMode = false;
	});

	let jerk = $state(0);
	let jerkY = $state(0);
	let maxJerk = $state(0);
	let firstJerk = $state(0);

	let lastThrowTime: number | null = $state(null);
	let lastThrowEndTime: number | null = $state(null);
	let lastLandTime: number | null = $state(null);
	let airTime: number | null = $state(null);

	let angleAlpha = $state(0);
	let angleBeta = $state(0);
	let angleGamma = $state(0);

	let rotatedAccelX = $state(0);
	let rotatedAccelY = $state(0);
	let rotatedAccelZ = $state(0);

	let rotatedAccelXMax = $state(0);
	let rotatedAccelYMax = $state(0);
	let rotatedAccelZMax = $state(0);

	let velX = $state(0);
	let velY = $state(0);
	let velZ = $state(0);
	let velOverall = $state(0);

	let velXMax = $state(0);
	let velYMax = $state(0);
	let velZMax = $state(0);
	let velOverallMax = $state(0);

	onMount(async () => {
		const audioCtx = new AudioContext();

		const AUDIO_COMMENT = [
			await getAudioBuffer(comment1),
			await getAudioBuffer(comment2),
			await getAudioBuffer(comment3),
			await getAudioBuffer(comment4),
			await getAudioBuffer(comment5),
			await getAudioBuffer(comment6),
			await getAudioBuffer(comment7)
		];
		const AUDIO_FLY = [
			await getAudioBuffer(fly1),
			await getAudioBuffer(fly2),
			await getAudioBuffer(fly3),
			await getAudioBuffer(fly4),
			await getAudioBuffer(fly5),
			await getAudioBuffer(fly6),
			await getAudioBuffer(fly7),
			await getAudioBuffer(fly8)
		];
		const AUDIO_MOAN = [
			await getAudioBuffer(moan1),
			await getAudioBuffer(moan2),
			await getAudioBuffer(moan3),
			await getAudioBuffer(moan4),
			await getAudioBuffer(moan5)
		];

		let currentFlyingAudioSource: AudioBufferSourceNode | null = null;

		function handleMotionEvent(event: any) {
			const currentAccel = Math.sqrt(
				event.acceleration.x ** 2 + event.acceleration.y ** 2 + event.acceleration.z ** 2
			);

			const lastTime = accelTime;
			accelTime = Date.now();

			if (accel !== null) {
				jerk = Math.abs(currentAccel - accel) * ((accelTime - lastTime) / 1000);
			}

			if (accelY !== null) {
				jerkY = Math.abs(event.acceleration.y - accelY) * ((accelTime - lastTime) / 1000);
			}

			if (avgAccel === 0) avgAccel = currentAccel;
			avgAccel = currentAccel * 0.15 + avgAccel * 0.85;

			// Phases
			let now = Date.now();
			if (phase === 0) {
				// idle
				currentFlyingAudioSource?.stop();

				if (
					jerk > THROW_JERK_THRESHOLD &&
					jerk < THROW_MAX_JERK_THRESHOLD &&
					currentAccel > THROW_ACCEL_THRESHOLD &&
					(!lastLandTime || now - lastLandTime >= DEBOUNCE_THROW_TIME_MS)
				) {
					phase = 1;
					lastThrowTime = now;

					socket.emit('throw');
				}
			} else if (phase === 1) {
				// throwing
				if (
					jerk < THROW_END_JERK_THRESHOLD &&
					5 <= avgAccel &&
					avgAccel <= 12 &&
					now - lastThrowTime! > MIN_THROW_TIME_MS
				) {
					phase = 2;
					lastThrowEndTime = now;

					socket.emit('fly');

					let audioArr = leoMode ? AUDIO_MOAN : AUDIO_FLY;
					let currentFlyingAudio = Math.floor(Math.random() * audioArr.length);
					currentFlyingAudioSource = getAudioSource(audioArr[currentFlyingAudio]);
					currentFlyingAudioSource.start();
				}

				if (now - lastThrowTime! > MAX_THROW_TIME_MS) {
					phase = 0;
					socket.emit('land', { cancelled: true });
				}
			} else if (phase === 2) {
				// flying
				if ((jerk > LAND_JERK_THRESHOLD && jerkY < 10000) || avgAccel < 8 || avgAccel > 12) {
					phase = 0;

					airTime = now - lastThrowEndTime!;
					const valid = airTime > MIN_FLY_TIME_MS;

					if (valid) lastLandTime = now;

					socket.emit('land', {
						airTime,
						throwTime: lastThrowEndTime! - lastThrowTime!,
						valid,
						cancelled: false
					});
				}

				if (now - lastThrowEndTime! > MAX_FLY_TIME_MS) {
					phase = 0;

					socket.emit('land', {
						cancelled: true
					});
				}
			}

			// if (phase !== 0) {
			// 	socket.emit(
			// 		'data',
			// 		`${now},${rotatedAccelX},${rotatedAccelY},${rotatedAccelZ},${currentAccel}`
			// 	);
			// }

			// Magic quarternion shit to calculate global acceleration
			const a = angleAlpha * (Math.PI / 180);
			const b = angleBeta * (Math.PI / 180);
			const g = angleGamma * (Math.PI / 180);

			const quarternion = Quaternion.fromEuler(a, b, -g, 'ZXY').normalize();

			const [_rotatedAccelX, _rotatedAccelY, _rotatedAccelZ] = quarternion.rotateVector([
				event.acceleration.x,
				event.acceleration.y,
				event.acceleration.z
			]);

			rotatedAccelX = _rotatedAccelX;
			rotatedAccelY = _rotatedAccelY;
			rotatedAccelZ = _rotatedAccelZ;

			// console.log(currentAccel);

			// if (7 <= currentAccel && currentAccel <= 13) {
			// 	if (!oscillatorState) {
			// 		oscillator = audioCtx.createOscillator();

			// 		oscillator.type = 'sine';
			// 		oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
			// 		oscillator.connect(audioCtx.destination);

			// 		oscillator.start();
			// 		oscillatorState = true;
			// 	}
			// } else {
			// 	if (oscillatorState && oscillator) {
			// 		oscillator.stop();
			// 		oscillatorState = false;
			// 	}
			// }

			if (Math.abs(rotatedAccelX) > rotatedAccelXMax) {
				rotatedAccelXMax = Math.abs(rotatedAccelX);
			}
			if (Math.abs(rotatedAccelY) > rotatedAccelYMax) {
				rotatedAccelYMax = Math.abs(rotatedAccelY);
			}
			if (Math.abs(rotatedAccelZ) > rotatedAccelZMax) {
				rotatedAccelZMax = Math.abs(rotatedAccelZ);
			}

			velX += rotatedAccelX * (event.interval / 1000);
			velY += rotatedAccelY * (event.interval / 1000);
			velZ += rotatedAccelZ * (event.interval / 1000);
			velOverall = Math.sqrt(velX ** 2 + velY ** 2 + velZ ** 2);

			if (Math.abs(velX) > velXMax) {
				velXMax = Math.abs(velX);
			}
			if (Math.abs(velY) > velYMax) {
				velYMax = Math.abs(velY);
			}
			if (Math.abs(velZ) > velZMax) {
				velZMax = Math.abs(velZ);
			}
			if (Math.abs(velOverall) > velOverallMax) {
				velOverallMax = Math.abs(velOverall);
			}

			accel = currentAccel;
			accelY = event.acceleration.y;

			if (accel > maxAccel) {
				maxAccel = accel;
			}
			// jank asf
			if (jerk > maxJerk && jerk < 100000) {
				maxJerk = jerk;
			}
			if (jerk > 0.1 && firstJerk === 0 && accel < maxAccel - 0.1 && jerk < 100000) {
				firstJerk = maxJerk;
			}

			// velX += event.accelerationIncludingGravity.x * (event.interval / 1000);
			// velY += event.accelerationIncludingGravity.y * (event.interval / 1000);
			// velZ += event.accelerationIncludingGravity.z * (event.interval / 1000);
		}

		function handleOrientationEvent(event: any) {
			angleAlpha = event.alpha;
			angleBeta = event.beta;
			angleGamma = event.gamma;
		}

		async function getAudioBuffer(url: string) {
			const response = await fetch(url);
			const arrayBuffer = await response.arrayBuffer();
			return await audioCtx.decodeAudioData(arrayBuffer);
		}

		function getAudioSource(buffer: AudioBuffer) {
			const source = audioCtx.createBufferSource();
			source.buffer = buffer;
			source.connect(audioCtx.destination);
			return source;
		}

		window.addEventListener('devicemotion', handleMotionEvent);
		window.addEventListener('deviceorientation', handleOrientationEvent);
	});

	function reset() {
		accel = null;
		accelY = null;
		maxAccel = 0;
		avgAccel = 0;
		accelTime = 0;

		phase = 0;

		jerk = 0;
		jerkY = 0;
		maxJerk = 0;
		firstJerk = 0;

		lastThrowTime = null;
		lastThrowEndTime = null;
		lastLandTime = null;
		airTime = null;

		angleAlpha = 0;
		angleBeta = 0;
		angleGamma = 0;

		rotatedAccelX = 0;
		rotatedAccelY = 0;
		rotatedAccelZ = 0;

		rotatedAccelXMax = 0;
		rotatedAccelYMax = 0;
		rotatedAccelZMax = 0;

		velX = 0;
		velY = 0;
		velZ = 0;
		velOverall = 0;

		velXMax = 0;
		velYMax = 0;
		velZMax = 0;
		velOverallMax = 0;
	}
</script>

<div class="absolute top-0 left-0 w-full h-full bg-white"></div>

<img src={euan} class="absolute top-0 left-0 w-full h-full opacity-60" alt="euan" />

<div
	class="p-2 z-5 absolute w-full"
	class:bg-yellow-300={phase === 1}
	class:bg-green-300={phase === 2}
>
	<h2>Blahaj chucking thing</h2>

	<button class="block bg-amber-900 text-amber-50 p-2 my-2 rounded-lg" onclick={reset}>reset</button
	>

	accel: {accel}
	<br />
	max accel: {maxAccel}
	<br />
	average accel of airtime: {avgAccel}
	<br />
	<br />
	jerk: {jerk}
	<br />
	max jerk: {maxJerk}
	<br />
	first jerk: {firstJerk}
	<br />
	<br />
	alpha: {angleAlpha}
	<br />
	beta: {angleBeta}
	<br />
	gamma: {angleGamma}
	<br />
	<br />
	x max: {rotatedAccelXMax}
	<br />
	y max: {rotatedAccelYMax}
	<br />
	z max: {rotatedAccelZMax}
	<br />
	<br />
	x velocity: {velX}
	<br />
	y velocity: {velY}
	<br />
	z velocity: {velZ}
	<br />
	overall velocity: {velOverall}
	<br />
	<br />
	x velocity max: {velXMax}
	<br />
	y velocity max: {velYMax}
	<br />
	z velocity max: {velZMax}
	<br />
	overall velocity max: {velOverallMax}
	<br />
	<br />
	air time: {airTime ? airTime / 1000 + 's' : 'chuck it first '}
</div>
