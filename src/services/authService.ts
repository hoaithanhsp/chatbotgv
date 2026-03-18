import { ACCOUNTS, type UserAccount } from '../data/accounts';

const AUTH_SESSION_KEY = 'auth_session';

export interface AuthSession {
  username: string;
  name: string;
  loginAt: string;
}

/**
 * Đăng nhập — kiểm tra username/password, lưu session vào localStorage
 * @returns AuthSession nếu thành công, null nếu thất bại
 */
export const login = (username: string, password: string): AuthSession | null => {
  const account = ACCOUNTS.find(
    (a: UserAccount) => a.username.toLowerCase() === username.toLowerCase() && a.password === password
  );
  if (!account) return null;

  const session: AuthSession = {
    username: account.username,
    name: account.name,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
};

/**
 * Đăng xuất — xóa session khỏi localStorage
 */
export const logout = (): void => {
  localStorage.removeItem(AUTH_SESSION_KEY);
};

/**
 * Lấy session hiện tại (nếu đã đăng nhập)
 */
export const getCurrentUser = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

/**
 * Kiểm tra đã đăng nhập chưa
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};
