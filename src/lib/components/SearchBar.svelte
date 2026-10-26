<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import favicon from "#lib/assets/favicon-white.png";

  type Suggestion = {
    slug: string;
    name: string;
    artists: string;
    venue: string;
    date: string;
  };

  const initial = $derived(
    page.url.pathname === "/" ? (page.url.searchParams.get("q") ?? "") : "",
  );
  let text = $state("");
  let suggestions = $state<Suggestion[]>([]);
  let open = $state(false);
  let active = $state(-1);
  let timer: ReturnType<typeof setTimeout>;
  let seq = 0;

  $effect(() => {
    text = initial;
  });

  function onInput() {
    clearTimeout(timer);
    active = -1;
    const q = text.trim();
    if (!q) {
      suggestions = [];
      open = false;
      return;
    }
    timer = setTimeout(async () => {
      const id = ++seq;
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        if (!res.ok || id !== seq) return;
        suggestions = await res.json();
        open = suggestions.length > 0;
      } catch {
        // ignore network errors; the form still works
      }
    }, 150);
  }

  function choose(s: Suggestion) {
    open = false;
    goto(`/events/${s.slug}`);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      open = false;
    } else if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const n = suggestions.length;
      active =
        ((active + (e.key === "ArrowDown" ? 1 : -1) + n + 1) % (n + 1)) - 1;
    } else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    }
  }
</script>

<form action="/" method="GET" role="search" class="relative flex-1">
  <img
    src={favicon}
    alt=""
    class="pointer-events-none absolute top-1/2 left-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-sm"
    aria-hidden="true"
  />
  <label class="sr-only" for="search">Search events</label>
  <input
    id="search"
    name="q"
    type="search"
    bind:value={text}
    oninput={onInput}
    onkeydown={onKeydown}
    onfocus={() => (open = suggestions.length > 0)}
    onblur={() => setTimeout(() => (open = false), 100)}
    placeholder="Search reefit"
    autocomplete="off"
    role="combobox"
    aria-expanded={open}
    aria-controls="search-suggestions"
    aria-autocomplete="list"
    class="field rounded-full bg-bg-secondary py-1.5 pl-10 placeholder:text-center"
  />
  {#if open}
    <ul
      id="search-suggestions"
      role="listbox"
      class="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-field shadow-lg"
    >
      {#each suggestions as s, i (s.slug)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          role="option"
          aria-selected={i === active}
          class="cursor-pointer px-4 py-2 text-sm {i === active
            ? 'bg-white/10'
            : 'hover:bg-white/5'}"
          onmousedown={(e) => {
            e.preventDefault();
            choose(s);
          }}
        >
          <div class="font-medium">{s.name}</div>
          <div class="text-xs opacity-60">{s.venue} · {s.date}</div>
        </li>
      {/each}
    </ul>
  {/if}
</form>
