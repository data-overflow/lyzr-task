<script>
	import { theme, toggleTheme } from '$lib/data.svelte.js';
	import { pb, user, logout } from '$lib/pocketbase.svelte.js';
	import { currentOrg, organizationsStore } from '$lib/data.svelte.js';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
		SidebarProvider,
		SidebarInset,
		SidebarTrigger
	} from '$lib/components/ui/sidebar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import {
		Sun,
		Moon,
		Home,
		MessageSquare,
		Ticket,
		FileText,
		Settings,
		Rocket,
		ChevronDown
	} from '@lucide/svelte';
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

			// Check cache first
			const orgId = $page.params.id;
			if (organizationsStore.value[orgId]) {
				org = organizationsStore.value[orgId];
				currentOrg.set({ id: orgId, record: org });
			} else {
				org = await pb.collection('organizations').getOne(orgId);
				currentOrg.set({ id: orgId, record: org });
				// Cache the organization
				organizationsStore.set({
					...organizationsStore.value,
					[orgId]: org
				});
			}

			orgs = await pb.collection('organizations').getFullList({
				filter: `createdBy.id = "${pb.authStore.model?.id}"`,
				sort: '-created'
			});
			console.log('orgs', orgs);
		} catch (e) {
			console.error('failed to load org', e);
		}
	}

	// $effect(() => {
	// 	if ($page.params.id) {
	// 		loadOrg();
	// 	}
	// });

	onMount(() => {
		loadOrg();
	});

	$effect(() => {
		if ($page.params.id && $page.params.id !== currentOrg.value.id) {
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

<SidebarProvider>
	<Sidebar>
		<SidebarHeader>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger>
							<SidebarMenuButton>
								<span class="font-semibold">ChatBased</span>
								<span class="text-muted-foreground">/ {org?.displayName || org?.name || '...'}</span
								>
								<ChevronDown class="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent class="w-64">
							<div class="text-muted-foreground p-2 text-xs">Organizations</div>
							{#each orgs as o}
								<DropdownMenuItem onclick={() => goOrg(o.id)}>
									{o.displayName || o.name}
								</DropdownMenuItem>
							{/each}
							<div class="mt-2 border-t pt-2">
								<DropdownMenuItem>
									<a href="/organizations" class="w-full">Create or manage</a>
								</DropdownMenuItem>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>

		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Navigation</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild data-active={$page.url.pathname.includes('/playground')}>
								<a
									href="/dashboard/{currentOrg.value.id}/playground"
									class="flex w-full flex-row items-center gap-2 p-4"
								>
									<Home class="size-4" />
									<span>Playground</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild data-active={$page.url.pathname.includes('/tickets')}>
								<a
									href="/dashboard/{currentOrg.value.id}/tickets"
									class="flex w-full flex-row items-center gap-2 p-4"
								>
									<Ticket class="size-4" />
									<span>Tickets</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild data-active={$page.url.pathname.includes('/logs')}>
								<a
									href="/dashboard/{currentOrg.value.id}/logs"
									class="flex w-full flex-row items-center gap-2 p-4"
								>
									<MessageSquare class="size-4" />
									<span>Chat Logs</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild data-active={$page.url.pathname.includes('/deploy')}>
								<a
									href="/dashboard/{currentOrg.value.id}/deploy"
									class="flex w-full flex-row items-center gap-2 p-4"
								>
									<Rocket class="size-4" />
									<span>Deploy</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<SidebarMenuButton asChild data-active={$page.url.pathname.includes('/settings')}>
								<a
									href="/dashboard/{currentOrg.value.id}/settings"
									class="flex w-full flex-row items-center gap-2 p-4"
								>
									<Settings class="size-4" />
									<span>Settings</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	</Sidebar>

	<SidebarInset>
		<header class="flex h-14 items-center justify-between border-b px-4">
			<div class="flex items-center gap-2">
				<SidebarTrigger />
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
	</SidebarInset>
</SidebarProvider>
