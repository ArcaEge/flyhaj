<script lang="ts">
  import { onMount } from "svelte";
  import Quaternion from "quaternion";
  import { io } from "socket.io-client";

  const socket = io();

  socket.on("reset", reset);

  const THROW_JERK_THRESHOLD = 0.1;
  const THROW_ACCEL_THRESHOLD = 1.5;
  const THROW_END_JERK_THRESHOLD = 0.008;
  const LAND_JERK_THRESHOLD = 0.2;
  const DEBOUNCE_THROW_TIME_MS = 3000;

  let accel: number | null = $state(null);
  let accelY: number | null = $state(null);
  let maxAccel = $state(0);
  let accelTime = $state(0);

  // 0 = idle, 1 = throwing, 2 = wheeeee
  let phase = $state(0);

  let jerk = $state(0);
  let jerkY = $state(0);
  let maxJerk = $state(0);
  let firstJerk = $state(0);

  let lastThrowTime: number | null = $state(null);
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

  let oscillator: OscillatorNode | null = $state(null);
  let oscillatorState = false;

  onMount(async () => {
    const audioCtx = new AudioContext();

    function handleMotionEvent(event: any) {
      const currentAccel = Math.sqrt(
        event.acceleration.x ** 2 +
          event.acceleration.y ** 2 +
          event.acceleration.z ** 2
      );

      const lastTime = accelTime;
      accelTime = Date.now();

      if (accel !== null) {
        jerk = Math.abs(currentAccel - accel) * ((accelTime - lastTime) / 1000);
      }

      if (accelY !== null) {
        jerkY =
          Math.abs(event.acceleration.y - accelY) *
          ((accelTime - lastTime) / 1000);
      }

      // Phases
      let now = Date.now();
      if (phase === 0) {
        if (
          jerk > THROW_JERK_THRESHOLD &&
          currentAccel > THROW_ACCEL_THRESHOLD &&
          jerk < 100000 &&
          (!lastLandTime || now - lastLandTime >= DEBOUNCE_THROW_TIME_MS)
        ) {
          phase = 1;
          lastThrowTime = now;
        }
      } else if (phase === 1) {
        if (
          jerk < THROW_END_JERK_THRESHOLD &&
          7 <= currentAccel &&
          currentAccel <= 11
        ) {
          phase = 2;
        }
      } else if (phase === 2) {
        if (jerk > LAND_JERK_THRESHOLD && jerkY < 10000) {
          phase = 0;
          lastLandTime = now;

          airTime = lastThrowTime ? now - lastThrowTime : null;

          socket.emit("landed", { airTime })
        }
      }

      // Magic quarternion shit to calculate global acceleration
      const a = angleAlpha * (Math.PI / 180);
      const b = angleBeta * (Math.PI / 180);
      const g = angleGamma * (Math.PI / 180);

      const quarternion = Quaternion.fromEuler(a, b, -g, "ZXY").normalize();

      const [_rotatedAccelX, _rotatedAccelY, _rotatedAccelZ] =
        quarternion.rotateVector([
          event.acceleration.x,
          event.acceleration.y,
          event.acceleration.z,
        ]);

      rotatedAccelX = _rotatedAccelX;
      rotatedAccelY = _rotatedAccelY;
      rotatedAccelZ = _rotatedAccelZ;

      // console.log(currentAccel);

      if (7 <= currentAccel && currentAccel <= 13) {
        if (!oscillatorState) {
          oscillator = audioCtx.createOscillator();

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
          oscillator.connect(audioCtx.destination);

          oscillator.start();
          oscillatorState = true;
        }
      } else {
        if (oscillatorState && oscillator) {
          oscillator.stop();
          oscillatorState = false;
        }
      }

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
      if (
        jerk > 0.1 &&
        firstJerk === 0 &&
        accel < maxAccel - 0.1 &&
        jerk < 100000
      ) {
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

    window.addEventListener("devicemotion", handleMotionEvent);
    window.addEventListener("deviceorientation", handleOrientationEvent);
  });

  function reset() {
    accel = null;
    accelY = null;
    maxAccel = 0;
    accelTime = 0;

    phase = 0;

    jerk = 0;
    jerkY = 0;
    maxJerk = 0;
    firstJerk = 0;

    lastThrowTime = null;
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

<div
  class="p-2"
  class:bg-yellow-300={phase === 1}
  class:bg-green-300={phase === 2}
>
  <h2>Blahaj chucking thing</h2>

  <button
    class="block bg-amber-900 text-amber-50 p-2 my-2 rounded-lg"
    onclick={reset}>reset</button
  >

  accel: {accel}
  <br />
  max accel: {maxAccel}
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
  air time: {airTime ? airTime / 1000 + "s" : "chuck it first "}
</div>
