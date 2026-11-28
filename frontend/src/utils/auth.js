export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';

const USER_STORAGE_KEY = 'oldbook_user';

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};


export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};


export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', 
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập không thành công.');
  }

  const userSession = {
    id: data._id,
    fullName: data.name || data.fullName,
    email: data.email,
    role: data.role || 'user'
  };

  setCurrentUser(userSession);
  return userSession;
};


export const registerUser = async ({ fullName, email, password }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      name: fullName,
      email,
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Đăng ký không thành công.');
  }

  const userSession = {
    id: data._id,
    fullName: data.name || data.fullName,
    email: data.email,
    role: data.role || 'user'
  };

  setCurrentUser(userSession);
  return userSession;
};


export const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'GET',
    credentials: 'include'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Không tải được thông tin hồ sơ.');
  }
  const user = data.user || data;
  const userSession = {
    id: user._id,
    fullName: user.name || user.fullName,
    email: user.email,
    role: user.role || 'user'
  };
  setCurrentUser(userSession);
  return userSession;
};

export const updateProfile = async ({ fullName }) => {
  const response = await fetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name: fullName })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật hồ sơ không thành công.');
  }
  const user = data.user || data;
  const userSession = {
    id: user._id,
    fullName: user.name || user.fullName,
    email: user.email,
    role: user.role || 'user'
  };
  setCurrentUser(userSession);
  return userSession;
};

export const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.warn('Lỗi khi gọi logout API:', err);
  } finally {
    setCurrentUser(null);
  }
};

