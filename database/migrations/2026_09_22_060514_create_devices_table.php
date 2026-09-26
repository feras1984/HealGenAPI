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
        Schema::create('devices', function (Blueprint $table) {
            $table->id();

            $table->foreignId('location_id')
                ->constrained('locations');

            $table->foreignId('device_type_id')
                ->constrained('device_types');

            $table->string('name', 150);

            /*
             * Internal identifier used by the integration.
             * Example: D600-DXB-001
             */
            $table->string('device_code', 100)
                ->unique();

            /*
             * Physical manufacturer's serial number.
             */
            $table->string('serial_number', 150)
                ->nullable()
                ->unique();

            /*
             * Optional network information.
             */
            $table->string('ip_address', 45)
                ->nullable();

            /*
             * If false, incoming results from this device
             * must not enter the normal test workflow.
             */
            $table->boolean('is_active')
                ->default(true);

            /*
             * Last successful communication with the device/interface.
             */
            $table->dateTime('last_seen_at')
                ->nullable();

            $table->dateTime('activated_at')
                ->nullable();

            $table->dateTime('deactivated_at')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();

            $table->index([
                'location_id',
                'is_active',
            ]);

            $table->index([
                'device_type_id',
                'is_active',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
