export function getBookmarks() {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('qr_bookmarks') || '{}'); } catch { return {}; }
}

export function setBookmark(key, val) {
    const b = getBookmarks();
    if (val) b[key] = true; else delete b[key];
    localStorage.setItem('qr_bookmarks', JSON.stringify(b));
}

export function getNotes() {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('qr_notes') || '{}'); } catch { return {}; }
}

export function saveNote(key, text) {
    const n = getNotes();
    if (text.trim()) n[key] = text.trim(); else delete n[key];
    localStorage.setItem('qr_notes', JSON.stringify(n));
}

export function getTheme() {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('qr_theme') || 'light';
}

export function setTheme(theme) {
    localStorage.setItem('qr_theme', theme);
}
