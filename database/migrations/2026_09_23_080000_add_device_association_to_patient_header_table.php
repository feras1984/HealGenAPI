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
        if (!Schema::hasTable('PatientHeader')) {
            return;
        }

        Schema::table('PatientHeader', function (Blueprint $table) {
            if (!Schema::hasColumn('PatientHeader', 'DeviceId')) {
                $table->unsignedBigInteger('DeviceId')->nullable();
            }

            if (!Schema::hasColumn('PatientHeader', 'DeviceCode')) {
                $table->string('DeviceCode', 100)->nullable();
            }

            $table->foreign('DeviceId')
                ->references('id')
                ->on('devices')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('PatientHeader')) {
            return;
        }

        Schema::table('PatientHeader', function (Blueprint $table) {
            // Preserve DeviceId and DeviceCode.
            // Only remove the foreign key created by this migration.
            $table->dropForeign(['DeviceId']);
        });
    }
};
