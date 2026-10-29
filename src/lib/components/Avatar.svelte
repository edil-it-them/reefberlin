<script lang="ts">
  import { AVATARS } from "#lib/shared.ts";

  let { icon, size = 32 }: { icon: string; size?: number } = $props();
  const known = $derived((AVATARS as readonly string[]).includes(icon));
</script>

{#if known}
  <img
    src="/avatars/{icon}.webp"
    alt=""
    width={size}
    height={size}
    loading="lazy"
    decoding="async"
    class="shrink-0 rounded-full bg-card-hover object-cover"
    style:width="{size}px"
    style:height="{size}px"
  />
{:else}
  <!-- Nicknames created before the designed avatars keep their emoji. -->
  <span
    class="flex shrink-0 items-center justify-center rounded-full bg-card-hover"
    style:width="{size}px"
    style:height="{size}px"
    style:font-size="{size * 0.6}px"
    aria-hidden="true">{icon}</span
  >
{/if}
