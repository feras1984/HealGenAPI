# HealGen Integration Application — Architecture Audit & Wave Implementation Plan

**Date:** September 22, 2026  
**Status:** Wave 0 Architecture Audit (Completed)  
**Target Repository:** `HealGenAPI`  

---

## 1. Backend Architecture

### 1.1 Technology & Framework Overview
- **Framework:** Laravel 10.x / PHP 8.x
- **Database Engine:** Microsoft SQL Server (`sqlsrv` driver, Host: `FerasPC\MSSQLSERVER2022`, Database: `HealgenIntegration`)
- **Frontend Bridge:** Inertia.js (`inertiajs/inertia-laravel`)

### 1.2 Architectural Layers & Code Flow
The existing backend follows a strict 4-layer architecture for web/Inertia requests:

```
Inertia Page (React)
    ↓
Laravel Routes (routes/web.php with middleware)
    ↓
Laravel Controller (app/Http/Controllers/*)
    ↓
Service Facade (app/Facades/*) / Concrete Service (app/Services/*)
    ↓
Eloquent Model / Query Builder (app/Models/* or DB::table)
    ↓
SQL Server Database
```

#### Layer Breakdown:
1. **Controllers (`app/Http/Controllers/`):**
   - Controllers extend `App\Http\Controllers\Controller`.
   - Responsible for receiving requests, invoking service layers, and returning Inertia page responses (`Inertia::render('Page/Path', $props)`) for views, or JSON responses (`response()->json(...)`) for async actions (form submits, status toggles, image uploads).
   - Form validation is delegated to Form Request classes (`app/Http/Requests/*`).
   - Exceptions are caught inside try/catch blocks and returned as standard JSON error payloads with appropriate HTTP status codes (e.g., `500 Internal Server Error`, `404 Not Found`).

2. **Services & Facades (`app/Services/` and `app/Facades/`):**
   - All business logic, DB queries, data formatting, and model mappings are encapsulated in Service classes.
   - **Service Registration:** Service singletons are registered in `App\Providers\AppServiceProvider.php` (e.g., `$this->app->singleton('PatientHeaderService', ...)`).
   - **Facades:** Laravel Facades in `app/Facades/` inherit from `Illuminate\Support\Facades\Facade` and provide static accessors (e.g., `PatientHeaderService::getPatients()`).

3. **Eloquent Models & Data Access (`app/Models/`):**
   - Use Eloquent models for application entities (`User`, `Admin`, `Customer`, `PatientHeader`, `PatientTest`, `Location`, `Device`, `DeviceType`, `DeviceUser`).
   - Query Builder (`DB::table(...)`) is also utilized for low-level performance-critical queries (e.g., in `PatientService.php`).

4. **Middleware & Authentication / Authorization:**
   - **Authentication:** Dual guard setup (`auth` and custom `admin.auth` via `AdminAuthenticate`).
   - **Authorization:** Polymorphic user architecture (`User` morphs to `Admin` or `Customer`). `UserPolicy` defines the `admin` gate checked by `AdminAuthorization` middleware.
   - **Roles:** Defined in `App\Enums\AdminRoleEnum` (`Administrator`, `Supervisor`, `Inspector`, `Employee`). `Admin` model contains a `role` column.

5. **Routes (`routes/web.php` & `routes/api.php`):**
   - `routes/web.php`: Protected by `['admin.auth']` or `['admin.auth', 'admin.authorize']`. Serves Inertia views and POST/PATCH CRUD endpoints.
   - `routes/api.php`: Protected by `['his.auth', 'his.logger']` for HIS integration endpoints.

---

## 2. Frontend Architecture

### 2.1 Technology Overview
- **Core Libraries:** React 18, TypeScript, Inertia.js (`@inertiajs/react`), Vite
- **UI Components:** MUI (Material UI `@mui/material`, `@mui/icons-material`), Syncfusion (`@syncfusion/ej2-react-grids`)
- **Forms & Validation:** Zod, React Hook Form (`useForm`, `FormProvider`, `Controller`), `@hookform/resolvers/zod`
- **Service & Dependency Injection:** `typedi` (`@Service()`, `Container.get(...)`), `reflect-metadata`

### 2.2 Reusable Frontend Component Architecture

#### 1. ValidatedComponents (`resources/js/Components/ValidatedComponents/`):
The project uses custom wrapper components that bind MUI inputs directly to React Hook Form's `Controller`:
- **`ValidatedInput`**: Wraps MUI `TextField` with `Controller`, displaying validation errors via `FormHelperText`.
- **`ValidatedSelect`**: Wraps MUI `Select`, `MenuItem`, and `FormControl`.
- **`ValidatedCheckbox`**: Wraps MUI `Checkbox` with label.
- **`ValidatedSwitch`**: Wraps MUI `Switch`.
- **`ValidatedImage`**: Custom image picker and uploader control.
- **`ValidatedDatePicker`**, **`ValidatedPhoneInput`**, **`ValidatedAutoGenerateInput`**, **`ValidatedPercentInput`**.

