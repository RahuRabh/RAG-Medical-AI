const ACCESS_TOKEN_KEY = "task-manager-access-token";
const USER_KEY = "task-manager-user";

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearStoredAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as { id: string; email: string; createdAt: string; updatedAt: string };
}

export function setStoredUser(user: { id: string; email: string; createdAt: string; updatedAt: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}
