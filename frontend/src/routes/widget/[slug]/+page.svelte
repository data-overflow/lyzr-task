<script>
	import { pb } from '$lib/pocketbase.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { X, MessageCircle, Send, Loader2, RotateCcw } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import { PUBLIC_BACKEND_URL } from '$env/static/public';
	import {
		AlertDialog,
		AlertDialogTrigger,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogCancel,
		AlertDialogAction
	} from '$lib/components/ui/alert-dialog/index.js';

	let { data } = $props();

	let org = $state(null);
	let loading = $state(true);
	let error = $state('');
	let open = $state(false);

	let messages = $state([]);
	let text = $state('');
	let thinking = $state(false);
	let sessionId = $state('');

	// Derived theme values with sensible defaults (light-only)
	let primary = $derived(org?.primaryColor || '#3b82f6');
	let background = $derived(org?.backgroundColor || '#ffffff');
	let userMsg = $derived(org?.userMessageColor || '#dbeafe');
	let botMsg = $derived(org?.botMessageColor || '#f3f4f6');
	let bubbleColor = $derived(org?.chatBubbleColor || primary);
	// screen anchoring of the widget container
	let widgetAlign = $derived(org?.chatWidgetAlign || 'right');
	// bubble alignment relative to widget: 'bottom_right' (stacked) or 'bottom_side' (panel pops to side)
	let bubbleAlign = $derived(org?.chatBubbleAlign || 'bottom_right');
	let placeholder = $derived(org?.messagePlaceholder || 'Type your message...');

	let headerTitle = $derived(org?.displayName || org?.name || 'Support');
	let initialMessage = $derived(
		org?.inititialMessage || // note: spelled as provided in schema
			"Hi! I'm your AI assistant. How can I help you today?"
	);

	let profileIconUrl = $derived(org?.profileIcon ? pb.files.getUrl(org, org.profileIcon) : '');
	let chatBubbleIconUrl = $derived(
		org?.chatBubbleIcon ? pb.files.getUrl(org, org.chatBubbleIcon) : ''
	);

	async function loadOrg() {
		try {
			loading = true;
			error = '';
			if (!data?.id) return;
			const record = await pb.collection('organizations').getOne(data.id);
			org = record;
			// Initialize conversation with the org's initial message
			messages = [{ role: 'assistant', content: initialMessage }];
			await createSession();
		} catch (e) {
			console.error('Failed to load organization', e);
			error = 'Failed to load widget configuration.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// Refetch when navigating to another org slug
		data?.id;
		loadOrg();
	});

	function alignBubbleClass() {
		switch (bubbleAlign) {
			case 'left_bottom':
				return 'left-4 bottom-4';
			case 'left_side':
				return 'left-4 top-1/2 -translate-y-1/2';
			case 'right_side':
				return 'right-4 top-1/2 -translate-y-1/2';
			case 'right_bottom':
			default:
				return 'right-4 bottom-4';
		}
	}

	function panelSideClass() {
		return widgetAlign === 'left' ? 'left-4' : 'right-4';
	}

	let viewport = $state(null); // messages viewport
	const API_URL = PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

	async function createSession() {
		try {
			const res = await fetch(`${API_URL}/session/${data.id}`);
			if (!res.ok) throw new Error(`Session failed (${res.status})`);
			const json = await res.json();
			sessionId = json.session_id || '';
		} catch (e) {
			console.error('createSession error', e);
			error = e?.message || 'Failed to create session';
		}
	}

	$effect.pre(() => {
		// Auto-scroll to bottom when new messages arrive
		messages.length;
		if (viewport) {
			queueMicrotask(() => {
				try {
					viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' });
				} catch {
					// Fallback
					viewport.scrollTop = viewport.scrollHeight;
				}

				// Force light mode inside the widget iframe regardless of global site theme
				// $effect(() => {
				// 	if (browser) {
				// 		try {
				// 			document.documentElement.classList.remove('dark');
				// 			document.documentElement.style.colorScheme = 'light';
				// 		} catch {}
				// 	}
				// });
			});
		}
	});

	function handleKeydown(ev) {
		if (ev.key === 'Enter') {
			ev.preventDefault?.();
			sendMessage();
		}
	}

	function addAssistantMessage(content) {
		messages = [...messages, { role: 'assistant', content }];
	}

	function addUserMessage(content) {
		messages = [...messages, { role: 'user', content }];
	}

	async function sendMessage() {
		const value = text.trim();
		if (!value || thinking) return;
		addUserMessage(value);
		text = '';
		thinking = true;
		try {
			const res = await fetch(`${API_URL}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					organization_id: data.id,
					session_id: sessionId || null,
					query: value
				})
			});
			if (!res.ok) throw new Error(`Chat failed (${res.status})`);
			const json = await res.json();
			if (json?.session_id && json.session_id !== sessionId) sessionId = json.session_id;
			const content = json?.final_response || '';
			if (content) addAssistantMessage(content);
			else addAssistantMessage('');
		} catch (e) {
			const msg = e?.message || 'Unexpected error';
			error = msg;
			addAssistantMessage(`Error: ${msg}`);
		} finally {
			thinking = false;
		}
	}
</script>

<!-- Root container uses CSS variables for theming (Tailwind v4 arbitrary values) -->
<div
	class="scheme-light light force-light"
	style={`
        --primary: ${primary};
        --bg: ${background};
        --user-msg: ${userMsg};
        --bot-msg: ${botMsg};
        --chat-bubble: ${bubbleColor};
    `}
>
	<!-- Container manages relative bubble/panel layout and screen anchoring -->
	<div
		class="pointer-events-none fixed bottom-3 sm:bottom-6 {widgetAlign === 'left'
			? 'left-4'
			: 'right-4'}"
	>
		<div
			class={`pointer-events-auto flex items-end gap-3 ${bubbleAlign === 'bottom_side' ? (widgetAlign === 'right' ? 'flex-row-reverse' : 'flex-row') : 'flex-col-reverse'}`}
		>
			<!-- Floating bubble -->
			<button
				class={`grid size-14 place-items-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95`}
				style="background: var(--chat-bubble); color: white;"
				aria-label="Open chat"
				onclick={() => (open = !open)}
			>
				{#if chatBubbleIconUrl}
					<img src={chatBubbleIconUrl} alt="chat" class="size-7" />
				{:else}
					<MessageCircle class="size-6" />
				{/if}
			</button>

			<!-- Chat Panel -->
			{#if open}
				<div
					class="flex max-h-[440px] min-h-[360px] w-[min(92vw,28rem)] flex-col overflow-hidden rounded-xl border bg-white shadow-xl sm:max-h-[660px]"
				>
					<!-- Header -->
					<div class="flex items-center gap-3 border-b px-4 py-3">
						<div class="relative">
							{#if profileIconUrl}
								<img src={profileIconUrl} alt="profile" class="size-8 rounded-full border" />
							{:else}
								<div
									class="bg-(--primary)/10 text-(--primary) grid size-8 place-items-center rounded-full"
								>
									<MessageCircle class="size-4" />
								</div>
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-semibold">{headerTitle}</div>
						</div>
						<!-- Reset conversation -->
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="ghost" size="icon" aria-label="Reset conversation">
									<RotateCcw class="size-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Reset conversation?</AlertDialogTitle>
									<AlertDialogDescription>
										This will clear the current chat history.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onclick={() => {
											messages = [{ role: 'assistant', content: initialMessage }];
											open = false;
										}}>Reset</AlertDialogAction
									>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<Button variant="ghost" size="icon" aria-label="Close" onclick={() => (open = false)}>
							<X class="size-4" />
						</Button>
					</div>

					<!-- Messages -->
					<div class="grid h-[calc(100%-0px)] max-h-[440px] grow grid-rows-[1fr_auto]">
						<div class="h-[100%] overflow-y-auto p-3" bind:this={viewport}>
							{#if loading}
								<div class="text-muted-foreground flex items-center gap-2 px-1 text-sm">
									<Loader2 class="size-4 animate-spin" />
									Loading widget...
								</div>
							{:else if error}
								<div class="px-1 text-sm text-red-600">{error}</div>
							{:else}
								<ul class="space-y-2">
									{#each messages as m}
										<li class={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
											<div
												class={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.role === 'user' ? '' : ''}`}
												style={m.role === 'user'
													? 'background: var(--user-msg);'
													: 'background: var(--bot-msg);'}
											>
												{m.content}
											</div>
										</li>
									{/each}
									{#if thinking}
										<li class="flex justify-start">
											<div class="bg-(--bot-msg) rounded-2xl px-3 py-2 text-sm shadow-sm">
												<span class="inline-flex items-center gap-1">
													<span
														class="bg-(--primary) size-1.5 animate-bounce rounded-full [animation-delay:-0.2s]"
													></span>
													<span class="bg-(--primary) size-1.5 animate-bounce rounded-full"></span>
													<span
														class="bg-(--primary) size-1.5 animate-bounce rounded-full [animation-delay:0.2s]"
													></span>
												</span>
											</div>
										</li>
									{/if}
								</ul>
							{/if}
						</div>

						<!-- Input -->
						<div class="border-t p-3">
							<form
								class="flex items-end gap-2"
								onsubmit={(e) => {
									e.preventDefault();
									sendMessage();
								}}
							>
								<div class="flex-1">
									<Input
										{placeholder}
										value={text}
										oninput={(e) => (text = e.currentTarget.value)}
										onkeydown={handleKeydown}
									/>
								</div>
								<Button type="submit" disabled={thinking || !text.trim()} aria-label="Send">
									{#if thinking}
										<Loader2 class="mr-1 size-4 animate-spin" />
									{:else}
										<Send class="mr-1 size-4" />
									{/if}
									Send
								</Button>
							</form>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
