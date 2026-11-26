# Direct Expert Review and Decision Workflow

**Last Updated:** November 27, 2026  
**Target Repository:** `HealGenAPI`

---

## 1. Overview

The **Expert** role (formerly Supervisor) can directly review, **Confirm**, or **Reject** tests submitted by **Employees** (via HealGen D600 device ingestion) without waiting for or requiring any action from an **Inspector**.

The **Inspector** workflow remains fully independent and unchanged for location-scoped inspection (`Forward` / `Retest`).

---

## 2. Independent Workflow Rules

- **Employee / Device Ingestion:** Active devices create tests in `PatientHeader` with `Status = 'Imported'` (inactive devices create `'Blocked'`). Employees can attach/replace/remove PDF or image files on their assigned devices.
- **Inspector Path (Unchanged):**
  - Strictly scoped to the Inspector's single active assigned location (`location_inspectors`).
  - Pending statuses: `['Imported', 'Awaiting Inspection']`.
  - Actions: Forward (`INSPECTOR_ACCEPT` → `'Inspector Accepted'`) or Retest (`INSPECTOR_REJECT` → `'Inspector Rejected'`).
- **Direct Expert Path:**
  - System-wide visibility across all locations and devices (matching existing `AdminPatientQueryStrategy` / `AdminLocationAccessStrategy` / `AdminMonitorScopeStrategy`).
  - Eligible statuses: `['Imported', 'Awaiting Inspection', 'Inspector Accepted', 'Awaiting Supervisor']`.
  - Actions:
    - **Review (`POST /supervisor/tests/{patientHeader}/review`):** Logs a deduplicated `EXPERT_REVIEW` audit entry without altering test status.
    - **Confirm (`POST /supervisor/tests/{patientHeader}/confirm`, `POST /supervisor/tests/bulk-confirm`):** Atomically transitions status to `'Confirmed'` under `lockForUpdate()`, logs `EXPERT_CONFIRM`, and dispatches `SendPatientToHISJob` post-commit.
    - **Reject (`POST /supervisor/tests/{patientHeader}/reject`):** Requires `reason` (3–1000 chars), atomically transitions status to `'Supervisor Rejected'` (localized as `"Expert Rejected"` / `"مرفوض من الخبير"`), logs `EXPERT_REJECT`, and does not dispatch to HIS.
  - **Finality & Independence:** Expert Confirm/Reject is final, creates zero Inspector actions, and blocks stale Inspector or duplicate Expert mutations (`409 Conflict`). Tests rejected by an Inspector (`'Inspector Rejected'`) remain excluded from Expert confirmation (`409 Conflict`).

---

## 3. Authorization & Role Separation

- **Expert Dashboard & Mutations (`/supervisor/*`):** Strictly restricted to `Expert` and `Administrator` (Inspector, Employee, and other roles receive `403`; unauthenticated receive `401`).
- **Inspector Queue (`/inspector/*`):** Restricted to `Inspector` (location-scoped) and `Administrator` (prevents Experts from inadvertently recording Inspector actions).
- **Test Files (`/tests/{patient}/file/*`):** Experts and Administrators can preview/download files across all locations; upload/delete remains strictly `Employee` (assigned devices only).

---

## 4. Audit Trail & History

Every Expert action is recorded in both `patient_test_actions` and `system_audit_logs` with test ID, user ID, role at action time, action code (`EXPERT_REVIEW`, `EXPERT_CONFIRM`, `EXPERT_REJECT`), status transition (`previous_status` → `new_status`), location ID, note/reason, IP address, and timestamp.

Historical `SUPERVISOR_CONFIRM` and `SUPERVISOR_REJECT` records remain fully backward-compatible across KPIs, charts, recent activity, attribution cards, exports, and chronological test history timelines.
