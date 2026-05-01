// Wake up Render backend on app load
export async function pingBackend() {
  try {
    await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
  } catch {
    // Ignore — just waking up the server
  }
}
import { supabase } from '../lib/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function getToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function handleResponse(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Some endpoints may return non-JSON bodies; keep data null.
  }

  if (!res.ok) {
    const code = data?.code;
    if (res.status === 401 || code === 'UNAUTHORIZED') {
      throw new Error('Session expired. Please log in again.');
    }

    throw new Error(data?.error || 'Something went wrong');
  }
  return data;
}

export async function encryptPassword(password) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

  try {
    const res = await fetch(`${BASE_URL}/api/encrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      signal: controller.signal
    });
    return handleResponse(res);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Backend is starting up, please try again in 30 seconds.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Vault ───
export async function saveToVault(payload) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/vault/save`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function listVault(category, search) {
  const token = await getToken();
  const params = new URLSearchParams();
  if (category && category !== 'all') params.set('category', category);
  if (search) params.set('search', search);
  const res = await fetch(`${BASE_URL}/api/vault/list?${params}`, {
    headers: authHeaders(token)
  });
  return handleResponse(res);
}

export async function revealPassword(id, masterPassword) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ id, masterPassword })
  });
  return handleResponse(res);
}

// H8: DELETE uses query param instead of request body
export async function deletePassword(id) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/vault/delete?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  return handleResponse(res);
}

export async function exportVault() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/vault/export`, {
    headers: authHeaders(token)
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vaultx-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function clearAllPasswords() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/vault/clear-all`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  return handleResponse(res);
}

// ─── AI ───
export async function getAiSuggestions(password, strength) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/ai/suggest`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ password, strength })
  });
  return handleResponse(res);
}

// ─── Activity ───
export async function getRecentActivity() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/activity/recent`, {
    headers: authHeaders(token)
  });
  return handleResponse(res);
}

// ─── Auth Profile ───
export async function setupProfile(masterPassword) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/auth/setup-profile`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ masterPassword })
  });
  return handleResponse(res);
}

export async function changeMasterPassword(currentPassword, newPassword) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/auth/change-master-password`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return handleResponse(res);
}

// ─── User Profile ───
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
