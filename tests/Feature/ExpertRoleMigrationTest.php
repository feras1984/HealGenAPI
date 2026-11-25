<?php

namespace Tests\Feature;

use App\Enums\AdminRoleEnum;
use App\Facades\MonitorService\MonitorService;
use App\Models\Admin;
use App\Models\PatientTestAction;
use App\Models\SystemAuditLog;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExpertRoleMigrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->createSchema();
    }

    protected function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->string('avatar')->nullable();
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

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('device_code')->unique();
            $table->unsignedBigInteger('device_type_id')->nullable();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('device_user', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('device_id');
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('patient_test_actions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_header_id');
            $table->unsignedBigInteger('location_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->string('role');
            $table->string('action');
            $table->string('previous_status');
            $table->string('new_status');
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('system_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('role')->nullable();
            $table->string('action');
            $table->string('entity_type')->nullable();
            $table->string('entity_id')->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function test_admin_role_enum_uses_expert_instead_of_supervisor(): void
    {
        $values = array_map(fn (AdminRoleEnum $case) => $case->value, AdminRoleEnum::cases());

        $this->assertContains('Expert', $values);
        $this->assertNotContains('Supervisor', $values);
        $this->assertEquals('Expert', AdminRoleEnum::EXPERT->value);
    }

    public function test_migration_renames_supervisor_roles_case_insensitively_and_reverses_cleanly(): void
    {
        $sup1 = Admin::create(['first_name' => 'Title', 'last_name' => 'Case', 'role' => 'Supervisor']);
        $sup2 = Admin::create(['first_name' => 'Upper', 'last_name' => 'Case', 'role' => 'SUPERVISOR']);
        $insp = Admin::create(['first_name' => 'Keep', 'last_name' => 'Inspector', 'role' => 'Inspector']);

        $user1 = User::create(['email' => 'sup1@test.local', 'reference_id' => $sup1->id, 'reference_type' => Admin::class]);

        PatientTestAction::create([
            'patient_header_id' => 1,
            'user_id' => $user1->id,
            'role' => 'Supervisor',
            'action' => 'SUPERVISOR_CONFIRM',
            'previous_status' => 'Inspector Accepted',
            'new_status' => 'Confirmed',
        ]);

        SystemAuditLog::create([
            'user_id' => $user1->id,
            'user_name' => 'Title Case',
            'role' => 'SUPERVISOR',
            'action' => 'SUPERVISOR_CONFIRM',
            'entity_type' => 'PatientHeader',
            'entity_id' => '1',
        ]);

        $migration = require database_path('migrations/2026_11_26_000001_rename_supervisor_role_to_expert.php');
        $migration->up();

        $this->assertEquals('Expert', $sup1->fresh()->role);
        $this->assertEquals('Expert', $sup2->fresh()->role);
        $this->assertEquals('Inspector', $insp->fresh()->role);
        $this->assertEquals('Expert', PatientTestAction::first()->role);
        $this->assertEquals('Expert', SystemAuditLog::first()->role);

        // MonitorService aggregates roles case-insensitively under 'Expert'
        $roleOps = MonitorService::getRoleOperations();
        $this->assertEquals(2, $roleOps['roles']['Expert']);
        $this->assertArrayNotHasKey('Supervisor', $roleOps['roles']);
        $this->assertEquals(1, $roleOps['roles']['Inspector']);

        // Rollback restores 'Supervisor'
        $migration->down();
        $this->assertEquals('Supervisor', $sup1->fresh()->role);
        $this->assertEquals('Supervisor', $sup2->fresh()->role);
        $this->assertEquals('Inspector', $insp->fresh()->role);
        $this->assertEquals('Supervisor', PatientTestAction::first()->role);
        $this->assertEquals('Supervisor', SystemAuditLog::first()->role);
    }
}
