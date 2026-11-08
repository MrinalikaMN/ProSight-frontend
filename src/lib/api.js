import axios from 'axios';

// One shared API client for the whole app.
// - baseURL comes from VITE_API_URL (see .env / .env.development)
// - a 15 second timeout, so a dead server shows an error instead of loading forever
// - the login token is attached automatically
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Spring answers 403 both for "your login expired" and for "the server hit an error"
// (its error page also requires login). So before signing the user out, check that the
// login is really invalid with a cheap request that needs a valid token.
async function loginStillValid() {
  try {
    await axios.get(`${API_URL}/api/dashboard/stats`, {
      timeout: 8000,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return true;
  } catch (e) {
    const s = e.response?.status;
    return !(s === 401 || s === 403);
  }
}

function signOut() {
  const theme = localStorage.getItem('prosight-theme');
  localStorage.clear();
  if (theme) localStorage.setItem('prosight-theme', theme);
  window.location.href = '/login?expired=1';
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const isAuthCall = error.config?.url?.includes('/api/auth/');
    if ((status === 401 || status === 403) && !isAuthCall && localStorage.getItem('token')) {
      if (await loginStillValid()) {
        // Logged in fine, so this was a server-side failure. Report it, don't sign out.
        error.serverRefused = true;
      } else {
        signOut();
      }
    }
    return Promise.reject(error);
  }
);

// Turn any axios error into one plain sentence the user can act on.
export function errorMessage(error, fallback = 'Something went wrong.') {
  if (!error) return fallback;
  if (error.code === 'ECONNABORTED') {
    return `The server at ${API_URL} took too long to respond. Check that the backend is running.`;
  }
  if (error.serverRefused) {
    return `${fallback} The server refused or hit an error. Check the IntelliJ Run window for details.`;
  }
  if (!error.response) {
    return `Can't reach the server at ${API_URL}. Check that the backend is running.`;
  }
  const data = error.response.data;
  if (typeof data === 'string' && data.length < 200) return data;
  if (data?.message) return data.message;
  return `${fallback} (error ${error.response.status})`;
}

export default api;
