<?php

namespace Tests\Feature;

use App\Facades\AdminDashboardService\AdminDashboardService;
use App\Facades\EmployeeDashboardService\EmployeeDashboardService;
use App\Facades\InspectorService\InspectorService;
use App\Facades\LocationInspectorService\LocationInspectorService;
use App\Facades\MonitorService\MonitorService;
use App\Facades\SupervisorService\SupervisorService;
use App\Jobs\SendPatientToHISJob;
use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\DeviceUser;
use App\Models\Location;
use App\Models\PatientHeader;
use App\Models\PatientTest;
use App\Models\PatientTestAction;
use App\Models\SystemAuditLog;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Wave5IntegrationSecurityTest extends TestCase
{
    protected Location $location1;
    protected Location $location2;
    protected Device $device1;
    protected Device $device2;
    protected Device $inactiveDevice;
    protected User $adminUser;
    protected User $expertUser;
    protected User $inspector1;
    protected User $inspector2;
    protected User $employee1;
    protected User $guestRoleUser;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'cache.default' => 'array',
            'session.driver' => 'array',
        ]);
        DB::purge();
        Storage::fake('public');

        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        $this->createSchema();
        $this->seedData();
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
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('device_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_type_id')->nullable();
            $table->foreignId('location_id')->nullable();
            $table->string('name', 150);
            $table->string('device_code', 50)->unique();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_seen_at')->nullable();
            $table->timestamps();
        });

        Schema::create('device_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
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
        });

        Schema::create('PatientHeader', function (Blueprint $table) {
            $table->id('Id');
            $table->string('TestOperator')->nullable();
            $table->string('PatientId')->nullable();
            $table->string('DonorId')->nullable();
            $table->string('CollectionSite')->nullable();
            $table->string('CupLotNumber')->nullable();
            $table->dateTime('DateTime')->nullable();
            $table->string('SourceFile')->nullable();
            $table->dateTime('ProcessedAt')->nullable();
            $table->string('Status')->default('Imported');
            $table->string('FileHash', 64)->nullable()->unique();
            $table->text('ErrorMessage')->nullable();
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

    protected function seedData(): void
    {
        $this->location1 = Location::create(['name' => 'Clinic Alpha', 'code' => 'LOC-A']);
        $this->location2 = Location::create(['name' => 'Clinic Beta', 'code' => 'LOC-B']);

        $devType = DeviceType::create(['name' => 'HealGen D600']);
        $this->device1 = Device::create([
            'location_id' => $this->location1->id,
            'device_type_id' => $devType->id,
            'name' => 'D600 Alpha',
            'device_code' => 'D600-A',
            'is_active' => true,
        ]);
        $this->device2 = Device::create([
            'location_id' => $this->location2->id,
            'device_type_id' => $devType->id,
            'name' => 'D600 Beta',
            'device_code' => 'D600-B',
            'is_active' => true,
        ]);
        $this->inactiveDevice = Device::create([
            'location_id' => $this->location1->id,
            'device_type_id' => $devType->id,
            'name' => 'D600 Offline',
            'device_code' => 'D600-OFF',
            'is_active' => false,
        ]);

        $adminRef = Admin::create(['first_name' => 'Sys', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create(['email' => 'admin@w5.local', 'reference_id' => $adminRef->id, 'reference_type' => Admin::class]);

        $expertRef = Admin::create(['first_name' => 'Dr', 'last_name' => 'Expert', 'role' => 'Expert']);
        $this->expertUser = User::create(['email' => 'expert@w5.local', 'reference_id' => $expertRef->id, 'reference_type' => Admin::class]);

        $insp1Ref = Admin::create(['first_name' => 'Insp', 'last_name' => 'One', 'role' => 'Inspector']);
        $this->inspector1 = User::create(['email' => 'inspector1@w5.local', 'reference_id' => $insp1Ref->id, 'reference_type' => Admin::class]);

        $insp2Ref = Admin::create(['first_name' => 'Insp', 'last_name' => 'Two', 'role' => 'Inspector']);
        $this->inspector2 = User::create(['email' => 'inspector2@w5.local', 'reference_id' => $insp2Ref->id, 'reference_type' => Admin::class]);

        $emp1Ref = Admin::create(['first_name' => 'Emp', 'last_name' => 'One', 'role' => 'Employee']);
        $this->employee1 = User::create(['email' => 'employee1@w5.local', 'reference_id' => $emp1Ref->id, 'reference_type' => Admin::class]);

        $guestRef = Admin::create(['first_name' => 'Unknown', 'last_name' => 'Role', 'role' => 'Viewer']);
        $this->guestRoleUser = User::create(['email' => 'viewer@w5.local', 'reference_id' => $guestRef->id, 'reference_type' => Admin::class]);

        LocationInspectorService::assign($this->location1->id, $this->inspector1->id, $this->adminUser);
        LocationInspectorService::assign($this->location2->id, $this->inspector2->id, $this->adminUser);
        DeviceUser::create(['device_id' => $this->device1->id, 'user_id' => $this->employee1->id, 'is_active' => true]);
    }

    protected function ingestDeviceMultipartPdf(string $patientId, Device $device, string $pdfSeed): int
    {
        $pdfContent = "%PDF-1.4\n% Wave 5 Test Report {$pdfSeed}\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n";
        $hash = hash('sha256', $pdfContent);

        $payload = [
            'device_id' => $device->id,
            'device_code' => $device->device_code,
            'file_name' => "{$patientId}.pdf",
            'file_hash' => $hash,
            'patient' => [
                'test_operator' => 'Emp One',
                'patient_id' => $patientId,
                'donor_id' => "Donor {$patientId}",
                'collection_site' => 'Main Lab',
                'cup_lot_number' => 'CUP-999',
                'date_time' => now()->subMinutes(10)->format('Y-m-d H:i:s'),
            ],
            'tests' => [
                ['substance' => 'AMP', 'software_result' => '(-)Negative', 'visual_result' => '(-)Negative'],
                ['substance' => 'THC', 'software_result' => '(+)Positive', 'visual_result' => '(+)Positive'],
            ],
        ];

        $pdfFile = UploadedFile::fake()->createWithContent("{$patientId}.pdf", $pdfContent);

        $response = $this->post('/api/device/imports', [
            'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
            'report_pdf' => $pdfFile,
        ]);

        $response->assertStatus(201);

        return (int) $response->json('patient_header_id');
    }

    public function test_end_to_end_device_pdf_import_to_direct_expert_confirm_preserves_data_and_file_integrity(): void
    {
        Queue::fake();

        // 1. Employee/Device submits test with Software Results, Visual Results, and PDF file
        $headerId = $this->ingestDeviceMultipartPdf('W5-E2E-CONF', $this->device1, 'confirm-pdf');

        // 2. Expert accesses dashboard & test details directly (no Inspector action)
        $this->actingAs($this->expertUser)->get('/en/supervisor/dashboard')->assertOk();
        $this->actingAs($this->expertUser)->get("/en/tests/{$headerId}")->assertOk();

        // 3. Expert previews and downloads associated PDF file
        $this->actingAs($this->expertUser)->get("/tests/{$headerId}/file/view")->assertOk();
        $this->actingAs($this->expertUser)->get("/tests/{$headerId}/file/download")->assertOk();

        // 4. Expert opens review & directly Confirms
        $this->actingAs($this->expertUser)->postJson("/supervisor/tests/{$headerId}/review")->assertOk();
        $confirmRes = $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$headerId}/confirm", ['note' => 'E2E verified']);
        $confirmRes->assertOk()
            ->assertJsonPath('data.test.status', 'Confirmed')
            ->assertJsonPath('data.test.isDirectExpertDecision', true);

        // 5. Data & file integrity preserved AFTER Expert confirmation
        $header = PatientHeader::with(['tests', 'file'])->findOrFail($headerId);
        $this->assertEquals('W5-E2E-CONF', $header->PatientId);
        $this->assertEquals('Donor W5-E2E-CONF', $header->DonorId);
        $this->assertEquals('CUP-999', $header->CupLotNumber);
        $this->assertCount(2, $header->tests);
        $this->assertEquals('(-)Negative', $header->tests->firstWhere('Substance', 'AMP')->SoftwareResult);
        $this->assertEquals('(+)Positive', $header->tests->firstWhere('Substance', 'THC')->VisualResult);
        $this->assertNotNull($header->file);

        // File remains viewable & downloadable post-decision by Expert, Admin, Inspector1, Employee1
        foreach ([$this->expertUser, $this->adminUser, $this->inspector1, $this->employee1] as $authorized) {
            $this->actingAs($authorized)->get("/tests/{$headerId}/file/view")->assertOk();
            $this->actingAs($authorized)->get("/tests/{$headerId}/file/download")->assertOk();
        }

        // Inspector2 (other location) still blocked from file
        $this->actingAs($this->inspector2)->get("/tests/{$headerId}/file/download")->assertStatus(403);

        // Zero Inspector actions exist; Expert decision audited properly
        $this->assertEquals(0, PatientTestAction::whereIn('action', ['INSPECTOR_ACCEPT', 'INSPECTOR_REJECT'])->count());
        $this->assertEquals(1, PatientTestAction::where('action', 'EXPERT_REVIEW')->count());
        $this->assertEquals(1, PatientTestAction::where('action', 'EXPERT_CONFIRM')->count());
        Queue::assertPushed(SendPatientToHISJob::class, 1);
    }

    public function test_end_to_end_device_pdf_import_to_direct_expert_reject_and_reporting_accuracy(): void
    {
        Queue::fake();

        $rejectId = $this->ingestDeviceMultipartPdf('W5-E2E-REJ', $this->device1, 'reject-pdf');
        $inspectedId = $this->ingestDeviceMultipartPdf('W5-INSP-FLOW', $this->device1, 'insp-pdf');
        $blockedId = $this->ingestDeviceMultipartPdf('W5-BLOCKED', $this->inactiveDevice, 'blocked-pdf');

        // Verify inactive device produced Blocked status and cannot be decided by Expert
        $this->assertEquals('Blocked', PatientHeader::find($blockedId)->Status);
        $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$blockedId}/confirm")
            ->assertStatus(409);

        // Expert directly rejects first test
        $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$rejectId}/reject", ['reason' => 'Visual strip unreadable'])
            ->assertOk()
            ->assertJsonPath('data.test.status', 'Supervisor Rejected');

        // Inspector independently inspects & forwards second test in their location
        $this->actingAs($this->inspector1)
            ->postJson("/inspector/tests/{$inspectedId}/accept")
            ->assertOk();

        // Inspector dashboard screen & data remain healthy and show ONLY Inspector's own stats
        $this->actingAs($this->inspector1)->get('/en/inspector/dashboard')->assertOk();
        $inspData = $this->actingAs($this->inspector1)->getJson('/inspector/data')->assertOk()->json('data');
        $this->assertEquals(0, $inspData['kpis']['pendingCount']);
        $this->assertEquals(1, $inspData['kpis']['acceptedTodayCount']);
        $this->assertEquals(0, $inspData['kpis']['rejectedTodayCount']);
        $this->assertCount(1, $inspData['recentActivity']);
        $this->assertEquals('INSPECTOR_ACCEPT', $inspData['recentActivity'][0]['action']);

        // Monitor reporting matches actual database statuses accurately
        $monitorSummary = MonitorService::getSummary();
        $this->assertEquals(1, $monitorSummary['Supervisor Rejected']);
        $this->assertEquals(1, $monitorSummary['Inspector Accepted']);
        $this->assertEquals(1, $monitorSummary['Blocked']);
        $this->assertEquals(3, $monitorSummary['total']);

        // Admin reporting accurate
        $adminKpis = AdminDashboardService::getAdminDashboardKPIs();
        $this->assertEquals(0, $adminKpis['pendingInspectorCount']);
        $this->assertEquals(1, $adminKpis['pendingSupervisorCount']);

        // Employee reporting sees all 3 device tests on assigned device1 (blocked is on inactiveDevice -> not assigned)
        $empData = EmployeeDashboardService::getEmployeeDashboardData($this->employee1);
        $this->assertEquals(2, $empData['kpis']['totalIngestedCount']);

        // Expert confirmed/rejected counts accurate
        $expKpis = SupervisorService::getDashboardKPIs();
        $this->assertEquals(1, $expKpis['pendingCount']);
        $this->assertEquals(1, $expKpis['inspectorForwardedPendingCount']);
        $this->assertEquals(0, $expKpis['directPendingCount']);
        $this->assertEquals(1, $expKpis['totalRejectedCount']);
        $this->assertEquals(1, $expKpis['rejectedTodayCount']);
        $this->assertEquals(0, $expKpis['confirmedTodayCount']);
    }

    public function test_security_boundaries_unauthenticated_and_unknown_roles_blocked(): void
    {
        $headerId = $this->ingestDeviceMultipartPdf('W5-SEC-01', $this->device1, 'sec-pdf');

        // Unauthenticated requests blocked (redirect to login or 401)
        $this->postJson("/supervisor/tests/{$headerId}/confirm")->assertStatus(401);
        $this->postJson("/supervisor/tests/{$headerId}/reject", ['reason' => 'No auth'])->assertStatus(401);
        $this->postJson("/supervisor/tests/{$headerId}/review")->assertStatus(401);
        $this->getJson('/supervisor/data')->assertStatus(401);

        // Unknown / unauthorized role blocked with 403 everywhere
        $this->actingAs($this->guestRoleUser)->get('/en/supervisor/dashboard')->assertStatus(403);
        $this->actingAs($this->guestRoleUser)->getJson('/supervisor/data')->assertStatus(403);
        $this->actingAs($this->guestRoleUser)->postJson("/supervisor/tests/{$headerId}/confirm")->assertStatus(403);
        $this->actingAs($this->guestRoleUser)->postJson("/supervisor/tests/{$headerId}/reject", ['reason' => 'No role'])->assertStatus(403);
        $this->actingAs($this->guestRoleUser)->get("/en/tests/{$headerId}")->assertStatus(403);
        $this->actingAs($this->guestRoleUser)->get("/tests/{$headerId}/file/download")->assertStatus(403);

        // Expert blocked from admin dashboard data, inspector queue, and employee file upload/delete
        $this->actingAs($this->expertUser)->getJson('/admin/dashboard/data')->assertStatus(403);
        $this->actingAs($this->expertUser)->get('/en/inspector/dashboard')->assertStatus(403);
        $this->actingAs($this->expertUser)->getJson('/inspector/data')->assertStatus(403);
        $this->actingAs($this->expertUser)->postJson("/inspector/tests/{$headerId}/accept")->assertStatus(403);
        $this->actingAs($this->expertUser)->deleteJson("/tests/{$headerId}/file")->assertStatus(403);

        // Admin retains full access across dashboards and queues
        $this->actingAs($this->adminUser)->getJson('/admin/dashboard/data')->assertOk();
        $this->actingAs($this->adminUser)->getJson('/supervisor/data')->assertOk();
        $this->actingAs($this->adminUser)->getJson('/inspector/data')->assertOk();
    }
}
