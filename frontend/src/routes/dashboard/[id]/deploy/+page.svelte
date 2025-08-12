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
	import { Copy, Check, ExternalLink } from '@lucide/svelte';

	// Derived embed URL for the current org
	let baseUrl = $derived(
		(PUBLIC_SITE_URL && PUBLIC_SITE_URL.replace(/\/$/, '')) ||
			(browser ? window.location.origin : '')
	);
	let orgId = $derived($page.params.id);
	let widgetUrl = $derived(`${baseUrl}/widget/${orgId}`);

	// Embed code block
	let height = $state('600');
	let code = $derived(`<iframe
  src="${widgetUrl}"
  title="ChatBased Support"
  style="border:none;width:100%;height:${height}px;max-height:80vh;"
  loading="lazy"
></iframe>`);

	let copied = $state(false);
	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
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
						Copy and paste this <code>iframe</code> snippet into your website where you want the chat
						to appear.
					</CardDescription>
				</div>
				<a
					class="text-sm text-blue-600 hover:underline"
					href={widgetUrl}
					target="_blank"
					rel="noreferrer"
				>
					Open widget <ExternalLink class="ml-1 inline size-4 align-[-2px]" />
				</a>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="grid grid-cols-[1fr_auto] items-center gap-3">
				<div>
					<label class="mb-1 block text-xs">Embed URL</label>
					<Input value={widgetUrl} readonly />
				</div>
				<div class="mt-6">
					<Button variant="outline" onclick={copyCode} aria-label="Copy code">
						{#if copied}
							<Check class="mr-2 size-4" /> Copied
						{:else}
							<Copy class="mr-2 size-4" /> Copy
						{/if}
					</Button>
				</div>
			</div>

			<div>
				<label class="mb-1 block text-xs">Iframe height (px)</label>
				<Input
					type="number"
					min="360"
					step="20"
					value={height}
					oninput={(e) => (height = e.currentTarget.value)}
				/>
			</div>

			<Separator />

			<div class="rounded-lg border p-3">
				<pre class="overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed"><code>{code}</code
					></pre>
			</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Tips</CardTitle>
			<CardDescription>
				Place the iframe near the bottom of your HTML to anchor it visually. Adjust height as
				needed.
			</CardDescription>
		</CardHeader>
		<CardContent>
			- The widget runs fully inside the iframe and requires no additional scripts.
		</CardContent>
	</Card>
</div>
