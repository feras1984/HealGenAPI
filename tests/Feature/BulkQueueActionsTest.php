<?php

namespace Tests\Feature;

use App\Facades\LocationInspectorService\LocationInspectorService;
use App\Jobs\SendPatientToHISJob;
use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\Location;
use App\Models\PatientHeader;
use App\Models\PatientTestAction;
use App\Models\SystemAuditLog;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BulkQueueActionsTest extends TestCase
{
    protected Location $location1;
    protected Location $location2;
    protected Device $device1;
    protected Device $device2;
    protected User $adminUser;
    protected User $supervisorUser;
    protected User $inspector1;
    protected User $unassignedInspector;
    protected User $employeeUser;

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

        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

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
        $this->location1 = Location::create(['name' => 'Location 1', 'code' => 'LOC1']);
        $this->location2 = Location::create(['name' => 'Location 2', 'code' => 'LOC2']);

        $devType = DeviceType::create(['name' => 'Drug Panel']);
        $this->device1 = Device::create([
            'location_id' => $this->location1->id,
            'device_type_id' => $devType->id,
            'name' => 'Device 1',
            'device_code' => 'DEV-1',
        ]);
        $this->device2 = Device::create([
            'location_id' => $this->location2->id,
            'device_type_id' => $devType->id,
            'name' => 'Device 2',
            'device_code' => 'DEV-2',
        ]);

        $adminRef = Admin::create(['first_name' => 'Super', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create(['email' => 'admin@test.local', 'reference_id' => $adminRef->id, 'reference_type' => Admin::class]);

        $supRef = Admin::create(['first_name' => 'Lead', 'last_name' => 'Expert', 'role' => 'Expert']);
        $this->supervisorUser = User::create(['email' => 'supervisor@test.local', 'reference_id' => $supRef->id, 'reference_type' => Admin::class]);

        $insp1Ref = Admin::create(['first_name' => 'Inspector', 'last_name' => 'One', 'role' => 'Inspector']);
        $this->inspector1 = User::create(['email' => 'inspector1@test.local', 'reference_id' => $insp1Ref->id, 'reference_type' => Admin::class]);

        $insp2Ref = Admin::create(['first_name' => 'Inspector', 'last_name' => 'Unassigned', 'role' => 'Inspector']);
        $this->unassignedInspector = User::create(['email' => 'inspector2@test.local', 'reference_id' => $insp2Ref->id, 'reference_type' => Admin::class]);

        $empRef = Admin::create(['first_name' => 'Lab', 'last_name' => 'Employee', 'role' => 'Employee']);
        $this->employeeUser = User::create(['email' => 'employee@test.local', 'reference_id' => $empRef->id, 'reference_type' => Admin::class]);

        LocationInspectorService::assign($this->location1->id, $this->inspector1->id, $this->adminUser);
    }

    protected function createTestHeader(string $patientId, string $status, Device $device): PatientHeader
    {
        return PatientHeader::create([
            'PatientId' => $patientId,
            'DonorId' => "Donor {$patientId}",
            'Status' => $status,
            'DeviceId' => $device->id,
            'DeviceCode' => $device->device_code,
            'CreatedAt' => now(),
        ]);
    }

    // -------------------------------------------------------------------------
    // Supervisor Bulk Confirm Tests
    // -------------------------------------------------------------------------

    public function test_supervisor_can_bulk_confirm_multiple_pending_tests_and_dispatch_his_jobs(): void
    {
        Queue::fake();

        $t1 = $this->createTestHeader('P-101', 'Inspector Accepted', $this->device1);
        $t2 = $this->createTestHeader('P-102', 'Awaiting Supervisor', $this->device2);

        $response = $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', [
                'ids' => [$t1->Id, $t2->Id],
                'note' => 'Batch verified routine negatives',
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'data' => [
                    'confirmedIds' => [$t1->Id, $t2->Id],
                    'confirmedCount' => 2,
                    'skippedCount' => 0,
                ],
            ]);

        $this->assertEquals('Confirmed', $t1->fresh()->Status);
        $this->assertEquals('Confirmed', $t2->fresh()->Status);

        $this->assertEquals(2, PatientTestAction::where('action', 'EXPERT_CONFIRM')->count());
        $this->assertEquals(
            'Batch verified routine negatives',
            PatientTestAction::where('patient_header_id', $t1->Id)->value('reason')
        );
        $this->assertEquals(2, SystemAuditLog::where('action', 'EXPERT_CONFIRM')->count());

        Queue::assertPushed(SendPatientToHISJob::class, 2);
        Queue::assertPushed(SendPatientToHISJob::class, fn (SendPatientToHISJob $job) => $job->patientHeaderId === $t1->Id);
        Queue::assertPushed(SendPatientToHISJob::class, fn (SendPatientToHISJob $job) => $job->patientHeaderId === $t2->Id);
    }

    public function test_administrator_can_bulk_confirm_in_supervisor_queue(): void
    {
        Queue::fake();

        $t1 = $this->createTestHeader('P-201', 'Inspector Accepted', $this->device1);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/supervisor/tests/bulk-confirm', [
                'ids' => [$t1->Id],
            ]);

        $response->assertOk()
            ->assertJsonPath('data.confirmedCount', 1);

        $this->assertEquals('Confirmed', $t1->fresh()->Status);
        Queue::assertPushed(SendPatientToHISJob::class, 1);
    }

    public function test_supervisor_bulk_confirm_partial_success_skips_non_pending_and_missing_tests(): void
    {
        Queue::fake();

        $pending = $this->createTestHeader('P-301', 'Inspector Accepted', $this->device1);
        $alreadyConfirmed = $this->createTestHeader('P-302', 'Confirmed', $this->device1);
        $missingId = 999999;

        $response = $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', [
                'ids' => [$pending->Id, $alreadyConfirmed->Id, $missingId],
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'data' => [
                    'confirmedIds' => [$pending->Id],
                    'confirmedCount' => 1,
                    'skippedCount' => 2,
                ],
            ]);

        $this->assertEquals('Confirmed', $pending->fresh()->Status);
        $this->assertEquals('Confirmed', $alreadyConfirmed->fresh()->Status);
        Queue::assertPushed(SendPatientToHISJob::class, 1);
        Queue::assertPushed(SendPatientToHISJob::class, fn (SendPatientToHISJob $job) => $job->patientHeaderId === $pending->Id);
    }

    public function test_supervisor_bulk_confirm_returns_conflict_when_all_tests_are_already_processed(): void
    {
        Queue::fake();

        $alreadyConfirmed = $this->createTestHeader('P-401', 'Confirmed', $this->device1);

        $response = $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', [
                'ids' => [$alreadyConfirmed->Id],
            ]);

        $response->assertStatus(409)
            ->assertJson([
                'status' => false,
                'data' => [
                    'confirmedCount' => 0,
                    'skippedCount' => 1,
                ],
            ]);

        Queue::assertNothingPushed();
    }

    public function test_unauthorized_roles_cannot_bulk_confirm_supervisor_tests(): void
    {
        Queue::fake();
        $t1 = $this->createTestHeader('P-501', 'Inspector Accepted', $this->device1);

        $this->actingAs($this->inspector1)
            ->postJson('/supervisor/tests/bulk-confirm', ['ids' => [$t1->Id]])
            ->assertStatus(403);

        $this->actingAs($this->employeeUser)
            ->postJson('/supervisor/tests/bulk-confirm', ['ids' => [$t1->Id]])
            ->assertStatus(403);

        $this->assertEquals('Inspector Accepted', $t1->fresh()->Status);
        Queue::assertNothingPushed();
    }

    public function test_supervisor_bulk_confirm_validation_rules(): void
    {
        $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', ['ids' => []])
            ->assertStatus(422);

        $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', ['ids' => [1, 1]])
            ->assertStatus(422);

        $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', ['ids' => range(1, 51)])
            ->assertStatus(422);
    }

    // -------------------------------------------------------------------------
    // Inspector Bulk Accept Backend Tests
    // -------------------------------------------------------------------------

    public function test_inspector_can_bulk_accept_tests_in_assigned_location(): void
    {
        $t1 = $this->createTestHeader('I-101', 'Imported', $this->device1);
        $t2 = $this->createTestHeader('I-102', 'Awaiting Inspection', $this->device1);

        $response = $this->actingAs($this->inspector1)
            ->postJson('/inspector/tests/bulk-accept', [
                'ids' => [$t1->Id, $t2->Id],
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'data' => [
                    'acceptedIds' => [$t1->Id, $t2->Id],
                    'acceptedCount' => 2,
                    'skippedCount' => 0,
                ],
            ]);

        $this->assertEquals('Inspector Accepted', $t1->fresh()->Status);
        $this->assertEquals('Inspector Accepted', $t2->fresh()->Status);
        $this->assertEquals(2, PatientTestAction::where('action', 'INSPECTOR_ACCEPT')->count());
    }

    public function test_inspector_bulk_accept_blocks_cross_location_tests_in_mixed_batch(): void
    {
        $ownTest = $this->createTestHeader('I-201', 'Awaiting Inspection', $this->device1);
        $otherLocTest = $this->createTestHeader('I-202', 'Awaiting Inspection', $this->device2);

        $response = $this->actingAs($this->inspector1)
            ->postJson('/inspector/tests/bulk-accept', [
                'ids' => [$ownTest->Id, $otherLocTest->Id],
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'data' => [
                    'acceptedIds' => [$ownTest->Id],
                    'acceptedCount' => 1,
                    'skippedCount' => 1,
                ],
            ]);

        $this->assertEquals('Inspector Accepted', $ownTest->fresh()->Status);
        $this->assertEquals('Awaiting Inspection', $otherLocTest->fresh()->Status);
        $this->assertEquals('unauthorized', $response->json('data.skipped.0.code'));
    }

    public function test_inspector_bulk_accept_returns_forbidden_when_all_tests_are_outside_assigned_location(): void
    {
        $otherLocTest = $this->createTestHeader('I-301', 'Awaiting Inspection', $this->device2);

        $this->actingAs($this->inspector1)
            ->postJson('/inspector/tests/bulk-accept', ['ids' => [$otherLocTest->Id]])
            ->assertStatus(403);

        $this->assertEquals('Awaiting Inspection', $otherLocTest->fresh()->Status);
    }

    public function test_unassigned_inspector_and_employee_cannot_bulk_accept(): void
    {
        $t1 = $this->createTestHeader('I-401', 'Awaiting Inspection', $this->device1);

        $this->actingAs($this->unassignedInspector)
            ->postJson('/inspector/tests/bulk-accept', ['ids' => [$t1->Id]])
            ->assertStatus(403);

        $this->actingAs($this->employeeUser)
            ->postJson('/inspector/tests/bulk-accept', ['ids' => [$t1->Id]])
            ->assertStatus(403);

        $this->assertEquals('Awaiting Inspection', $t1->fresh()->Status);
    }

    public function test_expert_cannot_use_inspector_bulk_accept_and_uses_direct_bulk_confirm_instead(): void
    {
        Queue::fake();

        $loc1Test = $this->createTestHeader('I-451', 'Imported', $this->device1);
        $loc2Test = $this->createTestHeader('I-452', 'Awaiting Inspection', $this->device2);

        // Expert must NOT create Inspector actions via Inspector queue
        $this->actingAs($this->supervisorUser)
            ->postJson('/inspector/tests/bulk-accept', [
                'ids' => [$loc1Test->Id, $loc2Test->Id],
            ])
            ->assertStatus(403);

        $this->assertEquals('Imported', $loc1Test->fresh()->Status);
        $this->assertEquals('Awaiting Inspection', $loc2Test->fresh()->Status);
        $this->assertEquals(0, PatientTestAction::where('action', 'INSPECTOR_ACCEPT')->count());

        // Expert directly bulk confirms both tests from Employee submission
        $response = $this->actingAs($this->supervisorUser)
            ->postJson('/supervisor/tests/bulk-confirm', [
                'ids' => [$loc1Test->Id, $loc2Test->Id],
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'data' => [
                    'confirmedIds' => [$loc1Test->Id, $loc2Test->Id],
                    'confirmedCount' => 2,
                    'skippedCount' => 0,
                ],
            ]);

        $this->assertEquals('Confirmed', $loc1Test->fresh()->Status);
        $this->assertEquals('Confirmed', $loc2Test->fresh()->Status);
        $this->assertEquals(2, PatientTestAction::where('action', 'EXPERT_CONFIRM')->count());
        $this->assertEquals(0, PatientTestAction::where('action', 'INSPECTOR_ACCEPT')->count());
        Queue::assertPushed(SendPatientToHISJob::class, 2);
    }

    public function test_administrator_can_bulk_accept_across_all_locations_with_partial_success(): void
    {
        $loc1Test = $this->createTestHeader('I-501', 'Imported', $this->device1);
        $loc2Test = $this->createTestHeader('I-502', 'Awaiting Inspection', $this->device2);
        $alreadyAccepted = $this->createTestHeader('I-503', 'Inspector Accepted', $this->device2);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/inspector/tests/bulk-accept', [
                'ids' => [$loc1Test->Id, $loc2Test->Id, $alreadyAccepted->Id],
            ]);

        $response->assertOk()
            ->assertJson([
                'status' => true,
                'data' => [
                    'acceptedIds' => [$loc1Test->Id, $loc2Test->Id],
                    'acceptedCount' => 2,
                    'skippedCount' => 1,
                ],
            ]);

        $this->assertEquals('Inspector Accepted', $loc1Test->fresh()->Status);
        $this->assertEquals('Inspector Accepted', $loc2Test->fresh()->Status);
    }
}
