<script lang="ts">
	import { onMount } from 'svelte';

	let { siteKey }: { siteKey: string } = $props();

	let container: HTMLDivElement;
	let widgetId: string | undefined;

	type TurnstileApi = {
		render: (el: HTMLElement, opts: { sitekey: string; theme: string }) => string;
		reset: (id?: string) => void;
		remove: (id?: string) => void;
	};
	const api = () => (window as unknown as { turnstile?: TurnstileApi }).turnstile;

	/** Tokens are single-use; call after every submission. */
	export function reset() {
		api()?.reset(widgetId);
	}

	function loadScript(): Promise<void> {
		if (api()) return Promise.resolve();
		return new Promise((resolve, reject) => {
			let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
			if (!script) {
				script = document.createElement('script');
				script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
				script.async = true;
				script.dataset.turnstile = '';
				document.head.appendChild(script);
			}
			script.addEventListener('load', () => resolve());
			script.addEventListener('error', () => reject(new Error('Captcha failed to load')));
		});
	}

	// Turnstile injects a hidden `cf-turnstile-response` input into the surrounding form.
	onMount(() => {
		loadScript().then(() => {
			widgetId = api()?.render(container, { sitekey: siteKey, theme: 'dark' });
		});
		return () => api()?.remove(widgetId);
	});
</script>

<div bind:this={container} class="min-h-[65px]"></div>
