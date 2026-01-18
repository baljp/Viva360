/**
 * API Utility for Viva360
 * Handles communication with Vercel Serverless Functions
 */

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const endpoints = {
  professionals: 'professionals',
  clinics: 'clinics',
  // Add more as needed
};
