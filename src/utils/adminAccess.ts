const ADMIN_PASSWORD_KEY = "admin_password_v1";

export function getAdminPassword(): string | null {
  try {
    const v = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    return v && typeof v === "string" ? v : null;
  } catch {
    return null;
  }
}

export function setAdminPassword(password: string) {
  try {
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
  } catch {
    return;
  }
}

export function clearAdminPassword() {
  try {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  } catch {
    return;
  }
}

export function hasAdminAccess() {
  return Boolean(getAdminPassword());
}

export function getAdminHeaders(): Record<string, string> | null {
  const password = getAdminPassword();
  if (!password) return null;
  return { "x-admin-password": password };
}
