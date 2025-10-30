/**
 * Authenticated Fetch Utility
 *
 * Provides helper functions for making authenticated API requests with Firebase ID tokens.
 * All API routes that require authentication should use these helpers.
 */

import type { User } from 'firebase/auth';

/**
 * Get headers with Authorization token
 */
export async function getAuthHeaders(user: User | null): Promise<HeadersInit> {
  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken();

  return {
    'Authorization': `Bearer ${idToken}`,
  };
}

/**
 * Make an authenticated GET request
 */
export async function authenticatedFetch(
  url: string,
  user: User | null,
  options?: RequestInit,
): Promise<Response> {
  const authHeaders = await getAuthHeaders(user);

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });
}

/**
 * Make an authenticated POST request with JSON body
 */
export async function authenticatedPost(
  url: string,
  user: User | null,
  body: unknown,
  options?: RequestInit,
): Promise<Response> {
  const authHeaders = await getAuthHeaders(user);

  return fetch(url, {
    method: 'POST',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated PUT request with JSON body
 */
export async function authenticatedPut(
  url: string,
  user: User | null,
  body: unknown,
  options?: RequestInit,
): Promise<Response> {
  const authHeaders = await getAuthHeaders(user);

  return fetch(url, {
    method: 'PUT',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated DELETE request
 */
export async function authenticatedDelete(
  url: string,
  user: User | null,
  options?: RequestInit,
): Promise<Response> {
  const authHeaders = await getAuthHeaders(user);

  return fetch(url, {
    method: 'DELETE',
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });
}
