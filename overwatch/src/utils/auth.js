const AUTH_USER_STORAGE_KEY = 'overwatch-auth-user'
// legacy key used before backend migration
const LEGACY_USERS_KEY = 'overwatch-users'

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function getStoredAuthUser() {
  return readStorage(AUTH_USER_STORAGE_KEY, null)
}

export function isAuthenticated() {
  return Boolean(getStoredAuthUser())
}

export function logoutUser() {
  localStorage.removeItem(AUTH_USER_STORAGE_KEY)
}

// Migrate users stored in localStorage to backend database.
// Runs once on app start; skips users that already exist in the DB.
export async function migrateLegacyUsers() {
  const legacyUsers = readStorage(LEGACY_USERS_KEY, [])
  if (!legacyUsers.length) return

  for (const user of legacyUsers) {
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          realName: user.realName || user.username,
          phone: user.phone || '10000000000',
          password: user.password,
        }),
      })
      // 409 Conflict means user already exists in DB — that's fine, skip silently
    } catch {
      // network errors are ignored; migration will retry on next app start
    }
  }

  // Remove legacy data after migration attempt
  localStorage.removeItem(LEGACY_USERS_KEY)
}

export async function registerUser({ username, realName, phone, password, role }) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, realName, phone, password, role }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '注册失败')
  return data
}

export async function loginUser({ username, password }) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '登录失败')

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(data))
  return data
}
