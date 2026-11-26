<?php

namespace Tests\Feature;

use App\Facades\AdminDashboardService\AdminDashboardService;
use App\Facades\InspectorService\InspectorService;
use App\Facades\LocationInspectorService\LocationInspectorService;
use App\Facades\PatientService\PatientHeaderService;
use App\Facades\SupervisorService\SupervisorService;
use App\Jobs\SendPatientToHISJob;
use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\DeviceUser;
use App\Models\File;
use App\Models\Location;
use App\Models\PatientHeader;
use App\Models\PatientTest;
use App\Models\PatientTestAction;
use App\Models\SystemAuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DirectExpertWorkflowTest extends TestCase
{
    protected Location $location1;
    protected Location $location2;
    protected Device $device1;
    protected Device $device2;
    protected User $adminUser;
    protected User $expertUser;
    protected User $expertUser2;
    protected User $inspectorUser;
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

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
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
            $table->dateTime('ProcessedAt')->nullable();
            $table->string('Status')->default('Imported');
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
        $this->location1 = Location::create(['name' => 'Central Clinic', 'code' => 'LOC-C']);
        $this->location2 = Location::create(['name' => 'North Clinic', 'code' => 'LOC-N']);

        $devType = DeviceType::create(['name' => 'HealGen D600']);
        $this->device1 = Device::create([
            'location_id' => $this->location1->id,
            'device_type_id' => $devType->id,
            'name' => 'Analyzer 1',
            'device_code' => 'HG-001',
        ]);
        $this->device2 = Device::create([
            'location_id' => $this->location2->id,
            'device_type_id' => $devType->id,
            'name' => 'Analyzer 2',
            'device_code' => 'HG-002',
        ]);

        $adminRef = Admin::create(['first_name' => 'System', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create(['email' => 'admin@test.local', 'reference_id' => $adminRef->id, 'reference_type' => Admin::class]);

        $expRef = Admin::create(['first_name' => 'Dr', 'last_name' => 'Expert', 'role' => 'Expert']);
        $this->expertUser = User::create(['email' => 'expert@test.local', 'reference_id' => $expRef->id, 'reference_type' => Admin::class]);

        $expRef2 = Admin::create(['first_name' => 'Second', 'last_name' => 'Expert', 'role' => 'Expert']);
        $this->expertUser2 = User::create(['email' => 'expert2@test.local', 'reference_id' => $expRef2->id, 'reference_type' => Admin::class]);

        $inspRef = Admin::create(['first_name' => 'Field', 'last_name' => 'Inspector', 'role' => 'Inspector']);
        $this->inspectorUser = User::create(['email' => 'inspector@test.local', 'reference_id' => $inspRef->id, 'reference_type' => Admin::class]);

        $empRef = Admin::create(['first_name' => 'Lab', 'last_name' => 'Employee', 'role' => 'Employee']);
        $this->employeeUser = User::create(['email' => 'employee@test.local', 'reference_id' => $empRef->id, 'reference_type' => Admin::class]);

        LocationInspectorService::assign($this->location1->id, $this->inspectorUser->id, $this->adminUser);
        DeviceUser::create(['device_id' => $this->device1->id, 'user_id' => $this->employeeUser->id, 'is_active' => true]);
    }

    protected function createEmployeeSubmittedTest(string $patientId, string $status = 'Imported', ?Device $device = null, bool $withFile = true): PatientHeader
    {
        $dev = $device ?? $this->device1;
        $header = PatientHeader::create([
            'TestOperator' => 'Lab Employee',
            'PatientId' => $patientId,
            'DonorId' => "Donor {$patientId}",
            'CollectionSite' => 'Site A',
            'CupLotNumber' => 'LOT-123',
            'Status' => $status,
            'DeviceId' => $dev->id,
            'DeviceCode' => $dev->device_code,
            'DateTime' => now()->subMinutes(5),
            'CreatedAt' => now(),
        ]);

        PatientTest::create([
            'PatientHeaderId' => $header->Id,
            'Substance' => 'AMP',
            'SoftwareResult' => 'Negative',
            'VisualResult' => 'Negative',
            'CreatedAt' => now(),
        ]);

        if ($withFile) {
            File::create([
                'name' => "{$patientId}_report.pdf",
                'url' => "test_attachments/{$patientId}_report.pdf",
                'reference_id' => $header->Id,
                'reference_type' => PatientHeader::class,
                'is_image' => false,
                'description' => 'application/pdf',
            ]);
        }

        return $header;
    }

    public function test_employee_submitted_test_is_immediately_available_for_direct_expert_review(): void
    {
        $test = $this->createEmployeeSubmittedTest('EXP-DIR-01', 'Imported', $this->device1);

        $response = $this->actingAs($this->expertUser)->getJson('/supervisor/data');

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.activeView', 'pending')
            ->assertJsonPath('data.kpis.pendingCount', 1)
            ->assertJsonPath('data.kpis.directPendingCount', 1)
            ->assertJsonPath('data.kpis.inspectorForwardedPendingCount', 0);

        $item = $response->json('data.tests.0');
        $this->assertEquals($test->Id, $item['id']);
        $this->assertEquals('Imported', $item['status']);
        $this->assertNull($item['inspectedBy']);
        $this->assertNull($item['confirmedBy']);
        $this->assertTrue($item['canExpertDecide']);
        $this->assertFalse($item['isDirectExpertDecision']);
        $this->assertCount(1, $item['tests']);
        $this->assertEquals('Negative', $item['tests'][0]['softwareResult']);
        $this->assertEquals('Negative', $item['tests'][0]['visualResult']);
        $this->assertNotNull($item['attachment']);
    }

    public function test_expert_can_directly_confirm_employee_submitted_test_without_inspector_action(): void
    {
        Queue::fake();

        $test = $this->createEmployeeSubmittedTest('EXP-CONF-01', 'Imported', $this->device1);

        $response = $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/confirm", [
                'note' => 'Direct clinical confirmation',
            ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.test.status', 'Confirmed')
            ->assertJsonPath('data.test.isDirectExpertDecision', true)
            ->assertJsonPath('data.test.canExpertDecide', false)
            ->assertJsonPath('data.test.inspectedBy', null)
            ->assertJsonPath('data.test.confirmedBy.role', 'Expert')
            ->assertJsonPath('data.test.confirmedBy.action', 'EXPERT_CONFIRM')
            ->assertJsonPath('data.test.confirmedBy.reason', 'Direct clinical confirmation');

        $this->assertEquals('Confirmed', $test->fresh()->Status);

        // Must NEVER create any Inspector action
        $this->assertEquals(0, PatientTestAction::whereIn('action', ['INSPECTOR_ACCEPT', 'INSPECTOR_REJECT'])->count());

        // Must create auditable Expert decision
        $action = PatientTestAction::where('patient_header_id', $test->Id)->first();
        $this->assertNotNull($action);
        $this->assertEquals('EXPERT_CONFIRM', $action->action);
        $this->assertEquals('Expert', $action->role);
        $this->assertEquals($this->expertUser->id, $action->user_id);
        $this->assertEquals('Imported', $action->previous_status);
        $this->assertEquals('Confirmed', $action->new_status);
        $this->assertEquals($this->location1->id, (int) $action->location_id);

        // System audit log recorded
        $this->assertDatabaseHas('system_audit_logs', [
            'user_id' => $this->expertUser->id,
            'role' => 'Expert',
            'action' => 'EXPERT_CONFIRM',
            'entity_type' => 'PatientHeader',
            'entity_id' => (string) $test->Id,
        ]);

        // Dispatched to HIS once
        Queue::assertPushed(SendPatientToHISJob::class, 1);
        Queue::assertPushed(SendPatientToHISJob::class, fn (SendPatientToHISJob $job) => $job->patientHeaderId === $test->Id);
    }

    public function test_expert_can_directly_reject_employee_submitted_test_with_mandatory_reason(): void
    {
        Queue::fake();

        $test = $this->createEmployeeSubmittedTest('EXP-REJ-01', 'Imported', $this->device1);

        // Missing or too-short reason rejected with 422
        $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/reject", ['reason' => ''])
            ->assertStatus(422);

        $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/reject", ['reason' => 'no'])
            ->assertStatus(422);

        // Valid rejection succeeds directly without Inspector
        $response = $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/reject", [
                'reason' => 'Control line invalid in visual attachment',
            ]);

        $response->assertOk()
            ->assertJsonPath('status', true)
            ->assertJsonPath('data.test.status', 'Supervisor Rejected')
            ->assertJsonPath('data.test.isDirectExpertDecision', true)
            ->assertJsonPath('data.test.canExpertDecide', false)
            ->assertJsonPath('data.test.inspectedBy', null)
            ->assertJsonPath('data.test.confirmedBy.action', 'EXPERT_REJECT')
            ->assertJsonPath('data.test.confirmedBy.reason', 'Control line invalid in visual attachment');

        $this->assertEquals('Supervisor Rejected', $test->fresh()->Status);
        $this->assertEquals(0, PatientTestAction::whereIn('action', ['INSPECTOR_ACCEPT', 'INSPECTOR_REJECT'])->count());

        $action = PatientTestAction::where('patient_header_id', $test->Id)->where('action', 'EXPERT_REJECT')->first();
        $this->assertNotNull($action);
        $this->assertEquals('Expert', $action->role);
        $this->assertEquals('Imported', $action->previous_status);
        $this->assertEquals('Supervisor Rejected', $action->new_status);

        // Rejected tests must NOT be dispatched to HIS
        Queue::assertNothingPushed();
    }

    public function test_expert_review_event_is_recorded_deduplicated_and_distinguished_in_history(): void
    {
        Queue::fake();

        $test = $this->createEmployeeSubmittedTest('EXP-REV-01', 'Imported', $this->device1, true);

        // First review call records EXPERT_REVIEW
        $res1 = $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/review");
        $res1->assertOk()->assertJsonPath('data.recorded', true);

        // Second review call by same user is deduplicated
        $res2 = $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/review");
        $res2->assertOk()->assertJsonPath('data.recorded', false);

        // Status unchanged after review
        $this->assertEquals('Imported', $test->fresh()->Status);
        $this->assertEquals(1, PatientTestAction::where('action', 'EXPERT_REVIEW')->count());

        // Now Expert confirms directly
        $confirmRes = $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/confirm", ['note' => 'Reviewed PDF and confirmed']);
        $confirmRes->assertOk();

        $history = $confirmRes->json('data.test.history');
        $types = array_column($history, 'type');

        $this->assertEquals([
            'EMPLOYEE_SUBMISSION',
            'FILE_UPLOADED',
            'EXPERT_REVIEW',
            'EXPERT_CONFIRM',
        ], $types);

        $confirmEntry = $history[3];
        $this->assertTrue($confirmEntry['isDirect']);
        $this->assertEquals('Expert', $confirmEntry['actorRole']);
        $this->assertEquals('Imported', $confirmEntry['previousStatus']);
        $this->assertEquals('Confirmed', $confirmEntry['newStatus']);
    }

    public function test_post_inspector_workflow_remains_compatible_and_preserves_distinct_history(): void
    {
        Queue::fake();

        $test = $this->createEmployeeSubmittedTest('EXP-POST-01', 'Imported', $this->device1, false);

        // Inspector forwards test normally
        InspectorService::acceptTest($test, $this->inspectorUser);
        $this->assertEquals('Inspector Accepted', $test->fresh()->Status);

        // Expert reviews and confirms
        $this->actingAs($this->expertUser)->postJson("/supervisor/tests/{$test->Id}/review")->assertOk();
        $confirmRes = $this->actingAs($this->expertUser)->postJson("/supervisor/tests/{$test->Id}/confirm");
        $confirmRes->assertOk();

        $mapped = $confirmRes->json('data.test');
        $this->assertFalse($mapped['isDirectExpertDecision']);
        $this->assertEquals('Inspector', $mapped['inspectedBy']['role']);
        $this->assertEquals('INSPECTOR_ACCEPT', $mapped['inspectedBy']['action']);
        $this->assertEquals('Expert', $mapped['confirmedBy']['role']);
        $this->assertEquals('EXPERT_CONFIRM', $mapped['confirmedBy']['action']);

        $types = array_column($mapped['history'], 'type');
        $this->assertEquals([
            'EMPLOYEE_SUBMISSION',
            'INSPECTOR_ACCEPT',
            'EXPERT_REVIEW',
            'EXPERT_CONFIRM',
        ], $types);
        $this->assertFalse($mapped['history'][3]['isDirect']);
    }

    public function test_expert_direct_decision_blocks_stale_inspector_or_duplicate_expert_mutations(): void
    {
        Queue::fake();

        $test = $this->createEmployeeSubmittedTest('EXP-CONC-01', 'Imported', $this->device1);

        // Expert directly confirms first
        $this->actingAs($this->expertUser)
            ->postJson("/supervisor/tests/{$test->Id}/confirm")
            ->assertOk();

        // Test is no longer in Inspector pending queue
        $inspectorDashboard = InspectorService::getInspectorDashboardData($this->inspectorUser);
        $this->assertEquals(0, $inspectorDashboard['kpis']['pendingCount']);
        $this->assertCount(0, $inspectorDashboard['pendingQueue']);

        // Inspector statistics are completely unaffected by Expert decision
        $this->assertEquals(0, $inspectorDashboard['kpis']['acceptedTodayCount']);
        $this->assertEquals(0, $inspectorDashboard['kpis']['rejectedTodayCount']);
        $this->assertEquals(0, $inspectorDashboard['kpis']['inspectedTodayCount']);

        // Stale Inspector attempt gets 409 Conflict and does NOT overwrite Expert's Confirmed status
        $this->actingAs($this->inspectorUser)
            ->postJson("/inspector/tests/{$test->Id}/accept")
            ->assertStatus(409);

        $this->actingAs($this->inspectorUser)
            ->postJson("/inspector/tests/{$test->Id}/reject", ['reason' => 'Late retest attempt'])
            ->assertStatus(409);

        // Second Expert attempting duplicate confirm or reject gets 409 Conflict
        $this->actingAs($this->expertUser2)
            ->postJson("/supervisor/tests/{$test->Id}/confirm")
            ->assertStatus(409);

        $this->actingAs($this->expertUser2)
            ->postJson("/supervisor/tests/{$test->Id}/reject", ['reason' => 'Conflicting reject'])
            ->assertStatus(409);

        $this->assertEquals('Confirmed', $test->fresh()->Status);
        $this->assertEquals(1, PatientTestAction::where('patient_header_id', $test->Id)->count());
        Queue::assertPushed(SendPatientToHISJob::class, 1);
    }

    public function test_invalid_statuses_cannot_be_confirmed_or_rejected_by_expert(): void
    {
        Queue::fake();

        $blocked = $this->createEmployeeSubmittedTest('EXP-BLK', 'Blocked', $this->device1);
        $inspectorRejected = $this->createEmployeeSubmittedTest('EXP-IREJ', 'Inspector Rejected', $this->device1);
        $sentToHis = $this->createEmployeeSubmittedTest('EXP-HIS', 'SentToHIS', $this->device1);

        foreach ([$blocked, $inspectorRejected, $sentToHis] as $ineligible) {
            $this->actingAs($this->expertUser)
                ->postJson("/supervisor/tests/{$ineligible->Id}/confirm")
                ->assertStatus(409);

            $this->actingAs($this->expertUser)
                ->postJson("/supervisor/tests/{$ineligible->Id}/reject", ['reason' => 'Invalid state attempt'])
                ->assertStatus(409);
        }

        Queue::assertNothingPushed();
    }

    public function test_expert_dashboard_views_and_source_filters_work_including_post_his_confirmed_tests(): void
    {
        Queue::fake();

        $directPending = $this->createEmployeeSubmittedTest('VIEW-DIR-PEND', 'Imported', $this->device1);
        $forwardedPending = $this->createEmployeeSubmittedTest('VIEW-FWD-PEND', 'Inspector Accepted', $this->device1);
        $confirmedThenSent = $this->createEmployeeSubmittedTest('VIEW-CONF-HIS', 'Imported', $this->device2);
        $rejectedTest = $this->createEmployeeSubmittedTest('VIEW-REJ', 'Awaiting Inspection', $this->device2);

        // Expert confirms $confirmedThenSent, then HIS job updates its status to SentToHIS
        SupervisorService::confirmTest($confirmedThenSent, $this->expertUser, 'Confirmed clean');
        $confirmedThenSent->update(['Status' => 'SentToHIS']);

        // Expert rejects $rejectedTest
        SupervisorService::rejectTest($rejectedTest, $this->expertUser, 'Sample compromised');

        // 1. Pending (All)
        $resPending = $this->actingAs($this->expertUser)->getJson('/supervisor/data?view=pending');
        $resPending->assertOk()
            ->assertJsonPath('data.kpis.pendingCount', 2)
            ->assertJsonPath('data.kpis.directPendingCount', 1)
            ->assertJsonPath('data.kpis.inspectorForwardedPendingCount', 1)
            ->assertJsonPath('data.kpis.totalConfirmedCount', 1)
            ->assertJsonPath('data.kpis.totalRejectedCount', 1)
            ->assertJsonPath('data.kpis.confirmedTodayCount', 1)
            ->assertJsonPath('data.kpis.rejectedTodayCount', 1);

        $this->assertEqualsCanonicalizing(
            ['VIEW-DIR-PEND', 'VIEW-FWD-PEND'],
            array_column($resPending->json('data.tests'), 'patientId')
        );

        // 2. Pending -> source=direct
        $resDirect = $this->actingAs($this->expertUser)->getJson('/supervisor/data?view=pending&source=direct');
        $resDirect->assertOk();
        $this->assertEquals(['VIEW-DIR-PEND'], array_column($resDirect->json('data.tests'), 'patientId'));

        // 3. Pending -> source=inspected
        $resInspected = $this->actingAs($this->expertUser)->getJson('/supervisor/data?view=pending&source=inspected');
        $resInspected->assertOk();
        $this->assertEquals(['VIEW-FWD-PEND'], array_column($resInspected->json('data.tests'), 'patientId'));

        // 4. Confirmed view includes Expert-confirmed test even after transitioning to SentToHIS
        $resConfirmed = $this->actingAs($this->expertUser)->getJson('/supervisor/data?view=confirmed');
        $resConfirmed->assertOk();
        $this->assertEquals(['VIEW-CONF-HIS'], array_column($resConfirmed->json('data.tests'), 'patientId'));

        // 5. Rejected view
        $resRejected = $this->actingAs($this->expertUser)->getJson('/supervisor/data?view=rejected');
        $resRejected->assertOk();
        $this->assertEquals(['VIEW-REJ'], array_column($resRejected->json('data.tests'), 'patientId'));

        // 6. Admin KPIs accurately reflect both queues
        $adminKpis = AdminDashboardService::getAdminDashboardKPIs();
        $this->assertEquals(1, $adminKpis['pendingInspectorCount']);
        $this->assertEquals(2, $adminKpis['pendingSupervisorCount']);
    }

    public function test_unauthorized_roles_cannot_perform_expert_actions(): void
    {
        Queue::fake();

        $test = $this->createEmployeeSubmittedTest('AUTH-01', 'Imported', $this->device1);

        foreach ([$this->inspectorUser, $this->employeeUser] as $unauthorizedUser) {
            $this->actingAs($unauthorizedUser)->getJson('/supervisor/data')->assertStatus(403);
            $this->actingAs($unauthorizedUser)->postJson("/supervisor/tests/{$test->Id}/review")->assertStatus(403);
            $this->actingAs($unauthorizedUser)->postJson("/supervisor/tests/{$test->Id}/confirm")->assertStatus(403);
            $this->actingAs($unauthorizedUser)->postJson("/supervisor/tests/{$test->Id}/reject", ['reason' => 'Unauthorized attempt'])->assertStatus(403);
            $this->actingAs($unauthorizedUser)->postJson('/supervisor/tests/bulk-confirm', ['ids' => [$test->Id]])->assertStatus(403);
        }

        $this->assertEquals('Imported', $test->fresh()->Status);
        $this->assertEquals(0, PatientTestAction::count());
        Queue::assertNothingPushed();
    }

    public function test_direct_expert_decision_delay_summary_does_not_flag_ongoing_inspection_wait(): void
    {
        Queue::fake();

        Carbon::setTestNow(Carbon::create(2026, 6, 1, 10, 0, 0, 'Asia/Dubai'));
        $test = $this->createEmployeeSubmittedTest('DELAY-DIR-01', 'Imported', $this->device1, false);

        Carbon::setTestNow(Carbon::create(2026, 6, 1, 12, 0, 0, 'Asia/Dubai'));
        SupervisorService::confirmTest($test, $this->expertUser);

        // Even 72 hours later, direct Expert-confirmed test should NOT flag pending inspection delay
        Carbon::setTestNow(Carbon::create(2026, 6, 4, 12, 0, 0, 'Asia/Dubai'));
        $mapped = PatientHeaderService::mapPatientModel($test->fresh());

        $this->assertNull($mapped['delaySummary']['stages']['receiveToInspection']);
        $this->assertNotNull($mapped['delaySummary']['stages']['inspectionToSupervision']);
        $this->assertFalse($mapped['delaySummary']['stages']['inspectionToSupervision']['isOngoing']);
        $this->assertFalse($mapped['delaySummary']['hasDelay']);
        $this->assertEquals(2.0, $mapped['delaySummary']['stages']['inspectionToSupervision']['hours']);
    }

    public function test_legacy_supervisor_actions_remain_backward_compatible_in_kpis_and_history(): void
    {
        $test = $this->createEmployeeSubmittedTest('LEG-01', 'Confirmed', $this->device1, false);

        PatientTestAction::create([
            'patient_header_id' => $test->Id,
            'location_id' => $this->location1->id,
            'user_id' => $this->expertUser->id,
            'role' => 'Expert',
            'action' => 'SUPERVISOR_CONFIRM',
            'previous_status' => 'Inspector Accepted',
            'new_status' => 'Confirmed',
            'reason' => 'Legacy confirmation note',
        ]);

        $dashboard = SupervisorService::getSupervisorDashboardData($this->expertUser, ['view' => 'confirmed']);
        $this->assertEquals(1, $dashboard['kpis']['confirmedTodayCount']);
        $this->assertEquals(1, $dashboard['kpis']['totalConfirmedCount']);
        $this->assertCount(1, $dashboard['recentActivity']);
        $this->assertCount(1, $dashboard['tests']);
        $this->assertEquals('SUPERVISOR_CONFIRM', $dashboard['tests'][0]['confirmedBy']['action']);
        $this->assertEquals('EXPERT_CONFIRM', $dashboard['tests'][0]['history'][1]['type']);
    }
}
