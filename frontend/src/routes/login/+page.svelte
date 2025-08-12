<script>
	import { login } from '$lib/pocketbase.svelte.js';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex min-h-dvh items-center justify-center px-6">
	<div class="w-full max-w-sm space-y-4 rounded-lg border p-6">
		<h1 class="text-center text-xl font-semibold">Sign in to ChatBased</h1>
		<Button class="w-full" onclick={login}>Continue with Google</Button>
	</div>
</div>
