<?php

namespace Tests\Feature;

use App\Services\DeviceImportService\DeviceImportService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class DeviceImportTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_import_endpoint_accepts_device_id_and_device_code_and_forwards_to_service(): void
    {
        $mockService = Mockery::mock(DeviceImportService::class);
        $this->app->instance(DeviceImportService::class, $mockService);

        $mockService->shouldReceive('import')
            ->once()
            ->withArgs(function ($payload, $deviceId, $deviceCode) {
                return $deviceId === 4
                    && $deviceCode === 'D600-DXB-004'
                    && $payload['file_name'] === 'test.xlsx'
                    && $payload['file_hash'] === '1111111111111111111111111111111111111111111111111111111111111111';
            })
            ->andReturn([
                'success' => true,
                'duplicate' => false,
                'patient_header_id' => 999,
                'tests_inserted' => 1,
                'status' => 'Imported',
            ]);

        $response = $this->postJson('/api/device/imports', [
            'device_id' => 4,
            'device_code' => 'D600-DXB-004',
            'file_name' => 'test.xlsx',
            'file_hash' => '1111111111111111111111111111111111111111111111111111111111111111',
            'patient' => [
                'test_operator' => 'Tech 1',
                'patient_id' => 'P-12345',
                'donor_id' => 'D-99',
                'collection_site' => 'Site A',
                'cup_lot_number' => 'LOT-01',
                'date_time' => '2026-11-12 10:00:00',
            ],
            'tests' => [
                [
                    'substance' => 'THC',
                    'software_result' => 'Negative',
                    'visual_result' => 'Negative',
                ],
            ],
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'duplicate' => false,
            'patient_header_id' => 999,
        ]);
    }

    public function test_import_endpoint_rejects_non_integer_device_id(): void
    {
        $response = $this->postJson('/api/device/imports', [
            'device_id' => 'not-an-integer',
            'device_code' => 'D600-DXB-004',
            'file_name' => 'test.xlsx',
            'file_hash' => '1111111111111111111111111111111111111111111111111111111111111111',
            'patient' => [
                'patient_id' => 'P-12345',
            ],
            'tests' => [
                [
                    'substance' => 'THC',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['device_id']);
    }

    public function test_import_endpoint_rejects_device_id_nested_in_patient(): void
    {
        $response = $this->postJson('/api/device/imports', [
            'file_name' => 'test.xlsx',
            'file_hash' => '1111111111111111111111111111111111111111111111111111111111111111',
            'patient' => [
                'patient_id' => 'P-12345',
                'device_id' => 4, // Forbidden key inside patient array
            ],
            'tests' => [
                [
                    'substance' => 'THC',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['patient']);
    }

    public function test_service_persists_device_id_and_device_code_to_database(): void
    {
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);
        DB::purge();

        Schema::dropIfExists('PatientTests');
        Schema::dropIfExists('PatientHeader');
        Schema::dropIfExists('devices');

        Schema::create('PatientHeader', function ($table) {
            $table->increments('Id');
            $table->string('TestOperator')->nullable();
            $table->string('PatientId');
            $table->string('DonorId')->nullable();
            $table->string('CollectionSite')->nullable();
            $table->string('CupLotNumber')->nullable();
            $table->unsignedBigInteger('DeviceId')->nullable();
            $table->string('DeviceCode', 100)->nullable();
            $table->dateTime('DateTime')->nullable();
            $table->string('SourceFile')->nullable();
            $table->dateTime('ProcessedAt')->nullable();
            $table->string('Status')->default('Unread');
            $table->string('FileHash')->nullable();
            $table->text('ErrorMessage')->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });

        Schema::create('PatientTests', function ($table) {
            $table->increments('Id');
            $table->unsignedInteger('PatientHeaderId');
            $table->string('Substance');
            $table->string('SoftwareResult')->nullable();
            $table->string('VisualResult')->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });

        Schema::create('devices', function ($table) {
            $table->increments('id');
            $table->string('device_code', 100);
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_seen_at')->nullable();
            $table->timestamps();
        });

        DB::table('devices')->insert([
            'id' => 4,
            'device_code' => 'D600-DXB-004',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $service = new DeviceImportService();
        $payload = [
            'file_name' => 'sample.xlsx',
            'file_hash' => '2222222222222222222222222222222222222222222222222222222222222222',
            'patient' => [
                'test_operator' => 'Dr. Smith',
                'patient_id' => 'P-999',
                'donor_id' => 'D-111',
                'collection_site' => 'Site 1',
                'cup_lot_number' => 'LOT-X',
                'date_time' => '2026-11-12 12:00:00',
            ],
            'tests' => [
                [
                    'substance' => 'THC',
                    'software_result' => 'Negative',
                    'visual_result' => 'Negative',
                ],
            ],
        ];

        // 1. Direct pass of deviceId and deviceCode
        $res = $service->import($payload, 4, 'D600-DXB-004');
        $this->assertTrue($res['success']);
        $this->assertEquals('Imported', $res['status']);

        $row = DB::table('PatientHeader')->where('Id', $res['patient_header_id'])->first();
        $this->assertEquals(4, $row->DeviceId);
        $this->assertEquals('D600-DXB-004', $row->DeviceCode);
        $this->assertEquals('Imported', $row->Status);

        $device = DB::table('devices')->where('id', 4)->first();
        $this->assertNotNull($device->last_seen_at);

        // 2. Auto-resolution: pass ONLY device_code, verify device_id is auto-resolved
        $payload2 = $payload;
        $payload2['file_hash'] = '3333333333333333333333333333333333333333333333333333333333333333';
        $res2 = $service->import($payload2, null, 'D600-DXB-004');
        $row2 = DB::table('PatientHeader')->where('Id', $res2['patient_header_id'])->first();
        $this->assertEquals(4, $row2->DeviceId);
        $this->assertEquals('D600-DXB-004', $row2->DeviceCode);

        // 3. Deactivated device gets Status = 'Blocked'
        DB::table('devices')->where('id', 4)->update(['is_active' => false]);
        $payload3 = $payload;
        $payload3['file_hash'] = '4444444444444444444444444444444444444444444444444444444444444444';
        $res3 = $service->import($payload3, 4, 'D600-DXB-004');
        $this->assertEquals('Blocked', $res3['status']);
        $row3 = DB::table('PatientHeader')->where('Id', $res3['patient_header_id'])->first();
        $this->assertEquals('Blocked', $row3->Status);
    }
}
