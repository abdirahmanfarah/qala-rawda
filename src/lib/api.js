const API_KEY = process.env.NEXT_PUBLIC_UMMAH_API_KEY;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function fetchFromUmmah(endpoint) {
    const resp = await fetch(`${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${API_KEY}`);
    return resp.json();
}

export async function fetchFromQuranCom(endpoint) {
    const resp = await fetch(`https://api.quran.com/api/v4${endpoint}`);
    return resp.json();
}

export async function fetchFromAlAdhan(endpoint) {
    const resp = await fetch(`https://api.aladhan.com/v1${endpoint}`);
    return resp.json();
}
