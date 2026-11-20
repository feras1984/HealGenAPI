<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\DeviceUser;
use App\Models\Location;
use App\Models\LocationInspector;
use App\Models\PatientHeader;
use App\Models\PatientTest;
use App\Models\PatientTestAction;
use App\Models\SystemAuditLog;
use App\Models\User;
use App\Facades\InspectorService\InspectorService;
use App\Facades\LocationInspectorService\LocationInspectorService;
use App\Facades\PatientService\PatientHeaderService;
use App\Facades\SupervisorService\SupervisorService;
use App\Factories\PatientQuery\PatientQueryStrategyFactory;
use App\Strategies\PatientQuery\AdminPatientQueryStrategy;
use App\Strategies\PatientQuery\DenyPatientQueryStrategy;
use App\Strategies\PatientQuery\EmployeePatientQueryStrategy;
use App\Strategies\PatientQuery\InspectorPatientQueryStrategy;
use App\Factories\MonitorScope\MonitorScopeStrategyFactory;
use App\Strategies\MonitorScope\AdminMonitorScopeStrategy;
use App\Strategies\MonitorScope\InspectorMonitorScopeStrategy;
use App\Strategies\MonitorScope\DenyMonitorScopeStrategy;
use App\Factories\LocationAccess\LocationAccessStrategyFactory;
use App\Strategies\LocationAccess\AdminLocationAccessStrategy;
use App\Strategies\LocationAccess\DenyLocationAccessStrategy;
use App\Strategies\LocationAccess\EmployeeLocationAccessStrategy;
use App\Strategies\LocationAccess\InspectorLocationAccessStrategy;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use InvalidArgumentException;
use Tests\TestCase;

class LocationInspectorAuthorizationTest extends TestCase
{
    protected Location $location1;
    protected Location $location2;
    protected Device $device1;
    protected Device $device2;
    protected User $adminUser;
    protected User $supervisorUser;
    protected User $inspector1;
    protected User $inspector2;
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
        $this->device1 = Device::create(['location_id' => $this->location1->id, 'device_type_id' => $devType->id, 'name' => 'Device LOC1', 'device_code' => 'DEV-LOC1']);
        $this->device2 = Device::create(['location_id' => $this->location2->id, 'device_type_id' => $devType->id, 'name' => 'Device LOC2', 'device_code' => 'DEV-LOC2']);

