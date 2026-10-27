<script lang="ts">
  import CommentForm from "#lib/components/CommentForm.svelte";
  import CommentThread from "#lib/components/CommentThread.svelte";
  import Seo from "#lib/components/Seo.svelte";
  import { formatDate } from "#lib/shared.ts";
  import { page } from "$app/state";
  import EventCard from "#lib/components/EventCard.svelte";
  import type { PageProps } from "./$types";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  let { data, form }: PageProps = $props();

  const poster = $derived(
    data.event.hasPoster
      ? `/events/${data.event.slug}/poster?v=${data.event.posterVersion}`
      : undefined,
  );
  const description = $derived(
    data.event.description ||
      `${data.event.name} at ${data.event.venue} on ${formatDate(data.event.date)}. Artists: ${data.event.artists}. Read and leave comments in the guestbook.`,
  );
</script>

<Seo
  title={data.event.name}
  {description}
  path="/events/{data.event.slug}"
  image={poster}
  imageWidth={data.event.posterWidth ?? undefined}
  imageHeight={data.event.posterHeight ?? undefined}
  type="article"
  jsonLd={{
    "@context": "https://schema.org",
    "@type": "Event",
    name: data.event.name,
    description,
    startDate: data.event.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: data.event.venue,
      address: { "@type": "PostalAddress", addressLocality: "Berlin", addressCountry: "DE" },
    },
    performer: data.event.artists
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .map((name) => ({ "@type": "PerformingGroup", name })),
    ...(poster ? { image: new URL(poster, page.url.origin).href } : {}),
  }}
/>

<EventCard event={data.event} insideEventPage={true} />

<section class="mt-3" aria-label="Leave a comment">
  <CommentForm siteKey={data.siteKey} {form} />
</section>

<hr class="my-4 border-line" />

<section class="flex flex-col gap-4" aria-label="Comments">
  {#each data.threads as thread, index (thread.id)}
    {#if mounted}
      <div
        in:fly={{ y: -20, duration: 150, easing: cubicOut, delay: 100 * index }}
      >
        <CommentThread {thread} siteKey={data.siteKey} {form} />
      </div>
    {/if}
  {:else}
    <div class="py-10 text-center">
      <p class="text-base font-bold">
        Nobody's responded to this rave yet. Sign the guestbook!
      </p>
      <!-- <p class="mt-1 text-sm text-muted">
        Nobody's responded to this rave yet. Sign the guestbook!
      </p> -->
    </div>
  {/each}
</section>
