<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { theme } from '$lib/data.svelte.js';
	import { browser } from '$app/environment';
	import { ModeWatcher } from 'mode-watcher';
	import { pb, user } from '$lib/pocketbase.svelte.js';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';

	// if (browser) {
	// 	const saved = localStorage.getItem('theme');
	// 	if (saved === 'dark' || saved === 'light') {
	// 		theme.value = saved;
	// 	}
	// 	$effect(() => {
	// 		localStorage.setItem('theme', theme.value);
	// 	});
	// }

	onMount(() => {
		if (pb.authStore.isValid) {
			user.set(pb.authStore.model);
		}
	});

	// $inspect(pb.authStore);
	// $inspect(user.value);

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster />
{@render children?.()}
