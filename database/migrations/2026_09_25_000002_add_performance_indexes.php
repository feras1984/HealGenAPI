<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('PatientHeader', function (Blueprint $table) {
            $table->index(['Status', 'device_id'], 'idx_ph_status_device');
            $table->index(['CreatedAt'], 'idx_ph_created_at');
            $table->index(['PatientId'], 'idx_ph_patient_id');
            $table->index(['DonorId'], 'idx_ph_donor_id');
        });

        Schema::table('PatientTests', function (Blueprint $table) {
            $table->index(['PatientHeaderId', 'Substance'], 'idx_pt_header_substance');
        });

        Schema::table('device_user', function (Blueprint $table) {
            $table->index(['user_id', 'is_active'], 'idx_du_user_active');
            $table->index(['device_id', 'is_active'], 'idx_du_device_active');
        });

        Schema::table('patient_test_actions', function (Blueprint $table) {
            $table->index(['patient_header_id'], 'idx_pta_patient_header');
            $table->index(['user_id', 'action'], 'idx_pta_user_action');
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->index(['device_code'], 'idx_dev_code');
            $table->index(['location_id', 'is_active'], 'idx_dev_loc_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('PatientHeader', function (Blueprint $table) {
            $table->dropIndex('idx_ph_status_device');
            $table->dropIndex('idx_ph_created_at');
            $table->dropIndex('idx_ph_patient_id');
            $table->dropIndex('idx_ph_donor_id');
        });

        Schema::table('PatientTests', function (Blueprint $table) {
            $table->dropIndex('idx_pt_header_substance');
        });

        Schema::table('device_user', function (Blueprint $table) {
            $table->dropIndex('idx_du_user_active');
            $table->dropIndex('idx_du_device_active');
        });

        Schema::table('patient_test_actions', function (Blueprint $table) {
            $table->dropIndex('idx_pta_patient_header');
            $table->dropIndex('idx_pta_user_action');
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->dropIndex('idx_dev_code');
            $table->dropIndex('idx_dev_loc_active');
        });
    }
};
