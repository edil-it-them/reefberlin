<script lang="ts">
  import { formatDate } from "#lib/shared.ts";
  import { page } from "$app/state";
  import favicon from "#lib/assets/favicon-white.png";

  type Props = {
    event: {
      slug: string;
      name: string;
      artists: string;
      date: string;
      venue: string;
      description?: string;
      hasPoster?: boolean;
      posterWidth?: number | null;
      posterHeight?: number | null;
      posterVersion?: string | null;
      score: number;
      pinned?: boolean;
      votingDisabled?: boolean;
      sharingDisabled?: boolean;
    };
    commentCount?: number;
    linked?: boolean;
    insideEventPage?: boolean;
  };
  let {
    event,
    commentCount,
    linked: linkedProp = false,
    insideEventPage = false,
  }: Props = $props();
  // The pinned post is text-only with closed comments, so the home feed shows it in full.
  const pinned = $derived(event.pinned ?? false);
  const linked = $derived(linkedProp && !pinned);

  const key = $derived(`vote:${event.slug}`);
  let scoreOverride = $state<number | null>(null);
  let myVote = $state<-1 | 0 | 1>(0);
  let busy = false;
  let copied = $state(false);

  const score = $derived(scoreOverride ?? event.score);

  // Votes live in sessionStorage: one vote per post per browser session.
  $effect(() => {
    myVote = (Number(sessionStorage.getItem(key)) || 0) as -1 | 0 | 1;
  });

  async function vote(dir: 1 | -1) {
    if (busy) return;
    const next = myVote === dir ? 0 : dir;
    const delta = next - myVote;
    busy = true;
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: event.slug, delta }),
      });
      if (!res.ok) return;
      scoreOverride = (await res.json()).score;
      myVote = next;
      sessionStorage.setItem(key, String(next));
    } finally {
      busy = false;
    }
  }

  async function share() {
    const url = new URL(`/events/${event.slug}`, page.url.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // share dialog dismissed or clipboard unavailable
    }
  }
</script>

<article
  class="card relative px-3 pt-3 pb-2 {linked
    ? 'transition-colors hover:border-ink/40'
    : ''} {insideEventPage ? 'hover:bg-black border-t-0' : ''}"
>
  <div class="flex items-center gap-2 text-xs text-muted">
    {#if insideEventPage}
      <a
        href="/"
        aria-label="Back to events"
        title="Back to events"
        class="mb-2 flex size-8 items-center justify-center rounded-full bg-card-hover text-ink transition-colors hover:bg-linelg:mb-0"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"><path d="M12.5 3.5 6 10l6.5 6.5" /></svg
        >
      </a>
    {/if}
    <img src={favicon} alt="" class="flex size-5" aria-hidden="true" />
    <p>
      <span class="font-bold text-ink">r/reefberlin</span>
      {#if pinned}
        ·
        <span class="inline-flex items-center gap-1 font-bold text-green-400">
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            ><path
              d="M12.6 1.5 18.5 7.4l-1.4 1.4-1.2-.4-2.9 2.9.2 3.3-1.4 1.4-3.3-3.3-5 5-1-1 5-5-3.3-3.3 1.4-1.4 3.3.2 2.9-2.9-.4-1.2z"
            /></svg
          >
          Pinned
        </span>
      {:else}
        · {formatDate(event.date)} · {event.venue}
      {/if}
    </p>
  </div>
  <h2 class="mt-2 text-lg leading-snug font-medium">
    {#if linked}
      <a href="/events/{event.slug}" class="after:absolute after:inset-0"
        >{event.name}</a
      >
    {:else}
      {event.name}
    {/if}
  </h2>
  {#if !pinned}
    <p class="mt-1 text-sm text-muted">🎧 {event.artists}</p>
  {/if}
  {#if event.description}
    <p
      class="mt-2 text-sm leading-relaxed break-words whitespace-pre-wrap {linked
        ? 'line-clamp-4'
        : ''}"
    >
      {event.description}
    </p>
  {/if}
  {#if event.hasPoster && !pinned}
    <img
      src="/events/{event.slug}/poster?v={event.posterVersion}"
      alt="Poster for {event.name}"
      width={event.posterWidth ?? undefined}
      height={event.posterHeight ?? undefined}
      loading={insideEventPage ? "eager" : "lazy"}
      decoding="async"
      class="mt-3 max-h-[60vh] w-full rounded-xl bg-black/20 object-contain object-center"
    />
  {/if}

  <div
    class="relative z-1 mt-3 flex flex-row flex-nowrap items-center gap-2 overflow-x-auto"
  >
    {#if !event.votingDisabled}
    <span
      class="pill gap-0 {myVote === 1 ? 'bg-accent text-white' : ''} {myVote ===
      -1
        ? 'bg-[#7193ff] text-white'
        : ''}"
    >
      <button
        type="button"
        class="vote-btn rounded-l-full {myVote === 1
          ? ''
          : 'hover:text-accent'}"
        aria-label="Upvote"
        aria-pressed={myVote === 1}
        onclick={() => vote(1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill={myVote === 1 ? "currentColor" : "none"}
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
          ><path d="M10 2 2.5 9.5h4.6v5.4a2.9 2.9 0 0 0 5.8 0V9.5h4.6z" /></svg
        >
      </button>
      <span class="min-w-4 px-0.5 text-center text-xs font-bold">{score}</span>
      <button
        type="button"
        class="vote-btn rounded-r-full {myVote === -1
          ? ''
          : 'hover:text-[#7193ff]'}"
        aria-label="Downvote"
        aria-pressed={myVote === -1}
        onclick={() => vote(-1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill={myVote === -1 ? "currentColor" : "none"}
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
          ><path
            d="M10 18 2.5 10.5h4.6V5.1a2.9 2.9 0 0 1 5.8 0v5.4h4.6z"
          /></svg
        >
      </button>
    </span>
    {/if}

    {#if pinned}
      <span class="px-1 text-xs text-muted">Comments closed</span>
    {:else if commentCount !== undefined}
      <a
        href="/events/{event.slug}"
        class="pill px-3 hover:bg-line"
        aria-label="Go to comments"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          ><path
            d="M10 1a9 9 0 0 0-9 9c0 1.947.79 3.58 1.935 4.957L.231 17.661A.784.784 0 0 0 .785 19H10a9 9 0 0 0 9-9 9 9 0 0 0-9-9Zm0 16.2H6.162c-.994.004-1.907.053-3.045.144l-.076-.188a36.981 36.981 0 0 0 2.328-2.087l-1.05-1.263C3.297 12.576 2.8 11.331 2.8 10c0-3.97 3.23-7.2 7.2-7.2s7.2 3.23 7.2 7.2-3.23 7.2-7.2 7.2Z"
          /></svg
        >
        {commentCount}
      </a>
    {/if}

    {#if !event.sharingDisabled}
    <button type="button" class="pill px-3 hover:bg-line" onclick={share}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        ><path d="M10 12.5V2.5M6.5 5.8 10 2.3l3.5 3.5M4 10v6.2h12V10" /></svg
      >
      {copied ? "Link copied" : "Share"}
    </button>
    {/if}
  </div>
</article>
