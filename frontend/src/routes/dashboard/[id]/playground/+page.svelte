<script>
	import { page } from '$app/stores';
	import { pb, user } from '$lib/pocketbase.svelte.js';
	import { currentOrg, organizationsStore } from '$lib/data.svelte.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { CustomSelect } from '$lib/components/ui/custom-select';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Label } from '$lib/components/ui/label';
	import { Loader2, Save, RefreshCw } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let org = $state(null);
	let loading = $state(true);
	let saving = $state(false);
	let activeTab = $state('instructions');
	let iframeKey = $state(0); // For forcing iframe refresh

	// Form state
	let formData = $state({
		systemInstruction: '',
		additionalInstruction: '',
		displayName: '',
		inititialMessage: '',
		messagePlaceholder: '',
		primaryColor: '#3b82f6',
		backgroundColor: '#ffffff',
		userMessageColor: '#dbeafe',
		botMessageColor: '#f3f4f6',
		chatBubbleColor: '#3b82f6',
		chatBubbleAlign: 'right_bottom',
		chatWidgetAlign: 'right-align'
	});

	async function loadOrganization() {
		try {
			loading = true;
			// Check cache first
			const orgId = $page.params.id;
			if (organizationsStore.value[orgId]) {
				const orgData = organizationsStore.value[orgId];
				org = orgData;
				populateFormData(orgData);
				loading = false;
				return;
			}

			const orgData = await pb.collection('organizations').getOne(orgId);
			org = orgData;

			// Cache the organization
			organizationsStore.set({
				...organizationsStore.value,
				[orgId]: orgData
			});

			populateFormData(orgData);
		} catch (error) {
			console.error('Failed to load organization:', error);
			toast.error('Failed to load organization data');
		} finally {
			loading = false;
		}
	}

	function populateFormData(orgData) {
		// Populate form with existing data
		formData = {
			systemInstruction: orgData.systemInstruction || '',
			additionalInstruction: orgData.additionalInstruction || '',
			displayName: orgData.displayName || '',
			inititialMessage:
				orgData.inititialMessage || "Hi! I'm your AI assistant. How can I help you today?",
			messagePlaceholder: orgData.messagePlaceholder || 'Type your message...',
			primaryColor: orgData.primaryColor || '#3b82f6',
			backgroundColor: orgData.backgroundColor || '#ffffff',
			userMessageColor: orgData.userMessageColor || '#dbeafe',
			botMessageColor: orgData.botMessageColor || '#f3f4f6',
			chatBubbleColor: orgData.chatBubbleColor || '#3b82f6',
			chatBubbleAlign: orgData.chatBubbleAlign || 'right_bottom',
			chatWidgetAlign: orgData.chatWidgetAlign || 'right-align'
		};
	}

	async function saveChanges() {
		try {
			saving = true;
			const updatedOrg = await pb.collection('organizations').update($page.params.id, formData);
			toast.success('Settings saved successfully!');

			// Update cache with new data
			organizationsStore.set({
				...organizationsStore.value,
				[$page.params.id]: updatedOrg
			});

			// Update current org state
			org = updatedOrg;
			currentOrg.set({ id: $page.params.id, record: updatedOrg });

			// Refresh iframe
			iframeKey += 1;
		} catch (error) {
			console.error('Failed to save changes:', error);
			toast.error('Failed to save changes');
		} finally {
			saving = false;
		}
	}

	// $effect(() => {
	// 	if ($page.params.id) {
	// 		loadOrganization();
	// 	}
	// });
	onMount(() => {
		loadOrganization();
	});

	$effect(() => {
		if ($page.params.id && $page.params.id !== currentOrg.value.id) {
			loadOrganization();
		}
	});
</script>

