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
        Schema::create('patient_test_actions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_header_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role');
            $table->string('action'); // INSPECTOR_ACCEPT, INSPECTOR_REJECT
            $table->string('previous_status');
            $table->string('new_status');
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index('patient_header_id');
            $table->index('user_id');
            $table->index('created_at');
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_test_actions');
    }
};