        $adminRef = Admin::create(['first_name' => 'Super', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create(['email' => 'admin@test.local', 'reference_id' => $adminRef->id, 'reference_type' => Admin::class]);

        $supRef = Admin::create(['first_name' => 'Chief', 'last_name' => 'Supervisor', 'role' => 'Supervisor']);
        $this->supervisorUser = User::create(['email' => 'supervisor@test.local', 'reference_id' => $supRef->id, 'reference_type' => Admin::class]);

        $insp1Ref = Admin::create(['first_name' => 'Inspector', 'last_name' => 'Alpha', 'role' => 'Inspector']);
        $this->inspector1 = User::create(['email' => 'inspector1@test.local', 'reference_id' => $insp1Ref->id, 'reference_type' => Admin::class]);

        $insp2Ref = Admin::create(['first_name' => 'Inspector', 'last_name' => 'Beta', 'role' => 'Inspector']);
        $this->inspector2 = User::create(['email' => 'inspector2@test.local', 'reference_id' => $insp2Ref->id, 'reference_type' => Admin::class]);

        $empRef = Admin::create(['first_name' => 'Staff', 'last_name' => 'Employee', 'role' => 'Employee']);
        $this->employeeUser = User::create(['email' => 'employee@test.local', 'reference_id' => $empRef->id, 'reference_type' => Admin::class]);

        // Assign Inspector 1 to Location 1
        LocationInspectorService::assign($this->location1->id, $this->inspector1->id, $this->adminUser);

        // Assign Employee to Device 1
        DeviceUser::create(['device_id' => $this->device1->id, 'user_id' => $this->employeeUser->id, 'is_active' => true]);
    }

    public function test_inspector_views_tests_from_assigned_location_allowed(): void
    {
        $test1 = PatientHeader::create([
            'PatientId' => 'PID-L1',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        $dashboard = InspectorService::getInspectorDashboardData($this->inspector1);

        $this->assertEquals(1, $dashboard['kpis']['pendingCount']);
        $this->assertCount(1, $dashboard['pendingQueue']);
        $this->assertEquals('PID-L1', $dashboard['pendingQueue'][0]['patientId']);
    }

    public function test_inspector_views_tests_from_another_location_denied(): void
    {
        PatientHeader::create([
            'PatientId' => 'PID-L2',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        $dashboard = InspectorService::getInspectorDashboardData($this->inspector1);

        $this->assertEquals(0, $dashboard['kpis']['pendingCount']);
        $this->assertCount(0, $dashboard['pendingQueue']);
    }

    public function test_inspector_accepts_test_from_assigned_location_allowed(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-ACC',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        $result = InspectorService::acceptTest($test, $this->inspector1);

        $test->refresh();
        $this->assertEquals('Inspector Accepted', $test->Status);

        $action = PatientTestAction::where('patient_header_id', $test->Id)->first();
        $this->assertNotNull($action);
        $this->assertEquals('INSPECTOR_ACCEPT', $action->action);
        $this->assertEquals($this->location1->id, (int) $action->location_id);
        $this->assertEquals($this->inspector1->id, $action->user_id);
    }

    public function test_inspector_rejects_test_from_assigned_location_allowed(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-REJ',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        $result = InspectorService::rejectTest($test, $this->inspector1, 'Sample quantity insufficient');

        $test->refresh();
        $this->assertEquals('Inspector Rejected', $test->Status);

        $action = PatientTestAction::where('patient_header_id', $test->Id)->first();
        $this->assertNotNull($action);
        $this->assertEquals('INSPECTOR_REJECT', $action->action);
        $this->assertEquals('Sample quantity insufficient', $action->reason);
        $this->assertEquals($this->location1->id, (int) $action->location_id);
    }

    public function test_inspector_accepts_test_from_another_location_denied(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-CROSS-ACC',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        $this->expectException(AuthorizationException::class);
        InspectorService::acceptTest($test, $this->inspector1);

        $test->refresh();
        $this->assertEquals('Awaiting Inspection', $test->Status);
    }

    public function test_inspector_rejects_test_from_another_location_denied(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-CROSS-REJ',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        $this->expectException(AuthorizationException::class);
        InspectorService::rejectTest($test, $this->inspector1, 'Unauthorized rejection attempt');

        $test->refresh();
        $this->assertEquals('Awaiting Inspection', $test->Status);
    }

    public function test_inspector_accesses_another_location_test_using_its_id_denied(): void
    {
        $testL2 = PatientHeader::create([
            'PatientId' => 'PID-IDOR',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        $this->expectException(AuthorizationException::class);
        InspectorService::verifyInspectorTestAuthorization($this->inspector1, $testL2);
    }

    public function test_inspector_changes_location_id_in_request_payload_denied(): void
    {
        PatientHeader::create([
            'PatientId' => 'PID-L1',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        PatientHeader::create([
            'PatientId' => 'PID-L2',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        // Attacker sends spoofed locationId = location2 in filters
        $filters = ['locationId' => $this->location2->id];
        $queue = InspectorService::getPendingQueue($filters, $this->inspector1, $this->inspector1->getAssignedLocationId());

        $this->assertCount(1, $queue);
        $this->assertEquals('PID-L1', $queue[0]['patientId']);
        $this->assertNotEquals('PID-L2', $queue[0]['patientId']);
    }

    public function test_inspector_transfers_to_another_location_assignment_updated(): void
    {
        // Transfer Inspector 1 from Location 1 to Location 2
        $assignment = LocationInspectorService::transfer($this->inspector1->id, $this->location2->id, $this->adminUser);

        $this->assertTrue($assignment->is_active);
        $this->assertEquals($this->location2->id, $assignment->location_id);
        $this->assertEquals($this->location2->id, $this->inspector1->fresh()->getAssignedLocationId());

        // Previous assignment at Location 1 must be deactivated
        $oldAssignment = LocationInspector::where('location_id', $this->location1->id)
            ->where('user_id', $this->inspector1->id)
            ->first();

        $this->assertFalse($oldAssignment->is_active);
        $this->assertNotNull($oldAssignment->unassigned_at);
    }

    public function test_inspector_accesses_previous_location_after_transfer_denied(): void
    {
        $testL1 = PatientHeader::create([
            'PatientId' => 'PID-L1-POST',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        // Transfer Inspector 1 to Location 2
        LocationInspectorService::transfer($this->inspector1->id, $this->location2->id, $this->adminUser);
        $this->inspector1 = $this->inspector1->fresh();

        $this->expectException(AuthorizationException::class);
        InspectorService::acceptTest($testL1, $this->inspector1);
    }

    public function test_inspector_accesses_new_location_after_transfer_allowed(): void
    {
        $testL2 = PatientHeader::create([
            'PatientId' => 'PID-L2-POST',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        // Transfer Inspector 1 to Location 2
        LocationInspectorService::transfer($this->inspector1->id, $this->location2->id, $this->adminUser);
        $this->inspector1 = $this->inspector1->fresh();

        $result = InspectorService::acceptTest($testL2, $this->inspector1);

        $testL2->refresh();
        $this->assertEquals('Inspector Accepted', $testL2->Status);
    }

    public function test_supervisor_views_tests_from_all_locations_allowed(): void
    {
        $testL1 = PatientHeader::create([
            'PatientId' => 'PID-SUP-L1',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        $testL2 = PatientHeader::create([
            'PatientId' => 'PID-SUP-L2',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        // Inspector 1 accepts Location 1 test
        InspectorService::acceptTest($testL1, $this->inspector1);

        // Assign Inspector 2 to Location 2 and accept Location 2 test
        LocationInspectorService::assign($this->location2->id, $this->inspector2->id, $this->adminUser);
        InspectorService::acceptTest($testL2, $this->inspector2);

        $supQueue = SupervisorService::getPendingQueue();

        $this->assertCount(2, $supQueue);
        $patientIds = array_column($supQueue, 'patientId');
        $this->assertContains('PID-SUP-L1', $patientIds);
        $this->assertContains('PID-SUP-L2', $patientIds);

        // Verify Inspector attribution is visible
        $itemMap = [];
        foreach ($supQueue as $item) {
            $itemMap[$item['patientId']] = $item;
        }

        $this->assertEquals('Inspector Alpha', $itemMap['PID-SUP-L1']['reviewedBy']['name']);
        $this->assertEquals('Inspector Beta', $itemMap['PID-SUP-L2']['reviewedBy']['name']);
    }

    public function test_supervisor_confirms_an_inspector_accepted_test_allowed(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-CONFIRM',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        InspectorService::acceptTest($test, $this->inspector1);

        \Illuminate\Support\Facades\Queue::fake();
        $result = SupervisorService::confirmTest($test, $this->supervisorUser, 'Verified by Supervisor');

        $test->refresh();
        $this->assertEquals('Confirmed', $test->Status);

        $action = PatientTestAction::where('patient_header_id', $test->Id)->where('action', 'SUPERVISOR_CONFIRM')->first();
        $this->assertNotNull($action);
        $this->assertEquals($this->location1->id, (int) $action->location_id);
    }

    public function test_supervisor_attempts_to_confirm_a_rejected_test_denied(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-REJ-CONF',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        InspectorService::rejectTest($test, $this->inspector1, 'Invalid specimen');

        $this->expectException(InvalidArgumentException::class);
        SupervisorService::confirmTest($test, $this->supervisorUser);
    }

    public function test_employee_creates_and_views_test_workflow_preserved(): void
    {
        PatientHeader::create([
            'PatientId' => 'PID-EMP-1',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        PatientHeader::create([
            'PatientId' => 'PID-EMP-2',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        // Employee assigned to Device 1 can only view tests from Device 1
        $empPatients = PatientHeaderService::getPatients($this->employeeUser);

        $this->assertCount(1, $empPatients);
        $this->assertEquals('PID-EMP-1', $empPatients[0]['patientId']);
    }

    public function test_location_already_has_assigned_inspector_conflicting_assignment_prevented(): void
    {
        // Location 1 currently has Inspector 1 assigned
        $this->assertEquals($this->inspector1->id, $this->location1->fresh()->activeInspector->id);

        // Assign Inspector 2 to Location 1
        $newAssignment = LocationInspectorService::assign($this->location1->id, $this->inspector2->id, $this->adminUser);

        $this->assertTrue($newAssignment->is_active);
        $this->assertEquals($this->inspector2->id, $newAssignment->user_id);
        $this->assertEquals($this->inspector2->id, $this->location1->fresh()->activeInspector->id);

        // Inspector 1 must be automatically deactivated for Location 1
        $oldAssignment = LocationInspector::where('location_id', $this->location1->id)
            ->where('user_id', $this->inspector1->id)
            ->first();

        $this->assertFalse($oldAssignment->is_active);
        $this->assertNotNull($oldAssignment->unassigned_at);
        $this->assertNull($this->inspector1->fresh()->getAssignedLocationId());
    }

    public function test_transfer_does_not_modify_existing_test_records_or_historical_decisions(): void
    {
        $test = PatientHeader::create([
            'PatientId' => 'PID-HISTORICAL',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        InspectorService::acceptTest($test, $this->inspector1);

        $actionBefore = PatientTestAction::where('patient_header_id', $test->Id)->first();
        $this->assertEquals('INSPECTOR_ACCEPT', $actionBefore->action);
        $this->assertEquals($this->inspector1->id, $actionBefore->user_id);
        $this->assertEquals($this->location1->id, (int) $actionBefore->location_id);

        // Transfer Inspector 1 to Location 2
        LocationInspectorService::transfer($this->inspector1->id, $this->location2->id, $this->adminUser);

        // Historical record on test and action must remain unchanged
        $test->refresh();
        $actionAfter = PatientTestAction::where('patient_header_id', $test->Id)->first();

        $this->assertEquals('Inspector Accepted', $test->Status);
        $this->assertEquals($this->device1->id, $test->DeviceId);
        $this->assertEquals($actionBefore->id, $actionAfter->id);
        $this->assertEquals('INSPECTOR_ACCEPT', $actionAfter->action);
        $this->assertEquals($this->inspector1->id, $actionAfter->user_id);
        $this->assertEquals($this->location1->id, (int) $actionAfter->location_id);
    }

    public function test_patient_query_strategy_factory_resolves_correct_strategies_per_role(): void
    {
        $factory = app(PatientQueryStrategyFactory::class);

        $this->assertInstanceOf(AdminPatientQueryStrategy::class, $factory->make($this->adminUser));
        $this->assertInstanceOf(AdminPatientQueryStrategy::class, $factory->make($this->supervisorUser));
        $this->assertInstanceOf(InspectorPatientQueryStrategy::class, $factory->make($this->inspector1));
        $this->assertInstanceOf(EmployeePatientQueryStrategy::class, $factory->make($this->employeeUser));
        $this->assertInstanceOf(DenyPatientQueryStrategy::class, $factory->make(null));

        $guestRef = Admin::create(['first_name' => 'Guest', 'last_name' => 'User', 'role' => 'Guest']);
        $guestUser = User::create(['email' => 'guest_strat@test.local', 'reference_id' => $guestRef->id, 'reference_type' => Admin::class]);
        $this->assertInstanceOf(DenyPatientQueryStrategy::class, $factory->make($guestUser));
    }

    public function test_inspector_patient_query_strategy_scopes_strictly_to_assigned_location(): void
    {
        PatientHeader::create([
            'PatientId' => 'PID-STRAT-L1',
            'Status' => 'Imported',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        PatientHeader::create([
            'PatientId' => 'PID-STRAT-L2',
            'Status' => 'Imported',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        // Inspector 1 is assigned to Location 1
        $patients = PatientHeaderService::getPatients($this->inspector1);

        $this->assertCount(1, $patients);
        $this->assertEquals('PID-STRAT-L1', $patients[0]['patientId']);

        // When inspector is unassigned, 0 records must be returned (fail-closed)
        LocationInspector::where('user_id', $this->inspector1->id)->update(['is_active' => false]);
        $this->inspector1->refresh();

        $unassignedPatients = PatientHeaderService::getPatients($this->inspector1);
        $this->assertCount(0, $unassignedPatients);
    }

    public function test_monitor_scope_strategy_factory_resolves_correct_strategies(): void
    {
        $factory = app(MonitorScopeStrategyFactory::class);

        $this->assertInstanceOf(AdminMonitorScopeStrategy::class, $factory->make($this->adminUser));
        $this->assertInstanceOf(AdminMonitorScopeStrategy::class, $factory->make($this->supervisorUser));
        $this->assertInstanceOf(InspectorMonitorScopeStrategy::class, $factory->make($this->inspector1));
        $this->assertInstanceOf(DenyMonitorScopeStrategy::class, $factory->make($this->employeeUser));
        $this->assertInstanceOf(DenyMonitorScopeStrategy::class, $factory->make(null));
    }

    public function test_inspector_monitor_scope_strategy_restricts_locations_devices_and_tests(): void
    {
        PatientHeader::create([
            'PatientId' => 'PID-MON-L1',
            'Status' => 'Imported',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        PatientHeader::create([
            'PatientId' => 'PID-MON-L2',
            'Status' => 'Imported',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        $factory = app(MonitorScopeStrategyFactory::class);
        $strategy = $factory->make($this->inspector1);

        // Filters cannot be overridden to another location
        $scopedFilters = $strategy->scopeFilters(['locationId' => $this->location2->id]);
        $this->assertEquals($this->location1->id, $scopedFilters['locationId']);

        // Locations list only contains the Inspector's assigned location
        $locations = $strategy->getLocations();
        $this->assertCount(1, $locations);
        $this->assertEquals($this->location1->id, $locations[0]['id']);

        // Devices list only contains devices at the Inspector's assigned location
        $devices = $strategy->getDevices();
        $this->assertCount(1, $devices);
        $this->assertEquals($this->device1->id, $devices[0]['id']);

        // Monitor data test operations only include Location 1 tests
        $data = $strategy->getMonitorData($scopedFilters);
        $this->assertCount(1, $data['testOperations']);
        $this->assertEquals('PID-MON-L1', $data['testOperations'][0]['patientId']);

        // Device operations only include Device 1
        $this->assertCount(1, $data['deviceOperations']);
        $this->assertEquals($this->device1->id, $data['deviceOperations'][0]['id']);
    }

    public function test_unassigned_inspector_monitor_scope_strategy_returns_empty_payload(): void
    {
        LocationInspector::where('user_id', $this->inspector1->id)->update(['is_active' => false]);
        $this->inspector1->refresh();

        $factory = app(MonitorScopeStrategyFactory::class);
        $strategy = $factory->make($this->inspector1);

        $this->assertEmpty($strategy->getLocations());
        $this->assertEmpty($strategy->getDevices());

        $data = $strategy->getMonitorData([]);
        $this->assertEquals(0, $data['summary']['total']);
        $this->assertEmpty($data['testOperations']);
        $this->assertEmpty($data['deviceOperations']);
    }

    public function test_inspector_accessing_supervisor_routes_denied(): void
    {
        $response = $this->actingAs($this->inspector1)->get('/supervisor/data');
        $response->assertStatus(403);
    }

    public function test_inspector_accessing_admin_dashboard_data_denied(): void
    {
        $response = $this->actingAs($this->inspector1)->get('/admin/dashboard/data');
        $response->assertStatus(403);
    }

    public function test_location_access_strategy_factory_resolves_correct_strategies(): void
    {
        $factory = app(LocationAccessStrategyFactory::class);

        $this->assertInstanceOf(AdminLocationAccessStrategy::class, $factory->make($this->adminUser));
        $this->assertInstanceOf(AdminLocationAccessStrategy::class, $factory->make($this->supervisorUser));
        $this->assertInstanceOf(InspectorLocationAccessStrategy::class, $factory->make($this->inspector1));
        $this->assertInstanceOf(EmployeeLocationAccessStrategy::class, $factory->make($this->employeeUser));
        $this->assertInstanceOf(DenyLocationAccessStrategy::class, $factory->make(null));
    }

    public function test_inspector_location_access_strategy_locks_filters_locations_and_devices(): void
    {
        $factory = app(LocationAccessStrategyFactory::class);
        $strategy = $factory->make($this->inspector1);

        $filters = ['locationId' => $this->location2->id];
        $strategy->applyFilters($filters);
        $this->assertEquals($this->location1->id, $filters['locationId']);

        $locations = $strategy->getLocations();
        $this->assertCount(1, $locations);
        $this->assertEquals($this->location1->id, $locations[0]['id']);

        $devices = $strategy->getDevices();
        $this->assertCount(1, $devices);
        $this->assertEquals($this->device1->id, $devices[0]['id']);
    }

    public function test_inspector_dashboard_data_endpoint_uses_strategy_and_locks_assigned_location(): void
    {
        PatientHeader::create([
            'PatientId' => 'PID-INSP-DASH-L1',
            'Status' => 'Imported',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'CreatedAt' => now(),
        ]);

        PatientHeader::create([
            'PatientId' => 'PID-INSP-DASH-L2',
            'Status' => 'Imported',
            'DeviceId' => $this->device2->id,
            'DeviceCode' => $this->device2->device_code,
            'CreatedAt' => now(),
        ]);

        // Attempt to pass other location ID
        $response = $this->actingAs($this->inspector1)->get('/inspector/data?locationId=' . $this->location2->id);
        $response->assertStatus(200);

        $responseData = $response->json('data');
        $this->assertEquals($this->location1->id, $responseData['assignedLocation']['id']);

        // Pending queue must only contain Location 1 test
        $queueIds = array_column($responseData['pendingQueue'], 'patientId');
        $this->assertContains('PID-INSP-DASH-L1', $queueIds);
        $this->assertNotContains('PID-INSP-DASH-L2', $queueIds);
    }
}