<div class="flex h-full flex-col gap-6 lg:flex-row">
	<!-- Left Panel - Settings -->
	<div class="w-full min-w-0 lg:w-1/2">
		<div class="mb-4 flex items-center justify-between">
			<h1 class="text-2xl font-bold">Playground</h1>
			<Button onclick={saveChanges} disabled={saving || loading}>
				{#if saving}
					<Loader2 class="mr-2 size-4 animate-spin" />
				{:else}
					<Save class="mr-2 size-4" />
				{/if}
				Save Changes
			</Button>
		</div>

		{#if loading}
			<div class="flex items-center justify-center py-8">
				<Loader2 class="size-6 animate-spin" />
				<span class="ml-2">Loading settings...</span>
			</div>
		{:else}
			<Tabs bind:value={activeTab} class="w-full">
				<TabsList class="grid w-full grid-cols-3">
					<TabsTrigger value="instructions">Instructions</TabsTrigger>
					<TabsTrigger value="content">Content</TabsTrigger>
					<TabsTrigger value="style">Style</TabsTrigger>
				</TabsList>

				<!-- Instructions Tab -->
				<TabsContent value="instructions" class="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>AI Instructions</CardTitle>
							<CardDescription>
								Configure how your AI assistant behaves and responds to customers.
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="space-y-2">
								<Label for="systemInstruction">System Instruction</Label>
								<Textarea
									id="systemInstruction"
									bind:value={formData.systemInstruction}
									placeholder="Enter the core system prompt that defines your AI's personality and role..."
									rows={6}
								/>
							</div>
							<div class="space-y-2">
								<Label for="additionalInstruction">Additional Instructions</Label>
								<Textarea
									id="additionalInstruction"
									bind:value={formData.additionalInstruction}
									placeholder="Add any additional behavioral instructions or specific guidelines..."
									rows={4}
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Content Tab -->
				<TabsContent value="content" class="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Widget Content</CardTitle>
							<CardDescription>
								Customize the text content and messaging in your chat widget.
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-4">
							<div class="space-y-2">
								<Label for="displayName">Display Name</Label>
								<Input
									id="displayName"
									bind:value={formData.displayName}
									placeholder="Customer Support"
								/>
							</div>
							<div class="space-y-2">
								<Label for="initialMessage">Initial Message</Label>
								<Textarea
									id="initialMessage"
									bind:value={formData.inititialMessage}
									placeholder="Hi! I'm your AI assistant. How can I help you today?"
									rows={3}
								/>
							</div>
							<div class="space-y-2">
								<Label for="messagePlaceholder">Message Placeholder</Label>
								<Input
									id="messagePlaceholder"
									bind:value={formData.messagePlaceholder}
									placeholder="Type your message..."
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<!-- Style Tab -->
				<TabsContent value="style" class="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Widget Styling</CardTitle>
							<CardDescription>
								Customize the appearance and positioning of your chat widget.
							</CardDescription>
						</CardHeader>
						<CardContent class="space-y-6">
							<!-- Colors Section -->
							<div class="space-y-4">
								<h4 class="text-sm font-medium">Colors</h4>
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for="primaryColor">Primary Color</Label>
										<div class="flex gap-2">
											<input
												type="color"
												bind:value={formData.primaryColor}
												class="h-10 w-16 rounded border"
											/>
											<Input
												bind:value={formData.primaryColor}
												placeholder="#3b82f6"
												class="flex-1"
											/>
										</div>
									</div>
									<div class="space-y-2">
										<Label for="backgroundColor">Background Color</Label>
										<div class="flex gap-2">
											<input
												type="color"
												bind:value={formData.backgroundColor}
												class="h-10 w-16 rounded border"
											/>
											<Input
												bind:value={formData.backgroundColor}
												placeholder="#ffffff"
												class="flex-1"
											/>
										</div>
									</div>
									<div class="space-y-2">
										<Label for="userMessageColor">User Message Color</Label>
										<div class="flex gap-2">
											<input
												type="color"
												bind:value={formData.userMessageColor}
												class="h-10 w-16 rounded border"
											/>
											<Input
												bind:value={formData.userMessageColor}
												placeholder="#dbeafe"
												class="flex-1"
											/>
										</div>
									</div>
									<div class="space-y-2">
										<Label for="botMessageColor">Bot Message Color</Label>
										<div class="flex gap-2">
											<input
												type="color"
												bind:value={formData.botMessageColor}
												class="h-10 w-16 rounded border"
											/>
											<Input
												bind:value={formData.botMessageColor}
												placeholder="#f3f4f6"
												class="flex-1"
											/>
										</div>
									</div>
									<div class="space-y-2">
										<Label for="chatBubbleColor">Chat Bubble Color</Label>
										<div class="flex gap-2">
											<input
												type="color"
												bind:value={formData.chatBubbleColor}
												class="h-10 w-16 rounded border"
											/>
											<Input
												bind:value={formData.chatBubbleColor}
												placeholder="#3b82f6"
												class="flex-1"
											/>
										</div>
									</div>
								</div>
							</div>

							<!-- Alignment Section -->
							<div class="space-y-4">
								<h4 class="text-sm font-medium">Positioning</h4>
								<div class="grid grid-cols-2 gap-4">
									<div class="space-y-2">
										<Label for="chatWidgetAlign">Widget Alignment</Label>
										<CustomSelect
											bind:value={formData.chatWidgetAlign}
											options={[
												{ id: 'left-align-opt', value: 'left', label: 'Left' },
												{ id: 'right-align-opt', value: 'right', label: 'Right' }
											]}
											placeholder="Select alignment..."
											onchange={(e) => {
												formData.chatWidgetAlign = e.detail.value;
											}}
										/>
									</div>
									<!-- <div class="space-y-2">
										<Label for="chatBubbleAlign">Bubble Position</Label>
										<Select bind:value={formData.chatBubbleAlign}>
											<SelectTrigger>
												<span>
													{formData.chatBubbleAlign === 'left_bottom'
														? 'Left Bottom'
														: formData.chatBubbleAlign === 'left_side'
															? 'Left Side'
															: formData.chatBubbleAlign === 'right_side'
																? 'Right Side'
																: 'Right Bottom'}
												</span>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="left_bottom">Left Bottom</SelectItem>
												<SelectItem value="left_side">Left Side</SelectItem>
												<SelectItem value="right_side">Right Side</SelectItem>
												<SelectItem value="right_bottom">Right Bottom</SelectItem>
											</SelectContent>
										</Select>
									</div> -->
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		{/if}
	</div>

	<!-- Right Panel - Widget Preview -->
	<div class="w-full min-w-0 lg:w-1/2">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Live Preview</h2>
			<Button variant="outline" size="sm" onclick={() => (iframeKey += 1)}>
				<RefreshCw class="mr-2 size-4" />
				Refresh
			</Button>
		</div>
		<div class="h-96 rounded-lg border bg-gray-50 lg:h-[calc(100vh-12rem)]">
			{#key iframeKey}
				<iframe
					title="Widget Preview"
					src="/widget/{$page.params.id}"
					width="100%"
					height="100%"
					class="rounded-lg"
				></iframe>
			{/key}
		</div>
	</div>
</div>
