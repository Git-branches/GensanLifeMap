# GenSan LifeMap API (Phase 3 — Foundation)

Base URL (dev): `http://localhost:8000/api`
All responses are JSON. Collection endpoints are paginated (`per_page` default 15, max 50).

## Authentication

Public discovery endpoints are read-only and do not require an account.
Account and community-report endpoints use Laravel Sanctum bearer tokens.
Report reads and submissions are scoped to the authenticated user; status
moderation is restricted to admin and moderator roles.

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

Query params: `category`, `search` (title/content), `per_page`. Public
listing always returns `status=published`; draft/archived states are only
available through the role-protected admin API.

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
| GET | `/community-reports/mine` | List only the authenticated user's reports | Sanctum |
| GET | `/community-reports/{id}` | Read an owned report; other users receive 404 | Sanctum |
| POST | `/community-reports` | Submit a report; owner is derived from the token | Sanctum |
| PATCH | `/community-reports/{id}/status` | Moderate status | Admin/moderator |

List query params: `category`
(`road|flooding|garbage|streetlight|accessibility|environment|other`),
`status` (`submitted|under_review|verified|resolved|rejected`),
`search` (title/description), `per_page`.

#### Submit a report

`POST /api/community-reports` — multipart form-data (use multipart when attaching `photo`).

| Field | Rules |
|---|---|
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
  -H "Authorization: Bearer <token>" -F location_id=1 -F category=road \
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

`PATCH /api/community-reports/{id}/status` with JSON `{ "status": "verified" }` and an admin/moderator token.
Allowed transitions only:

- `submitted` → `under_review`, `verified`, `rejected`
- `under_review` → `verified`, `rejected`, `resolved`
- `verified` → `resolved`, `rejected`
- `resolved`, `rejected` → terminal (no further transitions)

Illegal transitions return `422`. Every change writes an `audit_logs` row.

### Admin / LGU management

All routes below require a Sanctum token. `admin` and `moderator` roles may
view the overview and review community reports. Only `admin` may manage city
content, users, and audit logs.

| Method | Endpoint | Purpose | Role |
|---|---|---|---|
| GET | `/admin/overview` | Database totals and recent work | admin, moderator |
| GET | `/admin/community-reports` | Search/filter all reports | admin, moderator |
| GET | `/admin/community-reports/{id}` | Staff report detail | admin, moderator |
| GET/POST | `/admin/locations` | List/create locations | admin |
| GET/PUT/DELETE | `/admin/locations/{id}` | View/update/delete an unreferenced location | admin |
| GET/POST | `/admin/projects` | List/create projects | admin |
| GET/PUT/DELETE | `/admin/projects/{id}` | View/update/delete a project | admin |
| GET/POST | `/admin/facilities` | List/create facilities | admin |
| GET/PUT/DELETE | `/admin/facilities/{id}` | View/update/delete a facility | admin |
| GET/POST | `/admin/announcements` | List/create announcements | admin |
| GET/PUT/DELETE | `/admin/announcements/{id}` | View/update/publish/delete announcements | admin |
| GET/POST | `/admin/data-sources` | List/create sources | admin |
| GET/PUT/DELETE | `/admin/data-sources/{id}` | View/update/verify/delete an unlinked source | admin |
| GET | `/admin/users` | Search/filter users (safe fields only) | admin |
| PUT | `/admin/users/{id}/role` | Change another user's existing role | admin |
| GET | `/admin/audit-logs` | Read-only audit history | admin |

Admin content endpoints validate input server-side and write audit entries
for create/update actions. Role changes are audited; profile updates cannot
change roles, and a user cannot change their own role. Report status changes
continue to use `PATCH /community-reports/{id}/status` and the existing
transition rules. Resource collections accept `search` and `per_page`; the
existing validated filters are also available where applicable.

Content deletions require an explicit UI confirmation and are audited.
Deleting locations or data sources with dependent projects/facilities/reports
or announcements is rejected with `409` to avoid cascade loss or broken
source associations.

The schema has no general active/deactivated flag, publish flag on locations
or facilities, or archive field for city records. Those controls are
intentionally not invented; announcement publication uses its existing
`draft|published|archived` status.

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

`401` (missing/invalid Sanctum token); `403` (authenticated user lacks staff role).
`429` (rate limit): API is throttled at 60 requests/minute per IP.

SQL errors, stack traces, credentials, and file paths are never exposed
(`APP_DEBUG` must be `false` in production).

## Security notes

- Only whitelisted filters/search fields; no arbitrary column filtering or sorting.
- Mass assignment limited to model `$fillable`; `status`/`photo_path` set server-side.
- Community-report `user` embeds id+name only — no email, no password hash.
- `users` and `audit_logs` have no public endpoints.
- CORS restricted to `FRONTEND_URL` (default `http://localhost:3000`); extend via `EXTRA_CORS_ORIGINS` (comma-separated), never a wildcard in production.

## Remaining limitations

- Photo serving requires `php artisan storage:link` on the deployment host.
