// Frontend\src\utils\api.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      // Don't redirect if we're already on the login/signup routes
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/signup')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Small delay to allow any pending state updates before reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }

    return response;
  } catch (error) {
    console.error('apiFetch Network Error:', error);
    throw error;
  }
}
