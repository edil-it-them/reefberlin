<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const tabs = [
		{ href: '/admin', label: 'Comments' },
		{ href: '/admin/events', label: 'Events' },
		{ href: '/admin/settings', label: 'Settings' }
	];
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>

{#if page.url.pathname !== '/admin/login'}
	<nav class="mb-6 flex items-center gap-2 border-b border-line pb-3">
		{#each tabs as tab (tab.href)}
			<a
				href={tab.href}
				aria-current={page.url.pathname === tab.href ? 'page' : undefined}
				class="rounded-full px-3 py-1 text-sm font-bold hover:bg-card-hover aria-[current=page]:bg-card-hover aria-[current=page]:text-accent"
			>
				{tab.label}
			</a>
		{/each}
		<form method="POST" action="/admin?/logout" class="ml-auto">
			<button class="btn-ghost">Log out</button>
		</form>
	</nav>
{/if}

{@render children()}
