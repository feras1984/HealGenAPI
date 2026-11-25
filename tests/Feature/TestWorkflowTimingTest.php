<?php

namespace Tests\Feature;

use App\Facades\InspectorService\InspectorService;
use App\Facades\LocationInspectorService\LocationInspectorService;
use App\Facades\PatientService\PatientHeaderService;
use App\Facades\SupervisorService\SupervisorService;
use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\Location;
use App\Models\PatientHeader;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TestWorkflowTimingTest extends TestCase
{
    protected Location $location;
    protected Device $device;
    protected User $adminUser;
    protected User $supervisorUser;
    protected User $inspectorUser;

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
        $this->location = Location::create(['name' => 'Dubai Central Lab', 'code' => 'DXB-1']);
        $devType = DeviceType::create(['name' => 'HealGen Scanner']);
        $this->device = Device::create([
            'location_id' => $this->location->id,
            'device_type_id' => $devType->id,
            'name' => 'Scanner 01',
            'device_code' => 'DXB-DEV-01',
        ]);

        $adminRef = Admin::create(['first_name' => 'Super', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create(['email' => 'admin@dxb.local', 'reference_id' => $adminRef->id, 'reference_type' => Admin::class]);

        $supRef = Admin::create(['first_name' => 'Sara', 'last_name' => 'Expert', 'role' => 'Expert']);
        $this->supervisorUser = User::create(['email' => 'supervisor@dxb.local', 'reference_id' => $supRef->id, 'reference_type' => Admin::class]);

        $inspRef = Admin::create(['first_name' => 'Omar', 'last_name' => 'Inspector', 'role' => 'Inspector']);
        $this->inspectorUser = User::create(['email' => 'inspector@dxb.local', 'reference_id' => $inspRef->id, 'reference_type' => Admin::class]);

        LocationInspectorService::assign($this->location->id, $this->inspectorUser->id, $this->adminUser);
    }

    public function test_app_timezone_is_configured_for_dubai(): void
    {
        $this->assertEquals('Asia/Dubai', config('app.timezone'));
    }

    public function test_capture_time_uses_device_datetime_and_falls_back_to_created_at_when_null(): void
    {
        $withDeviceTime = PatientHeader::create([
            'PatientId' => 'PID-WITH-DT',
            'DonorId' => 'Donor A',
            'Status' => 'Imported',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => '2026-05-26 09:14:05',
            'CreatedAt' => '2026-05-26 09:15:30',
        ]);

        $withoutDeviceTime = PatientHeader::create([
            'PatientId' => 'PID-NO-DT',
            'DonorId' => 'Donor B',
            'Status' => 'Imported',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => null,
            'CreatedAt' => '2026-05-26 11:20:45',
        ]);

        $mapped1 = PatientHeaderService::mapPatientModel($withDeviceTime);
        $this->assertEquals('May 26, 2026 09:14:05', $mapped1['capturedAt']);
        $this->assertEquals('May 26, 2026 09:14:05', $mapped1['deviceCapturedAt']);
        $this->assertEquals('May 26, 2026 09:15:30', $mapped1['receivedAt']);
        $this->assertEquals('May 26, 2026 09:15:30', $mapped1['createdAt']);
        $this->assertNull($mapped1['inspectedAt']);
        $this->assertNull($mapped1['confirmedAt']);

        $mapped2 = PatientHeaderService::mapPatientModel($withoutDeviceTime);
        $this->assertNull($mapped2['deviceCapturedAt']);
        $this->assertEquals('May 26, 2026 11:20:45', $mapped2['capturedAt']);
        $this->assertEquals('May 26, 2026 11:20:45', $mapped2['receivedAt']);
    }

    public function test_full_lifecycle_differentiates_capture_inspection_and_confirmation_times_with_roles(): void
    {
        Queue::fake();

        // Stage 1: Device capture & server receipt
        Carbon::setTestNow(Carbon::create(2026, 5, 26, 9, 15, 30, 'Asia/Dubai'));
        $header = PatientHeader::create([
            'PatientId' => 'PID-LIFE-1',
            'DonorId' => 'Donor Lifecycle',
            'Status' => 'Imported',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => '2026-05-26 09:14:05',
            'CreatedAt' => '2026-05-26 09:15:30',
        ]);

        // Stage 2: Inspection by Inspector
        Carbon::setTestNow(Carbon::create(2026, 5, 26, 9, 42, 18, 'Asia/Dubai'));
        InspectorService::acceptTest($header, $this->inspectorUser);

        $afterInspection = PatientHeaderService::mapPatientModel($header->fresh());
        $this->assertEquals('May 26, 2026 09:14:05', $afterInspection['capturedAt']);
        $this->assertEquals('May 26, 2026 09:15:30', $afterInspection['receivedAt']);
        $this->assertEquals('May 26, 2026 09:42:18', $afterInspection['inspectedAt']);
        $this->assertEquals('Inspector', $afterInspection['inspectedBy']['role']);
        $this->assertEquals('Omar Inspector', $afterInspection['inspectedBy']['name']);
        $this->assertNull($afterInspection['confirmedAt']);
        $this->assertNull($afterInspection['confirmedBy']);

        // Stage 3: Confirmation by Supervisor
        Carbon::setTestNow(Carbon::create(2026, 5, 26, 10, 5, 44, 'Asia/Dubai'));
        SupervisorService::confirmTest($header->fresh(), $this->supervisorUser, 'Verified clean');

        $afterConfirm = PatientHeaderService::mapPatientModel($header->fresh());
        $this->assertEquals('May 26, 2026 09:14:05', $afterConfirm['capturedAt']);
        $this->assertEquals('May 26, 2026 09:15:30', $afterConfirm['receivedAt']);
        $this->assertEquals('May 26, 2026 09:42:18', $afterConfirm['inspectedAt']);
        $this->assertEquals('May 26, 2026 10:05:44', $afterConfirm['confirmedAt']);
        $this->assertEquals('Expert', $afterConfirm['confirmedBy']['role']);
        $this->assertEquals('Sara Expert', $afterConfirm['confirmedBy']['name']);
        $this->assertEquals('Verified clean', $afterConfirm['confirmedBy']['reason']);
    }

    public function test_admin_acting_as_inspector_and_supervisor_preserves_administrator_role_and_distinct_times(): void
    {
        Queue::fake();

        Carbon::setTestNow(Carbon::create(2026, 5, 26, 12, 0, 0, 'Asia/Dubai'));
        $header = PatientHeader::create([
            'PatientId' => 'PID-ADM-1',
            'DonorId' => 'Donor AdminFlow',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => '2026-05-26 11:55:10',
            'CreatedAt' => '2026-05-26 12:00:00',
        ]);

        // Admin inspects
        Carbon::setTestNow(Carbon::create(2026, 5, 26, 12, 10, 22, 'Asia/Dubai'));
        InspectorService::acceptTest($header, $this->adminUser);

        // Admin bulk confirms
        Carbon::setTestNow(Carbon::create(2026, 5, 26, 12, 25, 59, 'Asia/Dubai'));
        SupervisorService::bulkConfirmTests([$header->Id], $this->adminUser, 'Admin bulk confirmed');

        $mapped = PatientHeaderService::mapPatientModel($header->fresh());
        $this->assertEquals('May 26, 2026 11:55:10', $mapped['capturedAt']);
        $this->assertEquals('May 26, 2026 12:00:00', $mapped['receivedAt']);
        $this->assertEquals('May 26, 2026 12:10:22', $mapped['inspectedAt']);
        $this->assertEquals('Administrator', $mapped['inspectedBy']['role']);
        $this->assertEquals('May 26, 2026 12:25:59', $mapped['confirmedAt']);
        $this->assertEquals('Administrator', $mapped['confirmedBy']['role']);
        $this->assertEquals('Admin bulk confirmed', $mapped['confirmedBy']['reason']);
    }

    public function test_delay_threshold_config_defaults_to_48_hours(): void
    {
        $this->assertEquals(48, config('healgen.delay_threshold_hours'));
    }

    public function test_delay_flags_capture_to_receive_transition_when_exceeding_48_hours(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 29, 10, 0, 0, 'Asia/Dubai'));

        $delayedHeader = PatientHeader::create([
            'PatientId' => 'PID-DLY-1',
            'Status' => 'Imported',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => '2026-05-26 09:00:00',  // 50 hours before CreatedAt
            'CreatedAt' => '2026-05-28 11:00:00', // 23 hours before now()
        ]);

        $mapped = PatientHeaderService::mapPatientModel($delayedHeader);
        $delay = $mapped['delaySummary'];

        $this->assertTrue($delay['hasDelay']);
        $this->assertEquals(48, $delay['thresholdHours']);
        $this->assertEquals(1, $delay['delayedCount']);
        $this->assertEquals(['capture_to_receive'], $delay['delayedStages']);
        $this->assertTrue($delay['stages']['captureToReceive']['isDelayed']);
        $this->assertEquals(50.0, $delay['stages']['captureToReceive']['hours']);
        $this->assertFalse($delay['stages']['receiveToInspection']['isDelayed']);
        $this->assertTrue($delay['stages']['receiveToInspection']['isOngoing']);
        $this->assertNull($delay['stages']['inspectionToSupervision']);
    }

    public function test_delay_flags_ongoing_inspection_and_supervision_waits_and_respects_custom_threshold(): void
    {
        Queue::fake();

        // Test received 52 hours ago and still awaiting inspection -> receiveToInspection is delayed & ongoing
        Carbon::setTestNow(Carbon::create(2026, 5, 28, 14, 0, 0, 'Asia/Dubai'));
        $waitingInspection = PatientHeader::create([
            'PatientId' => 'PID-WAIT-INSP',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => '2026-05-26 09:30:00',
            'CreatedAt' => '2026-05-26 10:00:00', // 52h ago
        ]);

        $mappedWaiting = PatientHeaderService::mapPatientModel($waitingInspection);
        $this->assertTrue($mappedWaiting['delaySummary']['hasDelay']);
        $this->assertFalse($mappedWaiting['delaySummary']['stages']['captureToReceive']['isDelayed']);
        $this->assertTrue($mappedWaiting['delaySummary']['stages']['receiveToInspection']['isDelayed']);
        $this->assertTrue($mappedWaiting['delaySummary']['stages']['receiveToInspection']['isOngoing']);
        $this->assertEquals(52.0, $mappedWaiting['delaySummary']['stages']['receiveToInspection']['hours']);

        // Inspector accepts now (at 52h), then 49 hours later still awaiting supervisor confirmation
        InspectorService::acceptTest($waitingInspection, $this->inspectorUser);

        Carbon::setTestNow(Carbon::create(2026, 5, 30, 15, 0, 0, 'Asia/Dubai')); // +49h
        $mappedAwaitingSup = PatientHeaderService::mapPatientModel($waitingInspection->fresh());
        $this->assertTrue($mappedAwaitingSup['delaySummary']['hasDelay']);
        $this->assertEquals(2, $mappedAwaitingSup['delaySummary']['delayedCount']);
        $this->assertEquals(['receive_to_inspection', 'inspection_to_supervision'], $mappedAwaitingSup['delaySummary']['delayedStages']);
        $this->assertTrue($mappedAwaitingSup['delaySummary']['stages']['inspectionToSupervision']['isDelayed']);
        $this->assertTrue($mappedAwaitingSup['delaySummary']['stages']['inspectionToSupervision']['isOngoing']);

        // Supervisor confirms now -> inspectionToSupervision is no longer ongoing, still flagged delayed
        SupervisorService::confirmTest($waitingInspection->fresh(), $this->supervisorUser);
        $mappedConfirmed = PatientHeaderService::mapPatientModel($waitingInspection->fresh());
        $this->assertFalse($mappedConfirmed['delaySummary']['stages']['inspectionToSupervision']['isOngoing']);
        $this->assertTrue($mappedConfirmed['delaySummary']['stages']['inspectionToSupervision']['isDelayed']);

        // Raising threshold to 72h clears both 52h and 49h flags dynamically via config
        config(['healgen.delay_threshold_hours' => 72]);
        $mappedHighThreshold = PatientHeaderService::mapPatientModel($waitingInspection->fresh());
        $this->assertFalse($mappedHighThreshold['delaySummary']['hasDelay']);
        $this->assertEquals(72, $mappedHighThreshold['delaySummary']['thresholdHours']);
    }

    public function test_inspector_rejected_test_does_not_flag_supervision_waiting_delay(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 26, 10, 0, 0, 'Asia/Dubai'));
        $header = PatientHeader::create([
            'PatientId' => 'PID-REJ-1',
            'Status' => 'Awaiting Inspection',
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'DateTime' => '2026-05-26 09:50:00',
            'CreatedAt' => '2026-05-26 10:00:00',
        ]);

        Carbon::setTestNow(Carbon::create(2026, 5, 26, 11, 0, 0, 'Asia/Dubai'));
        InspectorService::rejectTest($header, $this->inspectorUser, 'Unclear sample');

        // Even 72 hours later, a rejected test is NOT waiting for supervision
        Carbon::setTestNow(Carbon::create(2026, 5, 29, 11, 0, 0, 'Asia/Dubai'));
        $mapped = PatientHeaderService::mapPatientModel($header->fresh());
        $this->assertFalse($mapped['delaySummary']['hasDelay']);
        $this->assertNull($mapped['delaySummary']['stages']['inspectionToSupervision']);
    }
}
