<script lang="ts">
  import type { SiteContent } from "#lib/shared.ts";

  let {
    site,
    stats,
  }: { site: SiteContent; stats: { nights: number; memories: number } } =
    $props();

  // On mobile only the tagline and stats show until "See more" is tapped.
  let expanded = $state(false);
  const extra = $derived(expanded ? "" : "max-[999px]:hidden");
  const facts = $derived(
    [
      site.since && `Since ${site.since}`,
      site.venue,
      "Public · no account needed",
    ].filter(Boolean),
  );
</script>

<section aria-labelledby="about-title" class="card rounded-xl border p-4">
  <h2 id="about-title" class="text-sm font-bold">About REEF</h2>
  {#if site.tagline}
    <p class="mt-2 text-lg leading-snug font-bold">{site.tagline}</p>
  {/if}
  {#if site.description}
    <p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap {extra}">
      {site.description}
    </p>
  {/if}
  <p class="mt-3 text-xs text-muted {extra}">{facts.join(" · ")}</p>

  <dl class="mt-3 flex gap-8">
    <div>
      <dd class="text-xl font-bold">{stats.nights.toLocaleString("en-GB")}</dd>
      <dt class="text-xs text-muted">Nights</dt>
    </div>
    <div>
      <dd class="text-xl font-bold">
        {stats.memories.toLocaleString("en-GB")}
      </dd>
      <dt class="text-xs text-muted">Memories</dt>
    </div>
  </dl>

  {#if site.raUrl || site.instagramUrl}
    <p class="mt-3 flex gap-4 text-sm {extra}">
      {#if site.raUrl}
        <a
          href={site.raUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="text-link hover:underline">Resident Advisor</a
        >
      {/if}
      {#if site.instagramUrl}
        <a
          href={site.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="text-link hover:underline">Instagram</a
        >
      {/if}
    </p>
  {/if}
  {#if site.howToPost}
    <p class="mt-3 border-t border-line pt-3 text-xs text-muted {extra}">
      <span class="font-bold text-ink">How to post:</span>
      {site.howToPost}
    </p>
  {/if}

  <button
    type="button"
    class="btn-ghost mt-3 w-full min-[1000px]:hidden"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    {expanded ? "See less" : "See more"}
  </button>
</section>
