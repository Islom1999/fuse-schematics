const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const DEVICE_ID_KEY = 'deviceId'

export interface StoredTokens {
  accessToken: string | null
  refreshToken: string | null
  /** True when the tokens live in `localStorage` (remember me). */
  persistent: boolean
}

function store(persistent: boolean): Storage | null {
  try {
    return persistent ? globalThis.localStorage : globalThis.sessionStorage
  } catch {
    return null
  }
}

function read(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) || null
  } catch {
    return null
  }
}

function write(storage: Storage | null, key: string, value: string | null): void {
  try {
    if (value) storage?.setItem(key, value)
    else storage?.removeItem(key)
  } catch {
    // Storage blocked or full: the session then lasts only as long as the page.
  }
}

/**
 * Token persistence. Remember me keeps the tokens in `localStorage`, otherwise they go to
 * `sessionStorage`. Reads check `localStorage` first; a write clears the other store.
 */
export const AuthTokenStorage = {
  read(): StoredTokens {
    const local = store(true)
    const localAccess = read(local, ACCESS_TOKEN_KEY)
    const localRefresh = read(local, REFRESH_TOKEN_KEY)
    if (localAccess || localRefresh) return { accessToken: localAccess, refreshToken: localRefresh, persistent: true }
    const session = store(false)
    return {
      accessToken: read(session, ACCESS_TOKEN_KEY),
      refreshToken: read(session, REFRESH_TOKEN_KEY),
      persistent: false,
    }
  },

  write(accessToken: string, refreshToken: string | null, persistent: boolean): void {
    const target = store(persistent)
    const other = store(!persistent)
    write(target, ACCESS_TOKEN_KEY, accessToken)
    write(target, REFRESH_TOKEN_KEY, refreshToken)
    write(other, ACCESS_TOKEN_KEY, null)
    write(other, REFRESH_TOKEN_KEY, null)
  },

  clear(): void {
    for (const persistent of [true, false]) {
      const target = store(persistent)
      write(target, ACCESS_TOKEN_KEY, null)
      write(target, REFRESH_TOKEN_KEY, null)
    }
  },

  /** A stable random id for this browser, sent as `x-device-id`. */
  deviceId(): string {
    const local = store(true)
    let id = read(local, DEVICE_ID_KEY)
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
      write(local, DEVICE_ID_KEY, id)
    }
    return id
  },
}
