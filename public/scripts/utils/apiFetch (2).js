import { apiConfig } from '../config/apiConfig.js';
import { authService } from '../auth/authService.js';

export async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('http')
    ? url
    : `${apiConfig.baseUrl}/${url.replace(/^\/+/, '')}`;

  const token = authService.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Error ${response.status}: ${errText}`);
  }

  return response.json();
}
