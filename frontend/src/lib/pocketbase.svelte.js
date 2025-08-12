import PocketBase from 'pocketbase';
import { goto } from '$app/navigation';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { useLocalStorage } from './util.svelte';

const POCKETBASE_URI = PUBLIC_POCKETBASE_URL || "";
if (!POCKETBASE_URI) {
  console.warn('PUBLIC_POCKETBASE_URL is not set');
}

export const pb = new PocketBase(POCKETBASE_URI);
export const user = new useLocalStorage('user', pb.authStore.model);

pb.authStore.onChange((auth) => {
	console.log('auth -> ', auth);
	console.log('user -> ', user);
	console.log('authStore ->', pb.authStore);
	user.set(pb.authStore.model);
});

export function login() {
	let w;
	const isIos = false;
	if (isIos) {
		w = window.open('', '_blank'); // Open the window early for iOS
	}

	pb.collection('users')
		.authWithOAuth2({
			provider: 'google',
			urlCallback: (url) => {
				if (!isIos) {
					w = window.open(url, '_blank'); // Open pop-up for non-iOS devices
				} else {
					if (w) {
						w.location.href = url; // Set the URL in iOS opened window
					} else {
						window.location.href = url; // Fallback in case window didn't open
					}
				}
			}
		})
		.then(async (res) => {
			const meta = res.meta;
            //if (meta.isNew) {
			await updateDetailsFromGoogle(res, meta);
			// } else {
			// 	user.set({
			// 		...user.value,
			// 		name: meta.name,
			// 		googleAvatar: meta.avatarUrl
			// 	});
			// 	localStorage.setItem('user_google', JSON.stringify(user));
			// 	// Preferences.set({ key: 'user', value: JSON.stringify(user) });
			// }

			// Close the window after login on iOS
			if (isIos && w) {
				w.close();
			}

            goto('/organizations', { replaceState: true });
		})
		.catch((err) => {
			console.error('Login failed:', err);
			console.log(err.isAbort); // true
			if (w) w.close();
		});
}

async function updateDetailsFromGoogle(authData, meta) {
	const formData = new FormData();
	formData.append('googleAvatar', meta.avatarUrl);
	formData.append('name', meta.name);
	console.log('formData', formData);
	console.log('googleAvatar', meta.avatarUrl);
	await pb.collection('users').update(authData.record.id, formData);

	user.set({
		...user.value,
		name: meta.name,
		googleAvatar: meta.avatarUrl
	});
	localStorage.setItem('user_google', JSON.stringify(user));
	// Preferences.set({ key: 'user', value: JSON.stringify(user) });
	console.log('user localStorage set', user, JSON.stringify(user));
}

export function logout() {
	pb.authStore.clear();
	user.set(null);
    try { localStorage.removeItem('user_google'); } catch {}
    goto('/', { replaceState: true });
}
