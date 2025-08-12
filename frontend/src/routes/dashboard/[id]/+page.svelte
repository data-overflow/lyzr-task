<script>
	let { id } = $props();
</script>

<div class="space-y-2">
	<h2 class="text-xl font-semibold">Dashboard</h2>
	<p class="text-muted-foreground text-sm">Organization ID: {id}</p>
	<div class="rounded-md border p-4">
		<p class="text-sm">Choose an item from the sidebar to get started.</p>
	</div>
</div>
