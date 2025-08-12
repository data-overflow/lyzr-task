<script>
	import { pb, user, logout } from '$lib/pocketbase.svelte.js';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent,
		CardFooter
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { currentOrg } from '$lib/data.svelte.js';
	import { onMount } from 'svelte';

	let organizations = $state([]);
	let loading = $state(true);
	let orgName = $state('');
	let error = $state('');

	async function fetchOrganizations() {
		loading = true;
		error = '';
		try {
			if (!pb.authStore.model?.id) {
				loading = false;
				return;
			}
			const records = await pb.collection('organizations').getFullList({
				filter: `createdBy.id = "${pb.authStore.model.id}"`,
				sort: '-created'
			});
			organizations = records;
		} catch (e) {
			error = 'Failed to load organizations';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchOrganizations();
	});

	async function createOrganization() {
		error = '';
		if (!orgName.trim()) return;
		try {
			const record = await pb.collection('organizations').create({
				name: orgName.trim(),
				displayName: orgName.trim(),
				createdBy: pb.authStore.model?.id || null
			});
			organizations = [record, ...organizations];
			orgName = '';
		} catch (e) {
			error = 'Failed to create organization';
			console.error(e);
		}
	}

	function openOrg(org) {
		currentOrg.set({ id: org.id, record: org });
		goto(`/dashboard/${org.id}`);
	}
</script>

<div class="mx-auto max-w-3xl space-y-8 px-6 py-10">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Your organizations</h1>
		<div class="flex items-center gap-2">
			{#if user.value}
				<button class="rounded-md border px-3 py-1.5" onclick={logout}>Logout</button>
			{:else}
				<button class="rounded-md border px-3 py-1.5" onclick={() => goto('/')}>Login</button>
			{/if}
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Create organization</CardTitle>
			<CardDescription>Start by creating your first organization.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex items-end gap-3">
				<div class="flex-1 space-y-1.5">
					<Label for="orgname">Organization name</Label>
					<Input id="orgname" placeholder="Acme Inc" bind:value={orgName} />
				</div>
				<Button onclick={createOrganization}>Create</Button>
			</div>
		</CardContent>
	</Card>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}

	{#if loading}
		<p>Loading...</p>
	{:else if organizations.length === 0}
		<p class="text-muted-foreground">No organizations yet. Create one above.</p>
	{:else}
		<ul class="grid gap-3">
			{#each organizations as org}
				<li>
					<Card>
						<CardContent class="flex items-center justify-between p-4">
							<div>
								<p class="font-medium">{org.displayName || org.name}</p>
								<p class="text-muted-foreground text-xs">{org.id}</p>
							</div>
							<Button variant="outline" onclick={() => openOrg(org)}>Open</Button>
						</CardContent>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</div>
