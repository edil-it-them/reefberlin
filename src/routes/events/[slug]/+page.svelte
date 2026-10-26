<script lang="ts">
  import CommentForm from "#lib/components/CommentForm.svelte";
  import CommentThread from "#lib/components/CommentThread.svelte";
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
</script>

<svelte:head
  ><title>{data.event.name} · Reef Berlin Guestbook</title></svelte:head
>

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
