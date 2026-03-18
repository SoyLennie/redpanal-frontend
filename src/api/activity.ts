const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem('redpanal_token');
}

export interface Activity {
  id: number;
  verb: string;
  actor: { username: string | null; avatar_url: string | null };
  action_object_type: string | null;
  action_object: { slug?: string; name?: string } | null;
  timestamp: string;
}

export async function fetchMyActivity(): Promise<Activity[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/activity/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchFeed(): Promise<Activity[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/activity/feed/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchGlobalActivity(): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/activity/global/`);
  if (!res.ok) return [];
  return res.json();
}
