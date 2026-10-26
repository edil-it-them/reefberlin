<script lang="ts">
  import CommentForm from "#lib/components/CommentForm.svelte";
  import CommentThread from "#lib/components/CommentThread.svelte";
  import EventCard from "#lib/components/EventCard.svelte";
  import type { PageProps } from "./$types";

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
  {#each data.threads as thread (thread.id)}
    <CommentThread {thread} siteKey={data.siteKey} {form} />
  {:else}
    <div class="py-10 text-center">
      <p class="text-base font-bold">Be the first to comment</p>
      <p class="mt-1 text-sm text-muted">
        Nobody's responded to this post yet. Sign the guestbook!
      </p>
    </div>
  {/each}
</section>
