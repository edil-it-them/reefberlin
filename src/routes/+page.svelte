<script lang="ts">
  import Seo from "#lib/components/Seo.svelte";
  import EventCard from "#lib/components/EventCard.svelte";
  import CommunityHeader from "#lib/components/CommunityHeader.svelte";
  import SortNav from "#lib/components/SortNav.svelte";
  import AboutPanel from "#lib/components/AboutPanel.svelte";
  import RulesCard from "#lib/components/RulesCard.svelte";
  import { fly } from "svelte/transition";
  import type { PageProps } from "./$types";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });
  let { data }: PageProps = $props();

  // const OPTIONS = [
  //   { value: "date", label: "Newest" },
  //   { value: "oldest", label: "Oldest" },
  //   { value: "rating", label: "Top rated" },
  //   { value: "comments", label: "Most comments" },
  // ] as const;

  const MENU = [
    { value: "date", label: "Newest" },
    { value: "rating", label: "Top Rated" },
    { value: "comments", label: "Top Memories" },
  ];

  let open = $state(false);
  // const current = $derived(
  //   OPTIONS.find((o) => o.value === data.sort) ?? OPTIONS[0],
  // );

  function href(sort: string) {
    const p = new URLSearchParams();
    if (data.query) p.set("q", data.query);
    if (sort !== "date") p.set("sort", sort);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  }
</script>

<Seo
  title="Reef Berlin"
  description="Reef Berlin Guestbook."
  path="/"
  noindex={!!data.query}
  jsonLd={{
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Reef Berlin Guestbook",
  }}
/>
<svelte:window
  onclick={() => (open = false)}
  onkeydown={(e) => e.key === "Escape" && (open = false)}
/>

<CommunityHeader
  bannerUrl={data.site.bannerUrl}
  bannerX={data.site.bannerX}
  bannerY={data.site.bannerY}
/>

<div
  class="flex flex-col gap-3 min-[1000px]:grid min-[1000px]:grid-cols-[11rem_minmax(0,1fr)_19rem] min-[1000px]:items-start min-[1000px]:gap-6"
>
  <div class="order-1 min-[1000px]:col-start-1 min-[1000px]:row-start-1">
    <SortNav items={MENU} active={data.sort} href={href} />
  </div>

  <!-- Contents on mobile so About sits above the feed and rules below it. -->
  <aside
    class="contents min-[1000px]:sticky min-[1000px]:top-18 min-[1000px]:col-start-3 min-[1000px]:row-start-1 min-[1000px]:flex min-[1000px]:max-h-[calc(100vh-5.5rem)] min-[1000px]:flex-col min-[1000px]:gap-3 min-[1000px]:overflow-y-auto"
  >
    <div class="order-2"><AboutPanel site={data.site} stats={data.stats} /></div>
    <div class="order-3"><RulesCard rules={data.site.rules} /></div>
  </aside>

  <div class="order-4 min-w-0 min-[1000px]:col-start-2 min-[1000px]:row-start-1">
{#if data.query}
  <h2 class="mb-4 text-sm text-muted">
    {data.events.length} result{data.events.length === 1 ? "" : "s"} for
    <span class="text-ink">“{data.query}”</span>
    · <a href="/" class="text-link hover:underline">clear</a>
  </h2>
{/if}

<!-- <div class="relative mb-3">
  <button
    type="button"
    aria-expanded={open}
    aria-haspopup="true"
    aria-label="Sort by: {current.label}"
    class="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-bold text-muted transition-colors hover:bg-card-hover {open
      ? 'bg-card-hover'
      : ''}"
    onclick={(e) => {
      e.stopPropagation();
      open = !open;
    }}
  >
    {current.label}
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      ><path
        d="M10 13.7a.897.897 0 0 1-.636-.264l-4.6-4.6a.9.9 0 1 1 1.272-1.273L10 11.526l3.964-3.963a.9.9 0 0 1 1.272 1.273l-4.6 4.6A.897.897 0 0 1 10 13.7Z"
      /></svg
    >
  </button>
  {#if open}
    <ul
      class="absolute left-0 z-20 mt-1 w-48 overflow-hidden rounded-md border border-line bg-card py-1 shadow-lg"
    >
      <li class="px-3 py-1.5 text-xs font-bold text-muted">Sort by</li>
      {#each OPTIONS as o (o.value)}
        <li>
          <a
            href={href(o.value)}
            data-sveltekit-noscroll
            class="block px-3 py-2 text-sm hover:bg-card-hover {o.value ===
            data.sort
              ? 'bg-card-hover font-bold'
              : ''}"
          >
            {o.label}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div> -->

<div class="flex flex-col gap-3">
  {#each data.events as event, index (event.id)}
    {#if mounted}
      <div
        in:fly={{ y: -20, duration: 150, delay: 100 * index, easing: cubicOut }}
      >
        <EventCard {event} commentCount={event.commentCount} linked />
      </div>
    {/if}
  {:else}
    <p class="card p-6 text-center text-muted">No events found.</p>
  {/each}
</div>
  </div>
</div>
