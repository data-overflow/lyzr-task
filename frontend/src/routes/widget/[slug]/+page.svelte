<script>
	import { page } from '$app/stores';

	let { data } = $props();
</script>

<div>
	<h1>Widget of organization {data.id} & {$page.params.slug}</h1>
</div>
