# GenSan LifeMap API (Phase 3 — Foundation)

Base URL (dev): `http://localhost:8000/api`
All responses are JSON. Collection endpoints are paginated (`per_page` default 15, max 50).

## Authentication

Public read endpoints and `POST /community-reports` need no auth.
`PATCH /community-reports/{id}/status` sits behind the `auth.required`
placeholder middleware, which currently returns `401` for every caller:

```json
{ "message": "Authentication required. Admin authentication will be enabled in the next phase." }
```

No auth system is invented in this phase; the next phase replaces the
middleware alias with real authentication (e.g. Sanctum) without route changes.

## Pagination

Every collection returns Laravel paginated resources:

```json
{
  "data": [],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 75 }
}
```

`GET /api/projects?per_page=5` — `per_page` must be an integer 1–50.

## Endpoints

### Locations

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/locations` | List locations (paginated) |
| GET | `/locations/{id}` | Single location |

Query params: `barangay` (exact), `location_type` (exact), `search` (matches name/address/barangay), `per_page`.

Example: `GET /api/locations?barangay=Lagao&per_page=10`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Sample Lagao Road Project Site",
      "address": "Sample National Highway cor. Sample St., Lagao",
      "barangay": "Lagao",
      "location_type": "project_site",
      "latitude": 6.1161,
      "longitude": 125.175,
      "created_at": "2026-09-25T00:00:00+00:00",
      "updated_at": "2026-09-25T00:00:00+00:00"
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1 }
}
```

### Projects

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/projects` | List projects with `location` eager-loaded |
| GET | `/projects/{id}` | Single project with `location` |

Query params: `status` (`planned|procurement|ongoing|completed|delayed|cancelled`),
`category` (exact string), `barangay` (via related location), `search` (title/description), `per_page`.

Example: `GET /api/projects?status=ongoing&search=road`

### Facilities

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/facilities` | List facilities with `location` eager-loaded |
| GET | `/facilities/{id}` | Single facility with `location` |

Query params: `category` (exact string), `barangay` (via related location),
`search` (name/description), `per_page`.

Example: `GET /api/facilities?category=school&barangay=Apopong`

### Announcements

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/announcements` | List announcements with `source` eager-loaded |
| GET | `/announcements/{id}` | Single announcement with `source` |

Query params: `category`, `status` (`draft|published|archived`), `search`
(title/content), `per_page`. **Listing defaults to `status=published`** so
drafts are never leaked; pass `?status=draft` explicitly to override.

Example: `GET /api/announcements?category=emergency`

### Data sources

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/data-sources` | List sources (paginated) |
| GET | `/data-sources/{id}` | Single source |

Query params: `source_type` (`official|public_document|community|system_generated`),
`search` (name/description), `per_page`.

### Community reports (controlled public surface)

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/community-reports` | List reports with safe `user` (id+name only) and `location` | No |
| GET | `/community-reports/{id}` | Single report | No |
| POST | `/community-reports` | Submit a report (multipart or JSON) | No |
| PATCH | `/community-reports/{id}/status` | Moderate status | **Required (401 until next phase)** |

List query params: `category`
(`road|flooding|garbage|streetlight|accessibility|environment|other`),
`status` (`submitted|under_review|verified|resolved|rejected`),
`search` (title/description), `per_page`.

#### Submit a report

`POST /api/community-reports` — multipart form-data (use multipart when attaching `photo`).

| Field | Rules |
|---|---|
| `user_id` | required, integer, must exist in `users` (derived from session after auth phase) |
| `location_id` | required, integer, must exist in `locations` |
| `category` | required, one of `road,flooding,garbage,streetlight,accessibility,environment,other` |
| `title` | required, string, max 255 |
| `description` | optional, string, max 5000 |
| `photo` | optional, image file, max 2 MB (stored via `public` disk under `reports/`) |

`status` is **always forced to `submitted`** server-side — any client value is
ignored (the field is not accepted). Returns `201`.

Request:

```bash
curl -X POST http://localhost:8000/api/community-reports \
  -F user_id=3 -F location_id=1 -F category=road \
  -F title="Pothole cluster near demo intersection" \
  -F description="Fictional sample report." \
  -F photo=@pothole.jpg
```

Response `201`:

```json
{
  "data": {
    "id": 8,
    "category": "road",
    "title": "Pothole cluster near demo intersection",
    "description": "Fictional sample report.",
    "photo_path": "reports/abc123.jpg",
    "status": "submitted",
    "user": { "id": 3, "name": "Sample Citizen One" },
    "location": { "id": 1, "name": "Sample Lagao Road Project Site", "...": "..." },
    "created_at": "...",
    "updated_at": "..."
  }
}
```

#### Moderate a report (protected)

`PATCH /api/community-reports/{id}/status` with JSON `{ "status": "verified" }`.
Allowed transitions only:

- `submitted` → `under_review`, `verified`, `rejected`
- `under_review` → `verified`, `rejected`, `resolved`
- `verified` → `resolved`, `rejected`
- `resolved`, `rejected` → terminal (no further transitions)

Illegal transitions return `422`. Every change writes an `audit_logs` row.

## Errors

`404` (unknown id or route under `/api/*`):

```json
{ "message": "Resource not found." }
```

`422` (validation):

```json
{
  "message": "The given data was invalid.",
  "errors": { "category": ["The selected category is invalid."] }
}
```

`401` (protected route): see Authentication above.
`429` (rate limit): API is throttled at 60 requests/minute per IP.

SQL errors, stack traces, credentials, and file paths are never exposed
(`APP_DEBUG` must be `false` in production).

## Security notes

- Only whitelisted filters/search fields; no arbitrary column filtering or sorting.
- Mass assignment limited to model `$fillable`; `status`/`photo_path` set server-side.
- Community-report `user` embeds id+name only — no email, no password hash.
- `users` and `audit_logs` have no public endpoints.
- CORS restricted to `FRONTEND_URL` (default `http://localhost:3000`); extend via `EXTRA_CORS_ORIGINS` (comma-separated), never a wildcard in production.

## Remaining limitations (next phases)

- Real authentication/authorization (Sanctum or equivalent) + role checks.
- `POST` `user_id` currently client-supplied; will come from the authenticated user.
- Photo serving requires `php artisan storage:link` on the deployment host.
- No write endpoints yet for locations/projects/facilities/announcements/sources.
