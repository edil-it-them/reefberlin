<script lang="ts">
  import type { SiteRule } from "#lib/shared.ts";

  let { rules }: { rules: SiteRule[] } = $props();
</script>

{#if rules.length}
  <section aria-labelledby="rules-title" class="card rounded-xl border p-4">
    <h2
      id="rules-title"
      class="text-xs font-bold tracking-wide text-muted uppercase"
    >
      r/reefberlin rules
    </h2>
    <ol class="mt-2 divide-y divide-line">
      {#each rules as rule, i (i)}
        <li>
          <details class="group py-2">
            <summary
              class="flex cursor-pointer list-none items-center gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden"
            >
              <span class="w-4 text-muted">{i + 1}</span>
              <span class="flex-1">{rule.title}</span>
              {#if rule.body}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  class="text-muted transition-transform group-open:rotate-180"
                  ><path
                    d="M10 13.7a.897.897 0 0 1-.636-.264l-4.6-4.6a.9.9 0 1 1 1.272-1.273L10 11.526l3.964-3.963a.9.9 0 0 1 1.272 1.273l-4.6 4.6A.897.897 0 0 1 10 13.7Z"
                  /></svg
                >
              {/if}
            </summary>
            {#if rule.body}
              <p class="mt-1 pl-6 text-sm text-muted">{rule.body}</p>
            {/if}
          </details>
        </li>
      {/each}
    </ol>
  </section>
{/if}
