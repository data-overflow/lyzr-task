<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { PUBLIC_SITE_URL } from '$env/static/public';

	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Copy, Check, ExternalLink, AlertTriangle } from '@lucide/svelte';

	// Derived embed URL for the current org
	let baseUrl = $derived(
		(PUBLIC_SITE_URL && PUBLIC_SITE_URL.replace(/\/$/, '')) ||
			(browser ? window.location.origin : '')
	);
	let orgId = $derived($page.params.id);
	let widgetUrl = $derived(`${baseUrl}/widget/${orgId}`);

	// Embed configuration
	let minWidth = $state('400');
	let minHeight = $state('700');
	let embedType = $state('script'); // 'floating', 'script', or 'inline'

	// Generate different embed codes
	let floatingCode = $derived(`<iframe
  src="${widgetUrl}"
  title="ChatBased Support"
  style="position: fixed; bottom: 0; right: 0; border: none; z-index: 1000; min-height: ${minHeight}px; min-width: ${minWidth}px; background: transparent;"
  frameborder="0"
  allowtransparency="true"
  loading="lazy"
></iframe>`);

	let inlineCode = $derived(`<iframe
  src="${widgetUrl}"
  title="ChatBased Support"
  style="border: none; width: 100%; min-height: ${minHeight}px; background: transparent;"
  frameborder="0"
  allowtransparency="true"
  loading="lazy"
></iframe>`);

	let scriptCode = $derived(`<script>
(function() {
  // Create iframe dynamically
  const iframe = document.createElement('iframe');
  iframe.src = '${widgetUrl}';
  iframe.title = 'ChatBased Support';
  iframe.style.cssText = 'position:fixed;bottom:0;right:0;border:none;z-index:1000;min-height:${minHeight}px;min-width:${minWidth}px;background:transparent;pointer-events:none;';
  iframe.frameBorder = '0';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.loading = 'lazy';
  
  // Start with pointer events disabled to allow clicks through
  iframe.style.pointerEvents = 'none';
  
  // Listen for messages from the widget to enable/disable pointer events
  window.addEventListener('message', function(event) {
    if (event.origin !== '${baseUrl}') return;
    
    if (event.data.type === 'chatbot-open') {
      iframe.style.pointerEvents = 'auto';
    } else if (event.data.type === 'chatbot-closed') {
      iframe.style.pointerEvents = 'none';
    }
  });
  
  // Fallback: enable pointer events after load
  iframe.onload = function() {
    setTimeout(function() {
      iframe.style.pointerEvents = 'auto';
    }, 1000);
  };
  
  document.body.appendChild(iframe);
})();
<\/script>`);

	let currentCode = $derived(
		embedType === 'floating' ? floatingCode : embedType === 'inline' ? inlineCode : scriptCode
	);

	let copied = $state(false);
	async function copyCode() {
		try {
			await navigator.clipboard.writeText(currentCode);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch (err) {
			console.error('copy failed', err);
		}
	}
</script>

<div class="mx-auto max-w-4xl space-y-6">
	<Card>
		<CardHeader>
			<div class="flex items-start justify-between gap-4">
				<div>
					<CardTitle>Embed the Chat Widget</CardTitle>
					<CardDescription>
						Choose an embedding method and copy the code snippet to add the chat widget to your
						website.
					</CardDescription>
				</div>
				<a
					class="text-sm text-blue-600 hover:underline"
					href={widgetUrl}
					target="_blank"
					rel="noreferrer"
				>
					Preview widget <ExternalLink class="ml-1 inline size-4 align-[-2px]" />
				</a>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			<!-- Configuration -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="minWidth" class="mb-1 block text-xs font-medium">Min Width (px)</label>
					<Input
						id="minWidth"
						type="number"
						min="300"
						step="10"
						value={minWidth}
						oninput={(e) => (minWidth = e.currentTarget.value)}
					/>
				</div>
				<div>
					<label for="minHeight" class="mb-1 block text-xs font-medium">Min Height (px)</label>
					<Input
						id="minHeight"
						type="number"
						min="400"
						step="20"
						value={minHeight}
						oninput={(e) => (minHeight = e.currentTarget.value)}
					/>
				</div>
			</div>

			<Separator />

			<!-- Embed Methods -->
			<Tabs bind:value={embedType} class="w-full">
				<TabsList class="grid w-full grid-cols-3">
					<TabsTrigger value="floating">Floating</TabsTrigger>
					<TabsTrigger value="script">Smart Script (Recommended)</TabsTrigger>
					<TabsTrigger value="inline">Inline</TabsTrigger>
				</TabsList>

				<TabsContent value="floating" class="space-y-3">
					<div class="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm">
						<AlertTriangle class="size-4 text-blue-600" />
						<div>
							<strong>Floating iframe:</strong> Simple iframe positioned in the corner. Always allows
							pointer events - may block clicks behind it.
						</div>
					</div>
				</TabsContent>

				<TabsContent value="script" class="space-y-3">
					<div class="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm">
						<Check class="size-4 text-green-600" />
						<div>
							<strong>Smart script:</strong> Dynamically creates iframe with click-through behavior.
							Disables pointer events when chat is closed (This feature isn't implemented properly yet)
						</div>
					</div>
				</TabsContent>

				<TabsContent value="inline" class="space-y-3">
					<div class="flex items-center gap-2 rounded-lg bg-orange-50 p-3 text-sm">
						<AlertTriangle class="size-4 text-orange-600" />
						<div>
							<strong>Inline iframe:</strong> Embeds as a block element within your page content. Best
							for dedicated chat pages or sections.
						</div>
					</div>
				</TabsContent>
			</Tabs>

			<!-- Copy button and code -->
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">Embed Code:</span>
				<Button onclick={copyCode} aria-label="Copy code">
					{#if copied}
						<Check class="mr-2 size-4" /> Copied!
					{:else}
						<Copy class="mr-2 size-4" /> Copy Code
					{/if}
				</Button>
			</div>

			<div class="rounded-lg border bg-gray-50 p-3">
				<pre class="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed"><code
						>{currentCode}</code
					></pre>
			</div>
		</CardContent>
	</Card>

	<!-- <Card>
		<CardHeader>
			<CardTitle>Implementation Notes</CardTitle>
		</CardHeader>
		<CardContent class="space-y-3 text-sm">
			<div>
				<strong>Floating:</strong> Basic iframe approach - always blocks clicks behind it when positioned
				over content.
			</div>
			<div>
				<strong>Script:</strong> Smart approach that allows clicks to pass through when chat is closed.
				Requires JavaScript execution but provides better UX.
			</div>
			<div>
				<strong>Inline:</strong> Embed within your page content where you want the chat interface to
				appear - no click blocking issues.
			</div>
			<div class="mt-4 rounded-lg bg-blue-50 p-3">
				<strong>Tip:</strong> The script approach solves the iframe blocking issue by dynamically managing
				pointer events based on chat state.
			</div>
		</CardContent>
	</Card> -->
</div>
