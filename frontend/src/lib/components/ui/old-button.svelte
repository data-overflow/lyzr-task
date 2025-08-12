<script>
	import { cn } from '$lib/utils.js';

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		children,
		...props
	} = $props();

	const base =
		'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 disabled:opacity-50 disabled:pointer-events-none';

	const variants = {
		default: 'bg-primary text-primary-foreground shadow hover:opacity-90',
		outline: 'border bg-transparent shadow-sm hover:bg-muted',
		ghost: 'hover:bg-muted',
		secondary: 'bg-secondary text-secondary-foreground hover:opacity-90'
	};

	const sizes = {
		default: 'h-9 px-4 py-2',
		sm: 'h-8 px-3',
		lg: 'h-10 px-6',
		icon: 'h-9 w-9'
	};
</script>

<button
	{...props}
	class={cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
>
	{@render children?.()}
</button>
