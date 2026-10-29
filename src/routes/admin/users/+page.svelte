<script lang="ts">
	import { enhance } from '$app/forms';
	import Avatar from '#lib/components/Avatar.svelte';
	import { formatDate } from '#lib/shared.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Admin · Users</title></svelte:head>

<h1 class="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Users ({data.users.length})</h1>
<p class="mb-4 text-sm text-muted">
	A user is a nickname with its codeword. Deleting one also deletes all of their comments and replies, and the
	nickname can be claimed again by anyone.
</p>

<div class="flex flex-col gap-3">
	{#each data.users as user (user.id)}
		<article class="card flex items-center gap-3 p-4">
			<Avatar icon={user.icon} />
			<div class="min-w-0 flex-1">
				<p class="truncate font-medium">{user.name}</p>
				<p class="text-xs text-muted">
					{user.commentCount} comment{user.commentCount === 1 ? '' : 's'} · joined {formatDate(user.createdAt)}
				</p>
			</div>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					const msg = `Delete "${user.name}" and their ${user.commentCount} comment${user.commentCount === 1 ? '' : 's'}? This cannot be undone.`;
					if (!confirm(msg)) cancel();
				}}
			>
				<input type="hidden" name="id" value={user.id} />
				<button class="btn-danger">Delete</button>
			</form>
		</article>
	{:else}
		<p class="card p-6 text-center text-muted">No users yet.</p>
	{/each}
</div>