*Rule:* All CRUD forms MUST use these `ValidatedComponents` instead of bare MUI elements.

#### 2. Syncfusion Table Pattern (`GridComponent`):
Data grids use Syncfusion's `@syncfusion/ej2-react-grids`:
- **Structure:** `GridComponent` wrapped with `ColumnsDirective` and `ColumnDirective`.
- **Injected Modules:** `[Page, Toolbar, ExcelExport, PdfExport, Selection, Sort, Search, Filter, RowDD]`.
- **Data Binding:** Grid `dataSource` is passed from state populated by `typedi` service mappers (e.g. `patientService.mapBlocksGrid(patients)`).
- **State Management:** Container/Context pattern (e.g., `PatientContainer.tsx` + `PatientsContext.tsx` + `PatientGrid.tsx`) providing grid data, loading states, page sizes, search handlers, and action callbacks.

#### 3. Frontend Service Layer (`typedi`):
- Service classes are decorated with `@Service()` from `typedi` (e.g., `AdminService.ts`, `PatientService.ts`).
- Instantiated inside React components using `Container.get(ServiceName)` (e.g., `const adminService = Container.get(AdminService)`).
- Handle HTTP requests using `axios` or format data grid models.

#### 4. Form Validation Pattern (Zod + React Hook Form):
- Zod schemas defined in form components (e.g. `const schema = z.object({...})`).
- Schema types inferred via `z.infer<typeof schema>`.
- React Hook Form initialized with `zodResolver(schema)` and `mode: "onBlur"`.
- Form wrapped in `<FormProvider {...methods}>` submitting via `methods.handleSubmit(onSubmit)`.

#### 5. TypeScript Models (`resources/js/models/`):
- Models are defined as TypeScript classes with constructor parameter object defaults (e.g., `class PatientHeader { constructor({ id = -1, ... }) { ... } }`).

---

## 3. Existing HealGen D600 Integration Flow

### 3.1 Data Flow & Processing
```
HealGen D600 Analyzer Device
    ↓ (Interface / Listener Service)
Database Tables (PatientHeader & PatientTests)
    ↓
Status: "Imported"
    ↓
HIS Pull / Push Process (HisPatientController & HISService)
    ↓
Status Updated: "SentToHIS" or "FailedToSend"
```

### 3.2 Data Structure
- **`PatientHeader` Table:** Primary key `Id`. Fields: `PatientId`, `DonorId`, `CollectionSite`, `CupLotNumber`, `Status`, `CreatedAt`, `UpdatedAt`.
- **`PatientTests` Table:** Primary key `Id`. Foreign key `PatientHeaderId`. Fields: `Substance`, `SoftwareResult`, `VisualResult`.

### 3.3 Integration Status Lifecycle
1. `Imported`: Default status when results are ingested from HealGen device interface.
2. `SentToHIS`: Result successfully transmitted to external HIS via HL7 message or pulled by HIS and acknowledged with `AA`.
3. `FailedToSend`: HIS transmission failed or returned negative acknowledgment `AE`.

### 3.4 API & Background Jobs
- **HIS API Routes (`routes/api.php`):** `/api/his/patients/pending`, `/api/his/patients/{id}`, `/api/his/ack`, `/api/his/patients/{id}/send`.
- **Background Dispatch:** `SendPatientToHISJob` dispatches asynchronous delivery tasks using `HISService` and `HL7Service` (generates standard `ORU^R01` HL7 v2 messages).

---

## 4. Database & SQL Server Specifics

### 4.1 Connection & Engine
- Connection name: `sqlsrv`
- Host: `FerasPC\MSSQLSERVER2022`
- Database: `HealgenIntegration`

### 4.2 SQL Server Compatibility Rules (CRITICAL)
- **ON DELETE RESTRICT is NOT supported by SQL Server.**
- **Rule:** DO NOT use `->restrictOnDelete()` in Laravel migrations. Use `->cascadeOnDelete()`, `->nullOnDelete()`, or omit explicit delete actions.
- Auto-increment primary keys use `$table->id()`.
- Unique constraints use `$table->unique(...)` or `$table->string(...)->unique()`.

---

## 5. New Implementation Map (Waves 1–7)

### Wave 1: Locations, Device Types, Devices, Device/User Assignments

#### Backend Files:
- **Migrations:**
  - `database/migrations/2026_09_22_060447_create_locations_table.php` (Existing)
  - `database/migrations/2026_09_22_060457_create_device_types_table.php` (Existing)
  - `database/migrations/2026_09_22_060514_create_devices_table.php` (Existing)
  - `database/migrations/2026_09_22_060529_create_device_users_table.php` (Existing - verify table drop in `down()`)
