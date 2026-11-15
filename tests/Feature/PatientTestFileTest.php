<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\DeviceUser;
use App\Models\File;
use App\Models\Location;
use App\Models\LocationInspector;
use App\Models\PatientHeader;
use App\Models\PatientTest;
use App\Models\SystemAuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PatientTestFileTest extends TestCase
{
    protected Location $location1;
    protected Location $location2;
    protected Device $device1;
    protected Device $device2;
    protected User $adminUser;
    protected User $supervisorUser;
    protected User $inspector1;
    protected User $inspector2;
    protected User $employee1;
    protected User $employee2;
    protected PatientHeader $patient1;
    protected PatientHeader $patient2;

    protected function setUp(): void
    {
        parent::setUp();

        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);
        DB::purge();

        Storage::fake('public');

        $this->createSchema();
        $this->seedTestData();
    }

    protected function createSchema(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('code', 10)->unique();
            $table->string('direction', 10)->default('ltr');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 50)->unique();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('device_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_type_id')->nullable();
            $table->foreignId('location_id')->nullable();
            $table->string('name', 150);
            $table->string('device_code', 50)->unique();
            $table->string('serial_number', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('device_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('assigned_at')->nullable();
            $table->dateTime('unassigned_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('role');
            $table->timestamps();
        });

        Schema::create('location_inspectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('assigned_at');
            $table->dateTime('unassigned_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['location_id', 'is_active']);
            $table->index(['user_id', 'is_active']);
        });

        Schema::create('PatientHeader', function (Blueprint $table) {
            $table->id('Id');
            $table->string('PatientId')->nullable();
            $table->string('DonorId')->nullable();
            $table->string('CollectionSite')->nullable();
            $table->string('CupLotNumber')->nullable();
            $table->string('Status')->default('Awaiting Inspection');
            $table->unsignedBigInteger('DeviceId')->nullable();
            $table->string('DeviceCode')->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });

        Schema::create('PatientTests', function (Blueprint $table) {
            $table->id('Id');
            $table->unsignedBigInteger('PatientHeaderId');
            $table->string('Substance')->nullable();
            $table->string('SoftwareResult')->nullable();
            $table->string('VisualResult')->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });

        Schema::create('patient_test_actions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_header_id');
            $table->foreignId('location_id')->nullable();
            $table->foreignId('user_id');
            $table->string('role');
            $table->string('action');
            $table->string('previous_status');
            $table->string('new_status');
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('url');
            $table->unsignedBigInteger('reference_id');
            $table->string('reference_type');
            $table->integer('order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_image')->default(true);
            $table->boolean('is_cover')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['reference_id', 'reference_type'], 'reference');
        });

        Schema::create('system_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name');
            $table->string('role');
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    protected function seedTestData(): void
    {
        $this->location1 = Location::create(['name' => 'Location 1 Central', 'code' => 'LOC1']);
        $this->location2 = Location::create(['name' => 'Location 2 North', 'code' => 'LOC2']);

        $devType = DeviceType::create(['name' => 'Multi-Panel Drug Screen']);
        $this->device1 = Device::create([
            'location_id' => $this->location1->id,
            'device_type_id' => $devType->id,
            'name' => 'Device LOC1',
            'device_code' => 'DEV-LOC1',
        ]);
        $this->device2 = Device::create([
            'location_id' => $this->location2->id,
            'device_type_id' => $devType->id,
            'name' => 'Device LOC2',
            'device_code' => 'DEV-LOC2',
        ]);

        $adminRef = Admin::create(['first_name' => 'Super', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create(['email' => 'admin@test.local', 'reference_id' => $adminRef->id, 'reference_type' => Admin::class]);

        $supRef = Admin::create(['first_name' => 'Chief', 'last_name' => 'Supervisor', 'role' => 'Supervisor']);
        $this->supervisorUser = User::create(['email' => 'supervisor@test.local', 'reference_id' => $supRef->id, 'reference_type' => Admin::class]);

        $insp1Ref = Admin::create(['first_name' => 'Inspector', 'last_name' => 'Alpha', 'role' => 'Inspector']);
        $this->inspector1 = User::create(['email' => 'inspector1@test.local', 'reference_id' => $insp1Ref->id, 'reference_type' => Admin::class]);

        $insp2Ref = Admin::create(['first_name' => 'Inspector', 'last_name' => 'Beta', 'role' => 'Inspector']);
        $this->inspector2 = User::create(['email' => 'inspector2@test.local', 'reference_id' => $insp2Ref->id, 'reference_type' => Admin::class]);

        $emp1Ref = Admin::create(['first_name' => 'Staff', 'last_name' => 'EmpOne', 'role' => 'Employee']);
        $this->employee1 = User::create(['email' => 'employee1@test.local', 'reference_id' => $emp1Ref->id, 'reference_type' => Admin::class]);

        $emp2Ref = Admin::create(['first_name' => 'Staff', 'last_name' => 'EmpTwo', 'role' => 'Employee']);
        $this->employee2 = User::create(['email' => 'employee2@test.local', 'reference_id' => $emp2Ref->id, 'reference_type' => Admin::class]);

        // Inspector 1 assigned to Location 1
        LocationInspector::create([
            'location_id' => $this->location1->id,
            'user_id' => $this->inspector1->id,
            'assigned_at' => Carbon::now()->subDays(5),
            'is_active' => true,
        ]);

        // Inspector 2 assigned to Location 2
        LocationInspector::create([
            'location_id' => $this->location2->id,
            'user_id' => $this->inspector2->id,
            'assigned_at' => Carbon::now()->subDays(5),
            'is_active' => true,
        ]);

        // Employee 1 assigned to Device 1
        DeviceUser::create([
            'device_id' => $this->device1->id,
            'user_id' => $this->employee1->id,
            'assigned_at' => Carbon::now()->subDays(5),
            'is_active' => true,
        ]);

        // Employee 2 assigned to Device 2
        DeviceUser::create([
            'device_id' => $this->device2->id,
            'user_id' => $this->employee2->id,
            'assigned_at' => Carbon::now()->subDays(5),
            'is_active' => true,
        ]);

        // Tests
        $this->patient1 = PatientHeader::create([
            'PatientId' => 'P-1001',
            'DonorId' => 'D-1001',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'Status' => 'Awaiting Inspection',
            'CreatedAt' => Carbon::now()->subHours(2),
            'UpdatedAt' => Carbon::now()->subHours(2),
        ]);

        $this->patient2 = PatientHeader::create([
            'PatientId' => 'P-2001',
            'DonorId' => 'D-2001',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'Status' => 'Awaiting Inspection',
            'CreatedAt' => Carbon::now()->subHours(2),
            'UpdatedAt' => Carbon::now()->subHours(2),
        ]);
    }

    public function test_employee_can_upload_pdf_file_for_assigned_device(): void
    {
        $fakePdf = UploadedFile::fake()->create('lab_report.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => true,
                'message' => 'Test file uploaded successfully!',
                'attachment' => [
                    'name' => 'lab_report.pdf',
                    'isImage' => false,
                ],
            ]);

        $this->assertDatabaseHas('files', [
            'reference_id' => $this->patient1->Id,
            'reference_type' => PatientHeader::class,
            'name' => 'lab_report.pdf',
            'is_image' => 0,
        ]);

        $this->assertDatabaseHas('system_audit_logs', [
            'user_id' => $this->employee1->id,
            'action' => 'TEST_FILE_UPLOADED',
            'entity_type' => 'PatientHeader',
            'entity_id' => (string) $this->patient1->Id,
        ]);
    }

    public function test_employee_can_upload_image_file_for_assigned_device(): void
    {
        $fakeImage = UploadedFile::fake()->image('strip_result.png', 800, 600);

        $response = $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), [
                'file' => $fakeImage,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => true,
                'attachment' => [
                    'name' => 'strip_result.png',
                    'isImage' => true,
                ],
            ]);

        $this->assertDatabaseHas('files', [
            'reference_id' => $this->patient1->Id,
            'reference_type' => PatientHeader::class,
            'name' => 'strip_result.png',
            'is_image' => 1,
        ]);
    }

    public function test_employee_cannot_upload_file_for_unassigned_device(): void
    {
        $fakePdf = UploadedFile::fake()->create('unauthorized.pdf', 200, 'application/pdf');

        // Employee 1 attempts to upload to Patient 2 (Device 2)
        $response = $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient2->Id), [
                'file' => $fakePdf,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => false,
            ]);
    }

    public function test_non_employee_roles_cannot_upload_file(): void
    {
        $fakePdf = UploadedFile::fake()->create('attempt.pdf', 200, 'application/pdf');

        // Admin
        $this->actingAs($this->adminUser)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $fakePdf])
            ->assertStatus(403);

        // Supervisor
        $this->actingAs($this->supervisorUser)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $fakePdf])
            ->assertStatus(403);

        // Inspector
        $this->actingAs($this->inspector1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $fakePdf])
            ->assertStatus(403);
    }

    public function test_upload_validation_rejects_disallowed_types_and_oversized_files(): void
    {
        // Disallowed file extension (executable)
        $badFile = UploadedFile::fake()->create('virus.exe', 100, 'application/x-msdownload');
        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $badFile])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);

        // Oversized file (> 20MB = 20480KB)
        $oversizedFile = UploadedFile::fake()->create('large.pdf', 25000, 'application/pdf');
        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $oversizedFile])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_authorized_roles_can_download_file(): void
    {
        // Upload a file first as employee 1
        $fakePdf = UploadedFile::fake()->create('report.pdf', 300, 'application/pdf');
        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $fakePdf]);

        // 1. Employee 1 (assigned to device) can download
        $this->actingAs($this->employee1)
            ->get(route('admin.tests.file.download', $this->patient1->Id))
            ->assertStatus(200);

        // 2. Administrator can download
        $this->actingAs($this->adminUser)
            ->get(route('admin.tests.file.download', $this->patient1->Id))
            ->assertStatus(200);

        // 3. Supervisor can download
        $this->actingAs($this->supervisorUser)
            ->get(route('admin.tests.file.download', $this->patient1->Id))
            ->assertStatus(200);

        // 4. Inspector 1 (assigned to Location 1) can download
        $this->actingAs($this->inspector1)
            ->get(route('admin.tests.file.download', $this->patient1->Id))
            ->assertStatus(200);
    }

    public function test_unauthorized_roles_cannot_download_file(): void
    {
        // Upload file to Patient 1 (Location 1, Device 1)
        $fakePdf = UploadedFile::fake()->create('report.pdf', 300, 'application/pdf');
        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $fakePdf]);

        // Inspector 2 is assigned to Location 2 -> should be 403 Forbidden
        $this->actingAs($this->inspector2)
            ->get(route('admin.tests.file.download', $this->patient1->Id))
            ->assertStatus(403);

        // Employee 2 is assigned to Device 2 -> should be 403 Forbidden
        $this->actingAs($this->employee2)
            ->get(route('admin.tests.file.download', $this->patient1->Id))
            ->assertStatus(403);
    }

    public function test_employee_can_delete_file_for_assigned_device_and_others_cannot(): void
    {
        // Upload file
        $fakePdf = UploadedFile::fake()->create('report.pdf', 300, 'application/pdf');
        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $this->patient1->Id), ['file' => $fakePdf]);

        $this->assertDatabaseCount('files', 1);

        // Non-employees cannot delete (403)
        $this->actingAs($this->adminUser)
            ->deleteJson(route('admin.tests.file.delete', $this->patient1->Id))
            ->assertStatus(403);

        $this->actingAs($this->supervisorUser)
            ->deleteJson(route('admin.tests.file.delete', $this->patient1->Id))
            ->assertStatus(403);

        $this->actingAs($this->inspector1)
            ->deleteJson(route('admin.tests.file.delete', $this->patient1->Id))
            ->assertStatus(403);

        // Employee 2 cannot delete Employee 1's file (403)
        $this->actingAs($this->employee2)
            ->deleteJson(route('admin.tests.file.delete', $this->patient1->Id))
            ->assertStatus(403);

        // Employee 1 can delete
        $this->actingAs($this->employee1)
            ->deleteJson(route('admin.tests.file.delete', $this->patient1->Id))
            ->assertStatus(200)
            ->assertJson([
                'status' => true,
                'message' => 'Attachment removed successfully!',
            ]);

        $this->assertDatabaseCount('files', 0);
    }

    public function test_admin_and_supervisor_can_open_any_test_details(): void
    {
        // Admin can open any test
        $this->actingAs($this->adminUser)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(200);

        $this->actingAs($this->adminUser)
            ->get(route('patient.show', $this->patient2->Id))
            ->assertStatus(200);

        // Supervisor can open any test
        $this->actingAs($this->supervisorUser)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(200);

        $this->actingAs($this->supervisorUser)
            ->get(route('patient.show', $this->patient2->Id))
            ->assertStatus(200);
    }

    public function test_inspector_can_open_test_details_related_to_current_location_only(): void
    {
        // Inspector 1 is assigned to Location 1
        // patient1 is on Device 1 in Location 1 -> Allowed (200)
        $this->actingAs($this->inspector1)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(200);

        // patient2 is on Device 2 in Location 2 -> Denied (403)
        $this->actingAs($this->inspector1)
            ->get(route('patient.show', $this->patient2->Id))
            ->assertStatus(403);

        // Inspector 2 is assigned to Location 2
        // patient2 in Location 2 -> Allowed (200)
        $this->actingAs($this->inspector2)
            ->get(route('patient.show', $this->patient2->Id))
            ->assertStatus(200);

        // patient1 in Location 1 -> Denied (403)
        $this->actingAs($this->inspector2)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(403);
    }

    public function test_inspector_without_assigned_location_cannot_open_test_details(): void
    {
        $unassignedInspRef = Admin::create(['first_name' => 'Floating', 'last_name' => 'Inspector', 'role' => 'Inspector']);
        $unassignedInspector = User::create(['email' => 'floating_insp@test.local', 'reference_id' => $unassignedInspRef->id, 'reference_type' => Admin::class]);

        $this->actingAs($unassignedInspector)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(403);
    }

    public function test_employee_can_open_only_tests_related_to_assigned_device(): void
    {
        // Employee 1 is assigned to Device 1
        // patient1 is on Device 1 -> Allowed (200)
        $this->actingAs($this->employee1)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(200);

        // patient2 is on Device 2 -> Denied (403)
        $this->actingAs($this->employee1)
            ->get(route('patient.show', $this->patient2->Id))
            ->assertStatus(403);

        // Employee 2 is assigned to Device 2
        // patient2 is on Device 2 -> Allowed (200)
        $this->actingAs($this->employee2)
            ->get(route('patient.show', $this->patient2->Id))
            ->assertStatus(200);

        // patient1 is on Device 1 -> Denied (403)
        $this->actingAs($this->employee2)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(403);
    }

    public function test_employee_without_assigned_device_cannot_open_test_details(): void
    {
        $unassignedEmpRef = Admin::create(['first_name' => 'Unassigned', 'last_name' => 'Employee', 'role' => 'Employee']);
        $unassignedEmployee = User::create(['email' => 'unassigned_emp@test.local', 'reference_id' => $unassignedEmpRef->id, 'reference_type' => Admin::class]);

        $this->actingAs($unassignedEmployee)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(403);
    }

    public function test_unauthorized_role_gets_403_on_test_details(): void
    {
        $guestRef = Admin::create(['first_name' => 'Guest', 'last_name' => 'User', 'role' => 'Guest']);
        $guestUser = User::create(['email' => 'guest@test.local', 'reference_id' => $guestRef->id, 'reference_type' => Admin::class]);

        $this->actingAs($guestUser)
            ->get(route('patient.show', $this->patient1->Id))
            ->assertStatus(403);
    }
}
