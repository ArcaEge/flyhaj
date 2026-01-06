<script lang="ts">
  import { onMount } from "svelte";
  import Quaternion from "quaternion";

  let accel: number | null = $state(null);
  let maxAccel = $state(0);
  let accelTime = $state(0);

  let jerk = $state(0);
  let maxJerk = $state(0);
  let firstJerk = $state(0);

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

      if (accel !== null) {
        const lastTime = accelTime;
        accelTime = Date.now();
        jerk = Math.abs(currentAccel - accel) * ((accelTime - lastTime) / 1000);
      }

      // Magic quarternion shit to calculate global acceleration
      const a = angleAlpha * (Math.PI / 180);
      const b = angleBeta * (Math.PI / 180);
      const g = angleGamma * (Math.PI / 180);

      const quarternion = Quaternion.fromEuler(a, b, -g, "ZXY").normalize();

      const [accelX, accelY, accelZ] = quarternion.rotateVector([
        event.acceleration.x,
        event.acceleration.y,
        event.acceleration.z,
      ]);

      rotatedAccelX = accelX;
      rotatedAccelY = accelY;
      rotatedAccelZ = accelZ;

      // console.log(currentAccel);

      if (7 <= currentAccel && currentAccel <= 13) {
        if (!oscillatorState) {
          oscillator = audioCtx.createOscillator();

          oscillator.type = "square";
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

      velX += accelX * (event.interval / 1000);
      velY += accelY * (event.interval / 1000);
      velZ += accelZ * (event.interval / 1000);
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

    window.addEventListener("devicemotion", handleMotionEvent);
    window.addEventListener("deviceorientation", handleOrientationEvent);
  });
</script>

<div class="m-2">
  <h2>Blahaj chucking thing</h2>

  <button class="block bg-amber-900 text-amber-50 p-2 my-2 rounded-lg"
    >do the whee whee</button
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
</div>
