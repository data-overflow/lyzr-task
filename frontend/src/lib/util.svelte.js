import { browser } from '$app/environment';

export class useSessionStorage {
	key = '';
	value = $state();

	constructor(key, value, autoSave = true) {
		this.key = key;
		this.value = value;

		if (browser) {
			const item = sessionStorage.getItem(key);
			if (item && (!this.value || Object.keys(this.value).length === 0)) {
				this.value = this.deserialize(item);
			}
		}
	}

    set(value) {
        this.value = value;
        if (browser) {
            try {
                sessionStorage.setItem(this.key, this.serialize(this.value));
            } catch (err) {
                console.warn('useSessionStorage: persist failed', err);
            }
        }
    }

	serialize(value) {
		return JSON.stringify(value);
	}

	deserialize(value) {
		return JSON.parse(value);
	}
}

export class useLocalStorage {
	key = '';
	value = $state();

	constructor(key, value = null, overwrite = true, autoSave = true) {
		this.key = key;
		this.value = value;
        this.init(key, value, overwrite, autoSave);
	}

    async init(key, value, overwrite = true, autoSave = true) {
        if (!browser) return;
        const raw = localStorage.getItem(key);
        if (overwrite) {
            const isEmptyObject =
                this.value && typeof this.value === 'object' && Object.keys(this.value).length === 0;
            if (raw && (this.value == null || isEmptyObject)) {
                this.value = this.deserialize(raw);
            }
        } else if (raw) {
            this.value = this.deserialize(raw);
        }
    }

	async update(value, overwrite = true) {
		this.value = await value;
		if (overwrite || this.value) {
			localStorage.setItem(this.key, this.serialize(this.value));
			// Preferences.set({ key: this.key, value: this.serialize(this.value) });
		}
	}

    set(value) {
        this.value = value;
        if (browser) {
            try {
                localStorage.setItem(this.key, this.serialize(this.value));
            } catch (err) {
                console.warn('useLocalStorage: persist failed', err);
            }
        }
    }

	async loadDataWithCache(callable, expiryTime = 60) {
		//3600000

		const currentTime = Date.now();
        const item = localStorage.getItem('_cache');
        const cacheMemory = item ? this.deserialize(item) : null;
		console.log('loading with cache 1', currentTime, item, cacheMemory);
		if (cacheMemory) {
			console.log('loading with cache: called', currentTime, item, cacheMemory);
			const timestamp = cacheMemory[this.key];
            const valueMissing = this.value == null ||
                (typeof this.value === 'object' && Object.keys(this.value).length === 0);
            if (currentTime - timestamp > expiryTime || valueMissing) {
				this.value = await callable();
				cacheMemory[this.key] = currentTime;
				localStorage.setItem('_cache', this.serialize(cacheMemory));
				// Preferences.set({ key: '_cache', value: this.serialize(cacheMemory) });
			}
		} else {
			try {
				this.value = await callable();
			} catch (err) {
				console.log('error', err, err.isAbort);
			}

			const cache = {};
			cache[this.key] = currentTime;
			localStorage.setItem('_cache', this.serialize(cache));
			// Preferences.set({ key: '_cache', value: this.serialize(cache) });
		}
	}

	serialize(value) {
		return JSON.stringify(value);
	}

	deserialize(value) {
		return JSON.parse(value);
	}
}
export function getTimeElapsed(dateString) {
	const date = new Date(dateString);
	const elapsedTime = Date.now() - date.getTime();
	const seconds = Math.floor(elapsedTime / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) {
		return `${days}d`;
	} else if (hours > 0) {
		return `${hours}h`;
	} else if (minutes > 0) {
		return `${minutes}m`;
	} else {
		return `${seconds}s`;
	}
}

export function calculateAge(birthday) {
	const birthDate = new Date(birthday);
	const currentDate = new Date();
	let age = currentDate.getFullYear() - birthDate.getFullYear();
	const monthDifference = currentDate.getMonth() - birthDate.getMonth();
	const dayDifference = currentDate.getDate() - birthDate.getDate();
	if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
		age--;
	}
	return age;
}

export const errorLogs = $state(['error logs']);
