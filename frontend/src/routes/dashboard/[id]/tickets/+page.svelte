<script>
	import { page } from '$app/stores';
	import { pb, user } from '$lib/pocketbase.svelte.js';
	import {
		currentOrg,
		organizationsStore,
		ticketsStore,
		ticketMessagesStore
	} from '$lib/data.svelte.js';
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
	import { Badge } from '$lib/components/ui/badge';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Loader2,
		Plus,
		Send,
		Calendar,
		User,
		Mail,
		MessageSquare,
		Clock,
		AlertCircle,
		CheckCircle,
		XCircle,
		Pause
	} from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';

	let tickets = $state([]);
	let loading = $state(true);
	let selectedTicket = $state(null);
	let ticketMessages = $state([]);
	let loadingMessages = $state(false);
	let newMessage = $state('');
	let sendingMessage = $state(false);
	let editingTicket = $state(null);
	let savingTicket = $state(false);

	// Status and priority options with unique IDs to prevent duplicate keys
	const statusOptions = [
		{ id: 'status-open', value: 'open', label: 'Open', color: 'bg-blue-500', icon: AlertCircle },
		{
			id: 'status-in-progress',
			value: 'in_progress',
			label: 'In Progress',
			color: 'bg-yellow-500',
			icon: Clock
		},
		{
			id: 'status-pending',
			value: 'pending',
			label: 'Pending',
			color: 'bg-orange-500',
			icon: Pause
		},
		{
			id: 'status-resolved',
			value: 'resolved',
			label: 'Resolved',
			color: 'bg-green-500',
			icon: CheckCircle
		},
		{ id: 'status-closed', value: 'closed', label: 'Closed', color: 'bg-gray-500', icon: XCircle }
	];

	const priorityOptions = [
		{ id: 'priority-low', value: 'low', label: 'Low', color: 'bg-gray-500' },
		{ id: 'priority-medium', value: 'medium', label: 'Medium', color: 'bg-blue-500' },
		{ id: 'priority-high', value: 'high', label: 'High', color: 'bg-orange-500' },
		{ id: 'priority-urgent', value: 'urgent', label: 'Urgent', color: 'bg-red-500' }
	];

	async function loadTickets() {
		try {
			loading = true;
			const orgId = $page.params.id;

			// Check cache first
			if (ticketsStore.value[orgId]) {
				tickets = ticketsStore.value[orgId];
				loading = false;
				return;
			}

			const ticketData = await pb.collection('tickets').getFullList({
				filter: `organizationId = "${orgId}"`,
				sort: '-created',
				expand: 'assignedTo,customerId'
			});

			// Set default status if empty
			const processedTickets = ticketData.map((ticket) => ({
				...ticket,
				status: ticket.status || 'open'
			}));

			tickets = processedTickets;

			// Cache the tickets
			ticketsStore.set({
				...ticketsStore.value,
				[orgId]: processedTickets
			});
		} catch (error) {
			console.error('Failed to load tickets:', error);
			toast.error('Failed to load tickets');
		} finally {
			loading = false;
		}
	}

	async function loadTicketMessages(ticketId) {
		try {
			loadingMessages = true;

			// Check cache first
			if (ticketMessagesStore.value[ticketId]) {
				ticketMessages = ticketMessagesStore.value[ticketId];
				loadingMessages = false;
				return;
			}

			const messages = await pb.collection('ticket_messages').getFullList({
				filter: `ticketId = "${ticketId}"`,
				sort: 'created',
				expand: 'userId,customerId'
			});

			ticketMessages = messages;

			// Cache the messages
			ticketMessagesStore.set({
				...ticketMessagesStore.value,
				[ticketId]: messages
			});
		} catch (error) {
			console.error('Failed to load ticket messages:', error);
			toast.error('Failed to load messages');
		} finally {
			loadingMessages = false;
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !selectedTicket || sendingMessage) return;

		try {
			sendingMessage = true;

			const messageData = {
				ticketId: selectedTicket.id,
				role: 'admin', // Since this is from dashboard, it's admin
				content: newMessage.trim(),
				metadata: {},
				userId: user.value?.id || null
			};

			const createdMessage = await pb.collection('ticket_messages').create(messageData);

			// Add to local state
			ticketMessages = [...ticketMessages, createdMessage];

			// Update cache
			ticketMessagesStore.set({
				...ticketMessagesStore.value,
				[selectedTicket.id]: ticketMessages
			});

			newMessage = '';
			toast.success('Message sent successfully!');
		} catch (error) {
			console.error('Failed to send message:', error);
			toast.error('Failed to send message');
		} finally {
			sendingMessage = false;
		}
	}

	async function updateTicket(ticketId, updates) {
		try {
			savingTicket = true;

			const updatedTicket = await pb.collection('tickets').update(ticketId, updates);

			// Update local tickets array
			tickets = tickets.map((t) => (t.id === ticketId ? updatedTicket : t));

			// Update cache
			const orgId = $page.params.id;
			ticketsStore.set({
				...ticketsStore.value,
				[orgId]: tickets
			});

			// Update selected ticket if it's the one being edited
			if (selectedTicket?.id === ticketId) {
				selectedTicket = updatedTicket;
			}

			toast.success('Ticket updated successfully!');
			editingTicket = null;
		} catch (error) {
			console.error('Failed to update ticket:', error);
			toast.error('Failed to update ticket');
		} finally {
			savingTicket = false;
		}
	}

	function openTicketDetails(ticket) {
		selectedTicket = ticket;
		loadTicketMessages(ticket.id);
	}

	function getStatusConfig(status) {
		return statusOptions.find((s) => s.value === status) || statusOptions[0];
	}

	function getPriorityConfig(priority) {
		return priorityOptions.find((p) => p.value === priority) || priorityOptions[0];
	}

	function formatDate(dateString) {
		if (!dateString) return 'Not set';
		return new Date(dateString).toLocaleDateString();
	}

	function getInitials(name) {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	onMount(() => {
		loadTickets();
	});

	$effect(() => {
		if ($page.params.id && $page.params.id !== currentOrg.value.id) {
			loadTickets();
		}
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Support Tickets</h1>
			<p class="text-muted-foreground">Manage customer support requests and inquiries</p>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<Loader2 class="size-6 animate-spin" />
			<span class="ml-2">Loading tickets...</span>
		</div>
	{:else if tickets.length === 0}
		<Card>
			<CardContent class="py-8 text-center">
				<MessageSquare class="text-muted-foreground mx-auto size-12" />
				<h3 class="mt-4 text-lg font-semibold">No tickets yet</h3>
				<p class="text-muted-foreground">
					Support tickets will appear here when customers reach out
				</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each tickets as ticket}
				{@const statusConfig = getStatusConfig(ticket.status)}
				{@const priorityConfig = getPriorityConfig(ticket.priority)}
				{@const IconComponent = statusConfig.icon}
				<Card
					class="cursor-pointer transition-all hover:shadow-md"
					onclick={() => openTicketDetails(ticket)}
				>
					<CardHeader>
						<div class="flex items-start justify-between">
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold">#{ticket.simpleId} - {ticket.title}</h3>
									<Badge class="{priorityConfig.color} text-xs text-white"
										>{priorityConfig.label}</Badge
									>
								</div>
								<p class="text-muted-foreground line-clamp-2 text-sm">{ticket.description}</p>
							</div>
							<div class="flex items-center gap-2">
								<Badge class="{statusConfig.color} text-white">
									<IconComponent class="mr-1 size-3" />
									{statusConfig.label}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="text-muted-foreground flex items-center justify-between text-sm">
							<div class="flex items-center gap-4">
								{#if ticket.customerEmail}
									<div class="flex items-center gap-1">
										<Mail class="size-4" />
										<span>{ticket.customerEmail}</span>
									</div>
								{/if}
								{#if ticket.category}
									<Badge variant="outline">{ticket.category}</Badge>
								{/if}
							</div>
							<div class="flex items-center gap-1">
								<Calendar class="size-4" />
								<span>{formatDate(ticket.created)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<!-- Ticket Detail Dialog -->
{#if selectedTicket}
	<Dialog
		open={!!selectedTicket}
		onOpenChange={(open) => {
			if (!open) selectedTicket = null;
		}}
		class="min-w-[50vw] p-8"
	>
		<DialogContent class="max-h-[95vh] min-w-[50vw] max-w-6xl overflow-hidden p-8">
			<DialogHeader class="pb-4">
				<div class="flex items-start justify-between">
					<div class="flex-1 pr-4">
						<DialogTitle class="text-xl font-semibold"
							>#{selectedTicket.simpleId} - {selectedTicket.title}</DialogTitle
						>
						<DialogDescription class="mt-2 text-sm leading-relaxed"
							>{selectedTicket.description}</DialogDescription
						>
					</div>
					<Button variant="outline" onclick={() => (editingTicket = { ...selectedTicket })}>
						Edit Ticket
					</Button>
				</div>
			</DialogHeader>

			<div class="grid h-[65vh] grid-cols-1 gap-8 lg:grid-cols-2">
				<!-- Ticket Details -->
				<div class="space-y-6 overflow-y-auto pr-2">
					<Card class="p-4">
						<h3 class="mb-4 font-semibold">Ticket Information</h3>
						<div class="space-y-4">
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<Label class="text-sm font-medium text-gray-700">Status</Label>
									{#if selectedTicket}
										{@const statusConfig = getStatusConfig(selectedTicket.status)}
										{@const IconComponent = statusConfig.icon}
										<div>
											<Badge class="{statusConfig.color} text-white">
												<IconComponent class="mr-1 size-3" />
												{statusConfig.label}
											</Badge>
										</div>
									{/if}
								</div>
								<div class="space-y-2">
									<Label class="text-sm font-medium text-gray-700">Priority</Label>
									{#if selectedTicket}
										{@const priorityConfig = getPriorityConfig(selectedTicket.priority)}
										<div>
											<Badge class="{priorityConfig.color} text-white">{priorityConfig.label}</Badge
											>
										</div>
									{/if}
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<Label class="text-sm font-medium text-gray-700">Customer Email</Label>
									<p class="text-muted-foreground text-sm">
										{selectedTicket.customerEmail || 'Not provided'}
									</p>
								</div>
								<div class="space-y-2">
									<Label class="text-sm font-medium text-gray-700">Due Date</Label>
									<p class="text-muted-foreground text-sm">{formatDate(selectedTicket.dueDate)}</p>
								</div>
							</div>

							{#if selectedTicket.category}
								<div class="space-y-2">
									<Label class="text-sm font-medium text-gray-700">Category</Label>
									<div>
										<Badge variant="outline">{selectedTicket.category}</Badge>
									</div>
								</div>
							{/if}

							<div class="space-y-2">
								<Label class="text-sm font-medium text-gray-700">Created</Label>
								<p class="text-muted-foreground text-sm">{formatDate(selectedTicket.created)}</p>
							</div>
						</div>
					</Card>
				</div>

				<!-- Messages -->
				<div class="flex flex-col">
					<Card class="flex h-full flex-col p-4">
						<div class="mb-4 flex items-center gap-2">
							<MessageSquare class="size-5" />
							<h3 class="font-semibold">Messages</h3>
						</div>

						<ScrollArea class="flex-1 pr-2">
							{#if loadingMessages}
								<div class="flex items-center justify-center py-4">
									<Loader2 class="size-4 animate-spin" />
									<span class="ml-2 text-sm">Loading messages...</span>
								</div>
							{:else if ticketMessages.length === 0}
								<div class="text-muted-foreground py-4 text-center text-sm">No messages yet</div>
							{:else}
								<div class="space-y-4">
									{#each ticketMessages as message}
										<div class="flex items-start gap-3">
											<Avatar class="size-8">
												<AvatarImage src={message.expand?.userId?.googleAvatar} />
												<AvatarFallback>
													{getInitials(
														message.expand?.userId?.name ||
															message.expand?.customerId?.name ||
															message.role
													)}
												</AvatarFallback>
											</Avatar>
											<div class="flex-1 space-y-1">
												<div class="flex items-center gap-2">
													<span class="text-sm font-medium">
														{message.expand?.userId?.name ||
															message.expand?.customerId?.name ||
															message.role}
													</span>
													<Badge
														variant={message.role === 'admin' ? 'default' : 'secondary'}
														class="text-xs"
													>
														{message.role}
													</Badge>
													<span class="text-muted-foreground text-xs">
														{formatDate(message.created)}
													</span>
												</div>
												<p class="text-sm">{message.content}</p>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</ScrollArea>

						<!-- Message Input -->
						<div class="mt-4 space-y-3 border-t pt-4">
							<Textarea
								bind:value={newMessage}
								placeholder="Type your message..."
								rows={3}
								class="resize-none"
							/>
							<Button
								onclick={sendMessage}
								disabled={sendingMessage || !newMessage.trim()}
								class="w-full"
							>
								{#if sendingMessage}
									<Loader2 class="mr-2 size-4 animate-spin" />
								{:else}
									<Send class="mr-2 size-4" />
								{/if}
								Send Message
							</Button>
						</div>
					</Card>
				</div>
			</div>
		</DialogContent>
	</Dialog>
{/if}

<!-- Edit Ticket Dialog -->
{#if editingTicket}
	<Dialog
		open={!!editingTicket}
		onOpenChange={(open) => {
			if (!open) editingTicket = null;
		}}
	>
		<DialogContent class="max-w-md">
			<DialogHeader>
				<DialogTitle>Edit Ticket #{editingTicket.simpleId}</DialogTitle>
				<DialogDescription>Update ticket status, priority, and due date</DialogDescription>
			</DialogHeader>

			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="status">Status</Label>
					<CustomSelect
						bind:value={editingTicket.status}
						options={statusOptions}
						placeholder="Select status..."
						onchange={(e) => {
							editingTicket.status = e.detail.value;
						}}
					/>
				</div>

				<div class="space-y-2">
					<Label for="priority">Priority</Label>
					<CustomSelect
						bind:value={editingTicket.priority}
						options={priorityOptions}
						placeholder="Select priority..."
						onchange={(e) => {
							editingTicket.priority = e.detail.value;
						}}
					/>
				</div>

				<div class="space-y-2">
					<Label for="dueDate">Due Date</Label>
					<Input type="date" bind:value={editingTicket.dueDate} />
				</div>
			</div>

			<DialogFooter>
				<Button variant="outline" onclick={() => (editingTicket = null)}>Cancel</Button>
				<Button
					onclick={() => updateTicket(editingTicket.id, editingTicket)}
					disabled={savingTicket}
				>
					{#if savingTicket}
						<Loader2 class="mr-2 size-4 animate-spin" />
					{/if}
					Save Changes
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