- **Models:**
  - `app/Models/Location.php` (Extend fillable, casts, relations)
  - `app/Models/DeviceType.php` (Extend fillable, casts, relations)
  - `app/Models/Device.php` (Extend fillable, casts, relations)
  - `app/Models/DeviceUser.php` (Extend fillable, casts, relations)
- **Services & Facades:**
  - `app/Services/LocationService/LocationService.php` + `app/Facades/LocationService/LocationService.php`
  - `app/Services/DeviceTypeService/DeviceTypeService.php` + `app/Facades/DeviceTypeService/DeviceTypeService.php`
  - `app/Services/DeviceService/DeviceService.php` + `app/Facades/DeviceService/DeviceService.php`
  - `app/Services/DeviceUserService/DeviceUserService.php` + `app/Facades/DeviceUserService/DeviceUserService.php`
  - Bindings in `app/Providers/AppServiceProvider.php`.
- **Controllers & Requests:**
  - Implement `LocationController.php`, `DeviceTypeController.php`, `DeviceController.php`, `DeviceUserController.php`.
  - Create Form Requests: `LocationRequest`, `DeviceTypeRequest`, `DeviceRequest`, `DeviceUserRequest`.
- **Routes:** Add web routes in `routes/web.php` under `admin.auth` middleware group.

#### Frontend Files:
- **TypeScript Models:**
  - `resources/js/models/location/Location.ts`
  - `resources/js/models/device/DeviceType.ts`
  - `resources/js/models/device/Device.ts`
  - `resources/js/models/device/DeviceUser.ts`
- **Frontend Services (`typedi`):**
  - `resources/js/Services/LocationService/LocationService.ts`
  - `resources/js/Services/DeviceTypeService/DeviceTypeService.ts`
  - `resources/js/Services/DeviceService/DeviceService.ts`
  - `resources/js/Services/DeviceUserService/DeviceUserService.ts`
- **Pages & Containers (`resources/js/Pages/Admin/`):**
  - `Location/LocationList.tsx`, `LocationAdd.tsx`, `LocationEdit.tsx` + `Services/LocationService/State/LocationContainer.tsx` & `LocationGrid.tsx` & `LocationContext.tsx`
  - `DeviceType/DeviceTypeList.tsx`, `DeviceTypeAdd.tsx`, `DeviceTypeEdit.tsx` + state container & Syncfusion grid.
  - `Device/DeviceList.tsx`, `DeviceAdd.tsx`, `DeviceEdit.tsx` + state container & Syncfusion grid.
  - `DeviceUser/DeviceUserList.tsx`, `DeviceUserAssign.tsx` + state container & Syncfusion grid.

---

### Wave 2: PatientHeaders Device Association
- Migration to add `device_id` (foreign key) and `device_code` to `PatientHeader` table.
- Update `PatientHeader` model and `PatientHeaderService`.
- Logic update: Check device `is_active` status upon ingestion. If inactive, record result but mark status as `Blocked` / `InactiveDevice`.

---

### Wave 3: Test Monitor
- Create Monitor UI and backend queries for live result monitoring across locations and devices.

---

### Wave 4: Inspector Workflow
- Add Inspector pending tests queue page, visual inspection controls, accept/reject actions, and audit logging.

---

### Wave 5: Supervisor Workflow
- Add Supervisor confirm/reject queue, approval actions, and dispatch to HIS.

---

### Wave 6: Role Dashboards
- Create role-tailored dashboards for Employee (assigned devices only), Inspector, Supervisor, and Administrator.

---

### Wave 7: Audit, Permissions, Validation, Testing and Hardening
- Complete system audit logging, security role checks, end-to-end tests, SQL Server index optimization, and production readiness checks.

---

## 6. Risks, Conflicts & SQL Server Considerations

1. **SQL Server `ON DELETE RESTRICT` Prohibition:**
   - Standard Laravel migrations that call `->restrictOnDelete()` will crash on SQL Server. Must ensure all foreign keys use compatible actions.
2. **Table Naming Convention Consistency:**
   - In `2026_09_22_060529_create_device_users_table.php`, the table created is `device_user` (singular pivot name), but `down()` referenced `device_users`. This should be kept consistent as `device_user`.
3. **Existing PascalCase Schema (`PatientHeader`, `PatientTests`):**
   - Integration tables use PascalCase column names (`Id`, `PatientId`, `DonorId`, `CupLotNumber`, `Status`, `CreatedAt`). New tables follow standard snake_case (`location_id`, `is_active`, `created_at`). Code mapping must preserve this distinction.

---

## 7. Readiness Statement

**Wave 0 Architecture Audit is complete.**  
The repository architecture, design patterns, validation flow, service structures, and database constraints have been fully analyzed and documented.

The codebase is ready for **Wave 1** implementation upon explicit instruction.
