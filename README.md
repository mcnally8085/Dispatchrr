# Dispatchrr

POC dispatch application.

## Backend API

This repo includes a zero-dependency Node.js backend that exposes the first set of endpoints a v0-built frontend can call while you design the UI.

### Run it

```bash
npm run dev
```

The API runs on `http://localhost:4000` by default. Set `PORT=5000` if you want a different port.

### Core Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/dashboard` | Job and driver summary for dashboard cards |
| `GET` | `/api/jobs` | List jobs. Supports `status`, `priority`, and `q` query params |
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs/:id` | Get one job with assigned driver details |
| `PATCH` | `/api/jobs/:id` | Edit job details or change status |
| `POST` | `/api/jobs/:id/assign` | Assign a driver to a job |
| `POST` | `/api/jobs/:id/status-updates` | Add a status update to a job |
| `GET` | `/api/drivers` | List drivers. Supports `status` query param |
| `POST` | `/api/drivers` | Create a driver |
| `PATCH` | `/api/drivers/:id` | Edit driver details or status |

### Example Frontend Calls

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getDashboard() {
  const response = await fetch(`${API_URL}/api/dashboard`);
  if (!response.ok) throw new Error("Failed to load dashboard");
  return response.json();
}

export async function assignDriver(jobId: string, driverId: string) {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  });

  if (!response.ok) throw new Error("Failed to assign driver");
  return response.json();
}
```

### Create a Job

```bash
curl -X POST http://localhost:4000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pickup shipment from North Yard",
    "customerName": "Brightline Supply",
    "contactName": "Morgan Davis",
    "contactPhone": "555-0300",
    "pickupAddress": "100 North Yard Rd, Dallas, TX",
    "dropoffAddress": "420 Client Ave, Austin, TX",
    "priority": "high",
    "requestedPickupAt": "2026-06-07T20:00:00.000Z",
    "dueAt": "2026-06-08T00:00:00.000Z",
    "notes": "Use bay 4."
  }'
```

### Data Model Notes

Job statuses are `new`, `assigned`, `in_progress`, `completed`, and `cancelled`.

Driver statuses are `available`, `on_job`, and `off_duty`.

This first pass stores data in memory, so records reset when the server restarts. The API boundary is intentionally simple so the next step can be adding Postgres, SQLite, or another persistent store without forcing frontend changes.
