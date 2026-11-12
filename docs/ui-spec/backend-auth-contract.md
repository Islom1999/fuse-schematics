# Backend admin auth contract (fuse-nest-schematics, branch feat/lego-core, N2)

This supersedes `auth.md` section 2.1. Base URL: `environment.apiUrl`, e.g. `http://localhost:3000/api`.
All bodies are JSON. Protected routes need `Authorization: Bearer <accessToken>`.

## Responses
```ts
interface AuthUser { id: string; email: string; name: string; permissions: string[] }   // '*' = all
interface AuthResponse { accessToken: string; refreshToken: string; expiresIn: number; user: AuthUser } // expiresIn = seconds
interface Session {
  id: string; deviceId: string | null; deviceName: string | null; platform: string | null; os: string | null
  appVersion: string | null; ip: string; userAgent: string; createdAt: string; lastUsedAt: string; expiresAt: string
  isCurrent: boolean
}
```

## Public routes
- `POST auth/sign-in` `{ email, password }` → `AuthResponse`. 401 for bad credentials; 429 after 5 failed attempts per email+IP in 15 min.
- `POST auth/refresh` `{ refreshToken }` → `AuthResponse`, a new pair. The refresh token is **single use**: reusing an old one revokes the whole session. Never send two refresh calls in parallel; queue 401s behind one in-flight refresh.
- `POST auth/sign-in-with-token` `{ accessToken }` → `AuthResponse`, a new pair for the same session.

## Protected routes
- `POST auth/sign-out` → `{ success: true }`: ends the current session.
- `POST auth/sign-out-all` → `{ revoked: number }`.
- `GET auth/me` → `AuthUser`.
- `GET auth/sessions` → `Session[]`.
- `DELETE auth/sessions/others` → `{ revoked }`.
- `DELETE auth/sessions/:id` → `{ success }`.
- `POST auth/change-password` `{ currentPassword, newPassword }` → `{ success }`; every other session is ended.

## Device headers (optional)
The web client may send `x-device-id` (a stable random id kept in localStorage), `x-device-name`, `x-platform` (`web`) and `x-app-version`. The OS is parsed from the user-agent.
