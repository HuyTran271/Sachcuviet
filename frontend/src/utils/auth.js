export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';
const USER_STORAGE_KEY = 'oldbook_user';

export function getCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
    return user && typeof user === 'object' && !Array.isArray(user) ? user : null;
  } catch { return null; }
}

export function setCurrentUser(user) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch { /* The shared layout can still keep the session in memory. */ }
}

function toSession(data) {
  return {
    id: data._id || data.id,
    fullName: data.name || data.fullName,
    email: data.email,
    phone: data.phone || '',
    role: data.role || 'user',
    status: data.status || 'active',
    createdAt: data.createdAt,
  };
}

async function requestJSON(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || 'Yêu cầu không thành công. Vui lòng thử lại.');
    error.status = response.status;
    throw error;
  }
  if (!data) throw new Error('Máy chủ trả về dữ liệu không hợp lệ.');
  return data;
}

export async function loginUser({ email, password }) {
  const data = await requestJSON('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = toSession(data);
  setCurrentUser(session);
  return session;
}

export async function registerUser({ fullName, email, phone, password }) {
  const data = await requestJSON('/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fullName, email, phone, password }),
  });
  const session = toSession(data);
  setCurrentUser(session);
  return session;
}

export async function getUserProfile({ signal } = {}) {
  const data = await requestJSON('/users/profile', { signal });
  return toSession(data.user);
}

export async function logout() {
  try { await requestJSON('/auth/logout', { method: 'POST' }); }
  catch (error) { console.warn('Không thể kết nối khi đăng xuất:', error.message); }
  finally { setCurrentUser(null); }
}
