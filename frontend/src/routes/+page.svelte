<script>
	import { goto } from '$app/navigation';
	import { login } from '$lib/pocketbase.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ThemeButton from '$lib/themeButton.svelte';
	function goToDashboard() {
		goto('/organizations');
	}
</script>

<div class="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
	<div class="absolute right-4 top-4">
		<ThemeButton />
	</div>
	<div>
		<h1 class="text-4xl font-bold tracking-tight">Chat<b>Based</b></h1>
		<p class="text-muted-foreground mt-2 max-w-prose text-balance">
			Open-source alternative to Chatbase. Easily add AI chatbots to your website.
		</p>
	</div>

	<div class="flex gap-3">
		<Button onclick={login}>Continue with Google</Button>
		<Button variant="outline" onclick={goToDashboard}>Explore dashboard</Button>
	</div>
</div>
