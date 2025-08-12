import { useLocalStorage, useSessionStorage } from "./util.svelte";

// Global UI state using runes
export const theme = $state({ value: 'light' });


export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

export const currentOrg = new useLocalStorage("currentOrg", { id: null, record: null });
