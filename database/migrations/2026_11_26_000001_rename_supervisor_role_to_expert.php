<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            if (Schema::hasTable('admins')) {
                DB::table('admins')
                    ->whereRaw('LOWER(role) = ?', ['supervisor'])
                    ->update(['role' => 'Expert']);
            }

            if (Schema::hasTable('patient_test_actions')) {
                DB::table('patient_test_actions')
                    ->whereRaw('LOWER(role) = ?', ['supervisor'])
                    ->update(['role' => 'Expert']);
            }

            if (Schema::hasTable('system_audit_logs')) {
                DB::table('system_audit_logs')
                    ->whereRaw('LOWER(role) = ?', ['supervisor'])
                    ->update(['role' => 'Expert']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function () {
            if (Schema::hasTable('admins')) {
                DB::table('admins')
                    ->whereRaw('LOWER(role) = ?', ['expert'])
                    ->update(['role' => 'Supervisor']);
            }

            if (Schema::hasTable('patient_test_actions')) {
                DB::table('patient_test_actions')
                    ->whereRaw('LOWER(role) = ?', ['expert'])
                    ->update(['role' => 'Supervisor']);
            }

            if (Schema::hasTable('system_audit_logs')) {
                DB::table('system_audit_logs')
                    ->whereRaw('LOWER(role) = ?', ['expert'])
                    ->update(['role' => 'Supervisor']);
            }
        });
    }
};
