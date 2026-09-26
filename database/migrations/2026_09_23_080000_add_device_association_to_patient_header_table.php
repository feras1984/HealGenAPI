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
            $table->foreignId('device_id')
                ->nullable()
                ->constrained('devices')
                ->nullOnDelete();

            $table->string('device_code', 100)
                ->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('PatientHeader', function (Blueprint $table) {
            $table->dropForeign(['device_id']);
            $table->dropColumn(['device_id', 'device_code']);
        });
    }
};
