<script>
	import header from '$lib/assets/header.png';
	import globe from '$lib/assets/globe.png';
	import { io } from 'socket.io-client';

	const socket = io();
	socket.emit('laptop');

	let state = $state('idle');

	socket.on('throw', () => {
		state = 'thrown';
	});
	socket.on('fly', () => {
		state = 'flying';
	});
	socket.on('land', () => {
		state = 'idle';
	});
</script>

<div class="min-h-screen bg-[url('../lib/assets/space.jpg')] bg-cover bg-center bg-no-repeat">
	<div class="flex justify-center">
		<img class="w-150 pt-15" src={header} />
	</div>

	<div class="absolute bottom-0">
		<img class="w-2000" src={globe} />
	</div>
</div>

<div class="absolute bottom-0">
	<img class="w-2000" src={globe} />
</div>

<div class="absolute top-0 p-10 w-full">
	<div class="flex flex-row justify-between">
		<div class="bg-blue-800 h-100 rounded-xl border border-blue-400">
			<h1 class="p-5 font-sans font-extrabold text-blue-400">Leaderboard</h1>
			<hr class="w-100% text-blue-400" />
		</div>
		<div class="bg-blue-800 h-100 rounded-xl border border-blue-400">
			<h1 class="p-5 font-sans font-extrabold text-blue-400">Clicky stuff</h1>
			<hr class="w-100% text-blue-400" />
			<div class="grid grid-cols-2 p-3 gap-3">
				<button
					class="button"
					onclick={() => {
						socket.emit('reset');
					}}>Reset phone state</button
				>
				<p class="text-lg text-blue-50 flex justify-center items-center">State: {state}</p>
			</div>
		</div>
	</div>
</div>
