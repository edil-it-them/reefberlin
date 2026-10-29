<script lang="ts">
  import favicon from "#lib/assets/favicon-white.png";
  import { onMount } from "svelte";

  let {
    bannerUrl = "",
    bannerX = 50,
    bannerY = 50,
  }: { bannerUrl?: string; bannerX?: number; bannerY?: number } = $props();

  const STORAGE_KEY = "reef:joined";
  // Purely cosmetic: remembered in this browser only, never sent anywhere.
  let joined = $state(false);
  let welcome = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    try {
      joined = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // storage unavailable (private mode): the toggle still works for this visit
    }
    return () => clearTimeout(timer);
  });

  function toggle() {
    joined = !joined;
    try {
      if (joined) localStorage.setItem(STORAGE_KEY, "1");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    clearTimeout(timer);
    welcome = joined;
    if (joined) timer = setTimeout(() => (welcome = false), 2500);
  }
</script>

<section aria-label="Community header" class="mb-4">
  <div
    class="h-20 w-full overflow-hidden rounded-xl bg-linear-to-r from-accent/60 via-[#7193ff]/40 to-card sm:aspect-8/1 sm:h-auto"
  >
    {#if bannerUrl}
      <img
        src={bannerUrl}
        alt=""
        class="size-full object-cover"
        style:object-position="{bannerX}% {bannerY}%"
      />
    {/if}
  </div>
  <div class="flex items-end gap-3 px-3 sm:px-4 py-2">
    <img
      src={favicon}
      alt="REEF"
      class="-mt-6 size-14 shrink-0 rounded-full bg-card object-cover ring-4 ring-canvas sm:-mt-10 sm:size-20"
    />
    <h1
      class="min-w-0 truncate text-xl font-bold whitespace-nowrap sm:text-3xl"
    >
      r/reefberlin
    </h1>
    <div class="relative ml-auto">
      <button
        type="button"
        aria-pressed={joined}
        class="btn {joined
          ? 'border border-line text-ink hover:bg-card'
          : 'bg-accent text-white hover:bg-accent-hover'}"
        onclick={toggle}
      >
        {joined ? "Joined" : "Join"}
      </button>
      <p
        role="status"
        class="absolute top-full right-0 z-10 mt-1 text-xs whitespace-nowrap text-muted"
      >
        {#if welcome}Welcome to r/reefberlin{/if}
      </p>
    </div>
  </div>
</section>
