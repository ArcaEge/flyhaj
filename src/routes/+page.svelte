<script>
  import header from "$lib/assets/header.png";
  import globe from "$lib/assets/globe.png";
</script>

<div
  class="min-h-screen bg-[url('../lib/assets/space.jpg')] bg-cover bg-center bg-no-repeat"
>
  <div class="flex justify-center">
    <img class="w-150 pt-15" src={header} />
  </div>

  <div class="fixed bottom-0">
    <img class="w-2000" src={globe} />
  </div>
</div>
