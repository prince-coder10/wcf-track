# WCF Evangelism & Follow-up Tracker — Attendance Sync API

## Overview

This document explains how to integrate your check-in app with the WCF Evangelism & Follow-up Tracker. When a session ends (e.g. the leader taps **"End Session"**), your app sends the list of **absentee members** to the endpoint below. The tracker then makes those members visible to the follow-up team so they can reach out.

---

## Endpoint

```
POST  https://wcf-track.vercel.app/api/v1/sync/attendance
```

> Replace `<TRACKER_DOMAIN>` with the actual deployed URL (e.g. `wcf-track.vercel.app`).  
> During development you can use `http://localhost:3000/api/v1/sync/attendance`.

---

## Authentication

Every request **must** include the API key in the `x-api-key` header.

| Header         | Value                      |
| -------------- | -------------------------- |
| `x-api-key`    | _(the key you were given)_ |
| `Content-Type` | `application/json`         |

**Example:**

```http
POST /api/v1/sync/attendance HTTP/1.1
Host: wcf-track.vercel.app
x-api-key: wcf_sync_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

If the key is missing or wrong, the API returns:

```json
{ "error": "Unauthorized. Invalid or missing API key." }
```

with HTTP status **401**.

---

## Request Body

```jsonc
{
  // Which service just ended — pick one of the four values below
  "event": "sunday_service",

  // The date/time the session took place (ISO 8601 string)
  "sessionDate": "2026-11-24T10:00:00.000Z",

  // Array of members who were ABSENT from this session
  "absentees": [
    {
      "fullName": "Boluwatife Adeleke", // required — full name
      "phone": "08012345678", // required — any Nigerian format
      "hostel": "Tedder Hall", // required — hall of residence
      "roomOrBlock": "Block B, Room 14", // optional
      "unit": "Ushering", // optional — ministry unit
      "newMember": false, // optional — true if fresher/new member
      "lastCheckInDate": "2026-11-08T10:00:00Z", // required — last time they attended ANY event
    },
  ],
}
```

### Allowed `event` Values

| Value            | Day      | Service                        |
| ---------------- | -------- | ------------------------------ |
| `prayer_meeting` | Monday   | Prayer Meetings                |
| `fjc`            | Tuesday  | Freshers Jewel Committee (FJC) |
| `bible_study`    | Thursday | Bible Study                    |
| `sunday_service` | Sunday   | Main Service                   |

### Field Reference

| Field                         | Type    | Required | Description                                                     |
| ----------------------------- | ------- | -------- | --------------------------------------------------------------- |
| `event`                       | string  | ✅       | One of the four event codes above                               |
| `sessionDate`                 | string  | ✅       | ISO 8601 date of the session (e.g. `2026-11-24T10:00:00Z`)      |
| `absentees`                   | array   | ✅       | At least one absentee member object                             |
| `absentees[].fullName`        | string  | ✅       | Member's full name                                              |
| `absentees[].phone`           | string  | ✅       | Phone number (any format: `0801...`, `+234801...`, `234801...`) |
| `absentees[].hostel`          | string  | ✅       | Hall of residence / hostel name                                 |
| `absentees[].roomOrBlock`     | string  | ❌       | Room number or block info                                       |
| `absentees[].unit`            | string  | ❌       | Ministry unit (e.g. Choir, Ushering, Follow-up)                 |
| `absentees[].newMember`       | boolean | ❌       | `true` if the member is a fresher or new. Defaults to `false`   |
| `absentees[].lastCheckInDate` | string  | ✅       | ISO 8601 date of their most recent attendance at any event      |

> **Phone number handling:** The API normalizes all phone formats automatically. Send whatever format your database already stores — `08012345678`, `+2348012345678`, or `2348012345678` all work.

---

## Success Response

**HTTP 200**

```json
{
  "ok": true,
  "message": "Attendance sync successful",
  "event": "sunday_service",
  "sessionDate": "2026-11-24T10:00:00.000Z",
  "processed": 12,
  "newMembersAdded": 3,
  "membersUpdated": 9
}
```

| Field             | Description                                       |
| ----------------- | ------------------------------------------------- |
| `processed`       | Total absentees in this sync batch                |
| `newMembersAdded` | Members that didn't exist before and were created |
| `membersUpdated`  | Members that already existed and were updated     |

---

## Error Responses

| Status | Meaning            | Example `error` message                                             |
| ------ | ------------------ | ------------------------------------------------------------------- |
| 401    | Bad or missing key | `"Unauthorized. Invalid or missing API key."`                       |
| 400    | Malformed JSON     | `"Malformed JSON payload"`                                          |
| 422    | Validation failed  | `"Invalid event name"` or `"At least one absentee member required"` |

A **422** response also includes an `issues` array with details:

```json
{
  "error": "Validation failed",
  "issues": [{ "path": ["event"], "message": "Invalid event name" }]
}
```

---

## Code Examples

### JavaScript / Node.js (fetch)

```javascript
const API_URL = "https://wcf-track.vercel.app/api/v1/sync/attendance";
const API_KEY = "wcf_sync_xxxxxxxxxxxxxxxxxxxx";

async function syncAbsentees(event, sessionDate, absentees) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ event, sessionDate, absentees }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Sync failed:", data.error);
    return;
  }

  console.log(
    `Synced ${data.processed} absentees (${data.newMembersAdded} new)`,
  );
}

// Example: Call this when "End Session" is clicked
syncAbsentees("sunday_service", new Date().toISOString(), [
  {
    fullName: "Boluwatife Adeleke",
    phone: "08012345678",
    hostel: "Tedder Hall",
    roomOrBlock: "Block B, Room 14",
    unit: "Ushering",
    newMember: false,
    lastCheckInDate: "2026-11-08T10:00:00.000Z",
  },
]);
```

### cURL (for quick testing)

```bash
curl -X POST https://wcf-track.vercel.app/api/v1/sync/attendance \
  -H "Content-Type: application/json" \
  -H "x-api-key: wcf_sync_xxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "event": "sunday_service",
    "sessionDate": "2026-11-24T10:00:00.000Z",
    "absentees": [
      {
        "fullName": "Boluwatife Adeleke",
        "phone": "08012345678",
        "hostel": "Tedder Hall",
        "lastCheckInDate": "2026-11-08T10:00:00.000Z"
      }
    ]
  }'
```

---

## Behaviour Notes

- **Duplicate handling**: If the same phone number is sent across multiple syncs, the existing record is **updated** (not duplicated). The member's details, last session, and last check-in date are refreshed.
- **Status reset**: When a member reappears in a sync, their follow-up status is automatically reset to `"pending"` so the team knows to reach out again.
- **Idempotent**: Sending the same payload twice is safe and produces the same result.
- **No attendance tracking needed on your side**: Just send the absentees. The follow-up tracker handles assignment, outreach logging, and status tracking from there.

---

## Questions?

Reach out to the WCF Evangelism & Follow-up Tracker team for the actual API key or if you need any changes to the payload format.
