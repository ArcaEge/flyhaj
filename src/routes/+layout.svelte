<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Flyhaj</title>

</svelte:head>
<div class="min-h-screen bg-[url('../lib/assets/space.jpg')] bg-cover bg-center bg-no-repeat">
  	{@render children()}
</div>
