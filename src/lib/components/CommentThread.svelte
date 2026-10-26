<script lang="ts">
  import CommentForm from "#lib/components/CommentForm.svelte";
  import CommentItem from "#lib/components/CommentItem.svelte";
  import type { Thread } from "#lib/server/comments.ts";
  type Props = {
    thread: Thread;
    siteKey: string;
    form?: {
      error?: string;
      parentId?: number | null;
      values?: Record<string, string>;
    } | null;
  };
  let { thread, siteKey, form = null }: Props = $props();

  // Re-open the reply form if a failed (no-JS) submission targeted this thread; initial value is intended.
  // svelte-ignore state_referenced_locally
  let replying = $state(form?.parentId === thread.id);
</script>

<article>
  <CommentItem comment={thread}>
    {#snippet actions()}
      <button
        type="button"
        class="action"
        onclick={() => (replying = !replying)}
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
        Reply
      </button>
    {/snippet}

    {#if replying}
      <div class="mt-2">
        <CommentForm
          {siteKey}
          {form}
          parentId={thread.id}
          onposted={() => (replying = false)}
          oncancel={() => (replying = false)}
        />
      </div>
    {/if}

    {#if thread.replies.length}
      <div class="mt-3 flex flex-col gap-3">
        {#each thread.replies as reply (reply.id)}
          <CommentItem comment={reply} />
        {/each}
      </div>
    {/if}
  </CommentItem>
</article>
