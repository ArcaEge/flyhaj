<script lang="ts">
  import { onMount } from "svelte";
  import Quaternion from "quaternion";

  let accel = $state(0);
  let maxAccel = $state(0);

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

  onMount(() => {
    function handleMotionEvent(event: any) {
      accel = Math.sqrt(
        event.acceleration.x ** 2 +
          event.acceleration.y ** 2 +
          event.acceleration.z ** 2
      );

      if (accel > maxAccel) {
        maxAccel = accel;
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

<h1>Blahaj chucking thing</h1>

accel: {accel}
<br />
max accel: {maxAccel}
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
