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

<div class="fixed bottom-0">
    <img class="w-2000" src={globe}/>
</div>

<div class="fixed left-10 top-10 bg-blue-800 h-100 rounded-xl border border-blue-400">
    <h1 class=" p-5 font-sans font-extrabold text-blue-400">LeaderBoard</h1>
    <hr class="w-100% text-blue-400">
</div>
