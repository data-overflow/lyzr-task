<script>
	import { theme, toggleTheme } from '$lib/data.svelte.js';
	import { pb, user, logout } from '$lib/pocketbase.svelte.js';
	import { currentOrg } from '$lib/data.svelte.js';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	// import { Toggle } from '$lib/components/ui/switch';
	import { Sun, Moon } from '@lucide/svelte';
	import { toggleMode } from 'mode-watcher';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { children } = $props();
	let org = $state(null);
	let orgs = $state([]);
	let menuOpen = $state(false);

	async function loadOrg() {
		try {
			console.log('data id', $page.params.id);
			if (!$page.params.id) return;
			org = await pb.collection('organizations').getOne($page.params.id);
			currentOrg.set({ id: $page.params.id, record: org });
			orgs = await pb.collection('organizations').getFullList({
				filter: `createdBy.id = "${pb.authStore.model?.id}"`,
				sort: '-created'
			});
			console.log('orgs', orgs);
		} catch (e) {
			console.error('failed to load org', e);
		}
	}

	$effect(() => {
		if ($page.params.id) {
			loadOrg();
		}
	});

	// onMount(() => {
	// 	loadOrg();
	// 	// console.log('user!!!!', user.value);
	// 	// console.log('pb.authStore.model', pb.authStore.model);
	// 	// console.log('pb.authStore', pb.authStore);
	// 	// console.log('pb.authStore.isValid', pb.authStore.isValid);
	// 	// console.log('pb.authStore.token', pb.authStore.token);
	// 	// console.log('pb.authStore.tokenExpire', pb.authStore.tokenExpire);
	// 	// console.log('pb.authStore.token', pb.authStore.token);
	// });

	function goOrg(orgId) {
		goto(`/dashboard/${orgId}`);
	}
</script>

<div class="grid min-h-dvh grid-cols-[240px_1fr]">
	<aside class="space-y-2 border-r p-4">
		<div class="text-muted-foreground text-sm">Navigation</div>
		<nav class="grid gap-1">
			<a class="hover:bg-muted rounded px-2 py-1.5" href="./{currentOrg.value.id}/playground"
				>Playground</a
			>
			<a class="hover:bg-muted rounded px-2 py-1.5" href="./{currentOrg.value.id}/tickets"
				>Tickets</a
			>
			<a class="hover:bg-muted rounded px-2 py-1.5" href="./{currentOrg.value.id}/logs">Chat logs</a
			>
			<a class="hover:bg-muted rounded px-2 py-1.5" href="./{currentOrg.value.id}/deploy">Deploy</a>
			<a class="hover:bg-muted rounded px-2 py-1.5" href="./{currentOrg.value.id}/settings"
				>Settings</a
			>
		</nav>
	</aside>
	<div class="flex min-h-dvh flex-col">
		<header class="flex h-14 items-center justify-between border-b px-4">
			<div class="relative flex items-center gap-2">
				<button class="font-semibold" onclick={() => (menuOpen = !menuOpen)}>
					ChatBased / {org?.displayName || org?.name || '...'}
				</button>
				{#if menuOpen}
					<div
						class="bg-background absolute left-0 top-full z-10 mt-1 w-64 rounded-md border shadow"
					>
						<div class="text-muted-foreground p-2 text-xs">Organizations</div>
						<ul class="max-h-60 overflow-auto">
							{#each orgs as o}
								<li>
									<button
										class="hover:bg-muted w-full px-3 py-2 text-left"
										onclick={() => {
											menuOpen = false;
											goOrg(o.id);
										}}
									>
										{o.displayName || o.name}
									</button>
								</li>
							{/each}
						</ul>
						<div class="border-t p-2">
							<a class="block rounded border px-2 py-1.5 text-center" href="/organizations"
								>Create or manage</a
							>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					aria-label="Toggle theme"
					onclick={() => toggleMode()}
				>
					<Sun class="size-4 dark:hidden" />

					<Moon class="hidden size-4 dark:block" />
				</Button>
				{#if user.value}
					<img
						alt="avatar"
						class="size-8 rounded-full border"
						referrerpolicy="no-referrer"
						src={user.value.googleAvatar}
					/>
				{/if}
				<Button variant="outline" onclick={logout}>Logout</Button>
			</div>
		</header>

		<main class="flex-1 p-4">
			{@render children()}
		</main>
	</div>
</div>
