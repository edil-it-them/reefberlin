<script lang="ts">
  type Item = { value: string; label: string };
  let {
    items,
    active,
    href,
  }: { items: Item[]; active: string; href: (value: string) => string } =
    $props();
</script>

<!-- Desktop: sticky left menu -->
<nav
  aria-label="Sort feed"
  class="sticky top-18 hidden flex-col gap-1 rounded-xl border border-line bg-card p-2 min-[1000px]:flex"
>
  {#each items as item (item.value)}
    <a
      href={href(item.value)}
      data-sveltekit-reset="false"
      aria-current={item.value === active ? "page" : undefined}
      class="rounded-lg px-3 py-2 text-sm hover:bg-card-hover aria-[current=page]:bg-card-hover aria-[current=page]:font-bold aria-[current=page]:text-accent"
    >
      {item.label}
    </a>
  {/each}
</nav>

<!-- Mobile: tabs above the feed -->
<nav
  aria-label="Sort feed"
  class="flex gap-1 border-b border-line min-[1000px]:hidden"
>
  {#each items as item (item.value)}
    <a
      href={href(item.value)}
      data-sveltekit-reset="false"
      aria-current={item.value === active ? "page" : undefined}
      class="flex-1 border-b-2 border-transparent px-2 py-2.5 text-center text-sm text-muted hover:text-ink aria-[current=page]:border-accent aria-[current=page]:font-bold aria-[current=page]:text-ink"
    >
      {item.label}
    </a>
  {/each}
</nav>
