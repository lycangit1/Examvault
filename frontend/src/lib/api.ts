/**
 * Hardened API Client for ExamVault
 * Enforces:
 * 1. Automatic Bearer JWT header injection
 * 2. 401 Session-Expiry interception with redirection to login
 * 3. Sanitized error handling
 */

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function secureFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('examvault_access_token');
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Session Expiry or Token Revocation
    if (response.status === 401) {
      localStorage.removeItem('examvault_access_token');
      localStorage.removeItem('examvault_session_id');
      localStorage.removeItem('examvault_user_id');
      
      // Dispatch session expired custom event for AuthContext & UI notification
      window.dispatchEvent(new CustomEvent('examvault:session_expired', {
        detail: { message: 'Your session expired. Please log in again.' }
      }));
    }

    return response;
  } catch (error) {
    console.error('API network error:', error);
    throw error;
  }
}
