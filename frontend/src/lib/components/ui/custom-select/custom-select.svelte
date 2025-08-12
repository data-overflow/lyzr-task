<script>
	import { ChevronDown, Check } from '@lucide/svelte';

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select option...',
		disabled = false,
		class: className = '',
		onchange = () => {}
	} = $props();

	let isOpen = $state(false);
	let selectedOption = $derived(options.find((opt) => opt.value === value));

	function toggleDropdown() {
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	function selectOption(option) {
		value = option.value;
		isOpen = false;
		onchange({ detail: { value: option.value, option } });
	}

	function handleClickOutside(event) {
		if (!event.target.closest('.relative')) {
			isOpen = false;
		}
	}

	function handleKeydown(event) {
		if (disabled) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleDropdown();
		} else if (event.key === 'Escape') {
			isOpen = false;
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!isOpen) {
				isOpen = true;
			} else {
				const currentIndex = options.findIndex((opt) => opt.value === value);
				let nextIndex;

				if (event.key === 'ArrowDown') {
					nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
				} else {
					nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
				}

				selectOption(options[nextIndex]);
			}
		}
	}

	// Handle click outside
	function handleDocumentClick(event) {
		if (isOpen && !event.target.closest('.custom-select-container')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleDocumentClick);
		} else {
			document.removeEventListener('click', handleDocumentClick);
		}

		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	});
</script>

<div class="custom-select-container relative {className}">
	<button
		type="button"
		class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
		class:cursor-not-allowed={disabled}
		class:opacity-50={disabled}
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		{disabled}
	>
		<span class="flex items-center gap-2">
			{#if selectedOption?.icon}
				{@const IconComponent = selectedOption.icon}
				<IconComponent class="size-4" />
			{/if}
			<span class={selectedOption ? '' : 'text-muted-foreground'}>
				{selectedOption?.label || placeholder}
			</span>
		</span>
		<ChevronDown
			class="size-4 opacity-50 {isOpen ? 'rotate-180' : ''} transition-transform duration-200"
		/>
	</button>

	{#if isOpen}
		<div
			class="bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border p-1 shadow-md"
			role="listbox"
		>
			{#each options as option (option.id || option.value)}
				<button
					type="button"
					class="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none"
					class:bg-accent={option.value === value}
					class:text-accent-foreground={option.value === value}
					onclick={() => selectOption(option)}
					role="option"
					aria-selected={option.value === value}
				>
					{#if option.icon}
						{@const IconComponent = option.icon}
						<IconComponent class="size-4" />
					{/if}
					<span class="flex-1 text-left">{option.label}</span>
					{#if option.value === value}
						<Check class="size-4" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
