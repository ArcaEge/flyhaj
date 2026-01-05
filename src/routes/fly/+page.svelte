<script lang="ts">
  import { onMount } from "svelte";

  let accel = $state(0);
  let maxAccel = $state(0);

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
    }

    window.addEventListener("devicemotion", handleMotionEvent);
  });
</script>

<h1>Blahaj chucking thing</h1>

accel: {accel}
<br />
max accel: {maxAccel}
