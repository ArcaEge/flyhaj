<script lang="ts">
	import header from '$lib/assets/header.png';
	import globe from '$lib/assets/globe.png';
	import { io } from 'socket.io-client';

	const socket = io();
	socket.emit('laptop');

	// @ts-ignore
	let state = $state('idle');
	let name = $state('');
	let lastData: any = $state(null);
	let leaderboard: [any] = $state([]);

	socket.on('throw', () => {
		state = 'thrown';
	});
	socket.on('fly', () => {
		state = 'flying';
	});
	socket.on('land', (data) => {
		state = 'idle';

		if (data.valid && data.cancelled === false) {
			lastData = data;
		}
	});
</script>

<div class="flex flex-row justify-between"></div>
<div
	class="min-h-screen bg-[url('../lib/assets/space.jpg')] bg-center bg-no-repeat flex flex-row justify-between"
>
	<div>
		<div class="top-25 flex flex-row p-10">
			<img class="w-1/3 h-fit" src={header} />
			<div class="pl-5">
				<div class="bg-blue-800 rounded-xl border border-blue-400 h-90">
					<h1 class="p-5 font-sans font-extrabold text-blue-400">Leaderboard</h1>
					<hr class="w-100% text-blue-400" />
					<div class="p-3 flex flex-col gap-3 max-h-64 overflow-scroll">
						{#each leaderboard as item}
							<div class="bg-blue-500 p-3 rounded-lg flex flex-row justify-between text-blue-50">
								<p>
									{item.name}
								</p>
								<p>
									{item.airTime}
								</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<img class="bottom-0 h-1/2 p-10 w-2/3" src={globe} />
	</div>

	<div class="absolute right-0 p-10 h-full w-1/3">
		<div class="flex flex-col justify-between">
			<div class="bg-blue-800 h-90 rounded-xl border border-blue-400">
				<h1 class="p-5 font-sans font-extrabold text-blue-400">Enter name</h1>
				<hr class="w-100% text-blue-400" />
				<div class="flex flex-col gap-3 p-3">
					<label class="w-full flex">
						<input type="text" bind:value={name} class="p-3 grow rounded-lg bg-blue-500 text-blue-50" />
					</label>
					<p class="text-xl text-blue-50">Score: {lastData?.airTime ?? 'N/A'}</p>
					<button
						class="button"
						disabled={lastData === null}
						onclick={() => {
							leaderboard.push({ ...lastData, name });
							lastData = null;
							leaderboard.sort((a, b) => {
								return b.airTime - a.airTime;
							});
						}}>Add to leaderboard</button
					>
				</div>
			</div>
			<div class="h-10"></div>
			<div class="bg-blue-800 h-90 rounded-xl border border-blue-400">
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
				<label class="grid grid-cols-2 p-3 gap-3">
					<input
						type="checkbox"
						onchange={(e) => {
							const el = /** @type {HTMLInputElement} */ (e.currentTarget);
							if (el.checked) socket.emit('active');
							else socket.emit('inactive');
						}}
					/>
					<p class="text-lg text-blue-50 flex justify-center items-center">Active</p>
				</label>
				<label class="grid grid-cols-2 p-3 gap-3">
					<input
						type="checkbox"
						onchange={(e) => {
							const el = /** @type {HTMLInputElement} */ (e.currentTarget);
							if (el.checked) socket.emit('moan');
							else socket.emit('nomoan');
						}}
					/>
					<p class="text-lg text-blue-50 flex justify-center items-center">Leo mode</p>
				</label>
			</div>
		</div>
	</div>
</div>
