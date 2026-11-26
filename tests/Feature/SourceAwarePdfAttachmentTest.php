<?php

namespace Tests\Feature;

use App\Enums\IngestionSourceEnum;
use App\Facades\PatientService\PatientHeaderService as PatientHeaderServiceFacade;
use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\DeviceUser;
use App\Models\File;
use App\Models\Location;
use App\Models\LocationInspector;
use App\Models\PatientHeader;
use App\Models\SystemAuditLog;
use App\Models\User;
use App\Services\PatientService\TestAttachmentStorageService;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SourceAwarePdfAttachmentTest extends TestCase
{
    private Location $location1;
    private Location $location2;
    private Device $device1;
    private Device $device2;
    private User $adminUser;
    private User $expertUser;
    private User $inspector1;
    private User $inspector2;
    private User $employee1;
    private User $employee2;
    /** @var array<int, UploadedFile> */
    private array $uploadedFiles = [];

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
        Storage::fake(TestAttachmentStorageService::DISK);

        $this->createSchema();
        $this->seedData();
    }

    protected function tearDown(): void
    {
        $this->uploadedFiles = [];
        parent::tearDown();
    }

    private function createSchema(): void
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
            $table->string('device_code', 100)->unique();
            $table->boolean('is_active')->default(true);
            $table->dateTime('last_seen_at')->nullable();
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

        Schema::create('location_inspectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('assigned_at');
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

        Schema::create('PatientHeader', function (Blueprint $table) {
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
            $table->string('IngestionSource', 20)->default('excel');
            $table->dateTime('ProcessedAt')->nullable();
            $table->string('Status')->default('Imported');
            $table->string('FileHash', 64)->nullable()->unique();
            $table->text('ErrorMessage')->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });

        Schema::create('PatientTests', function (Blueprint $table) {
            $table->increments('Id');
            $table->unsignedInteger('PatientHeaderId');
            $table->string('Substance');
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
            $table->index(['reference_id', 'reference_type'], 'files_reference_index');
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

    private function seedData(): void
    {
        $this->location1 = Location::create(['name' => 'Central Lab', 'code' => 'LOC-1']);
        $this->location2 = Location::create(['name' => 'North Clinic', 'code' => 'LOC-2']);

        $deviceType = DeviceType::create(['name' => 'HealGen D600']);

        $this->device1 = Device::create([
            'location_id' => $this->location1->id,
            'device_type_id' => $deviceType->id,
            'name' => 'D600 Unit 1',
            'device_code' => 'D600-001',
            'is_active' => true,
        ]);

        $this->device2 = Device::create([
            'location_id' => $this->location2->id,
            'device_type_id' => $deviceType->id,
            'name' => 'D600 Unit 2',
            'device_code' => 'D600-002',
            'is_active' => true,
        ]);

        $this->adminUser = $this->createUserWithRole('admin@test.local', 'Administrator', 'Sys', 'Admin');
        $this->expertUser = $this->createUserWithRole('expert@test.local', 'Expert', 'Lead', 'Expert');
        $this->inspector1 = $this->createUserWithRole('insp1@test.local', 'Inspector', 'Insp', 'One');
        $this->inspector2 = $this->createUserWithRole('insp2@test.local', 'Inspector', 'Insp', 'Two');
        $this->employee1 = $this->createUserWithRole('emp1@test.local', 'Employee', 'Emp', 'One');
        $this->employee2 = $this->createUserWithRole('emp2@test.local', 'Employee', 'Emp', 'Two');

        LocationInspector::create([
            'location_id' => $this->location1->id,
            'user_id' => $this->inspector1->id,
            'assigned_at' => Carbon::now()->subDay(),
            'is_active' => true,
        ]);

        LocationInspector::create([
            'location_id' => $this->location2->id,
            'user_id' => $this->inspector2->id,
            'assigned_at' => Carbon::now()->subDay(),
            'is_active' => true,
        ]);

        DeviceUser::create([
            'device_id' => $this->device1->id,
            'user_id' => $this->employee1->id,
            'assigned_at' => Carbon::now()->subDay(),
            'is_active' => true,
        ]);

        DeviceUser::create([
            'device_id' => $this->device2->id,
            'user_id' => $this->employee2->id,
            'assigned_at' => Carbon::now()->subDay(),
            'is_active' => true,
        ]);
    }

    private function createUserWithRole(string $email, string $role, string $first, string $last): User
    {
        $admin = Admin::create([
            'first_name' => $first,
            'last_name' => $last,
            'role' => $role,
        ]);

        return User::create([
            'email' => $email,
            'reference_id' => $admin->id,
            'reference_type' => Admin::class,
        ]);
    }

    private function makeValidPdfBytes(string $marker): string
    {
        return "%PDF-1.4\n1 0 obj\n<< /Length " . strlen($marker) . " >>\nstream\n{$marker}\nendstream\nendobj\n%%EOF\n";
    }

    private function makeUploadedPdf(string $fileName, string $bytes): UploadedFile
    {
        $file = UploadedFile::fake()->createWithContent($fileName, $bytes);
        $file->mimeType('application/pdf');
        if (isset($file->tempFile) && is_resource($file->tempFile)) {
            fflush($file->tempFile);
        }
        $this->uploadedFiles[] = $file;

        return $file;
    }

    private function ingestExcelTest(string $patientId = 'P-EXCEL-100', ?string $declaredSource = null): int
    {
        $payload = [
            'device_id' => $this->device1->id,
            'device_code' => $this->device1->device_code,
            'file_name' => "{$patientId}.xlsx",
            'file_hash' => hash('sha256', "excel-{$patientId}-" . uniqid('', true)),
            'patient' => [
                'test_operator' => 'Emp One',
                'patient_id' => $patientId,
                'donor_id' => "D-{$patientId}",
                'collection_site' => 'Central Lab',
                'cup_lot_number' => 'LOT-EX-1',
                'date_time' => '2026-11-27 08:00:00',
            ],
            'tests' => [
                [
                    'substance' => 'THC',
                    'software_result' => '(-)Negative',
                    'visual_result' => '(-)Negative',
                ],
            ],
        ];

        if ($declaredSource !== null) {
            $payload['ingestion_source'] = $declaredSource;
        }

        $res = $this->postJson('/api/device/imports', $payload);
        $res->assertStatus(201)
            ->assertJson([
                'success' => true,
                'duplicate' => false,
                'ingestion_source' => IngestionSourceEnum::EXCEL->value,
            ]);

        return (int) $res->json('patient_header_id');
    }

    private function ingestPdfTest(string $patientId = 'P-PDF-100', ?string $pdfMarker = null, ?string $declaredSource = null): array
    {
        $pdfBytes = $this->makeValidPdfBytes($pdfMarker ?? "DIRECT-PDF-{$patientId}");
        $fileHash = hash('sha256', $pdfBytes);
        $fileName = "{$patientId}.pdf";

        $payload = [
            'device_id' => $this->device1->id,
            'device_code' => $this->device1->device_code,
            'file_name' => $fileName,
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => 'Emp One',
                'patient_id' => $patientId,
                'donor_id' => "D-{$patientId}",
                'collection_site' => 'Central Lab',
                'cup_lot_number' => 'LOT-PDF-1',
                'date_time' => '2026-11-27 09:00:00',
            ],
            'tests' => [
                [
                    'substance' => 'MET',
                    'software_result' => '(-)Negative',
                    'visual_result' => null,
                ],
            ],
        ];

        if ($declaredSource !== null) {
            $payload['ingestion_source'] = $declaredSource;
        }

        $res = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $res->assertStatus(201)
            ->assertJson([
                'success' => true,
                'duplicate' => false,
                'ingestion_source' => IngestionSourceEnum::PDF->value,
            ]);

        return [
            'headerId' => (int) $res->json('patient_header_id'),
            'pdfBytes' => $pdfBytes,
            'fileHash' => $fileHash,
            'fileName' => $fileName,
            'payload' => $payload,
        ];
    }

    public function test_excel_ingestion_records_excel_source_and_allows_employee_upload_replace_and_delete(): void
    {
        $headerId = $this->ingestExcelTest('P-EXCEL-FLOW');

        $this->assertDatabaseHas('PatientHeader', [
            'Id' => $headerId,
            'IngestionSource' => 'excel',
        ]);

        $patient = PatientHeader::with('file')->findOrFail($headerId);
        $mapped = PatientHeaderServiceFacade::mapPatientModel($patient);
        $this->assertSame('excel', $mapped['ingestionSource']);
        $this->assertTrue($mapped['canManageAttachment']);

        // 1. Employee uploads initial PDF
        $firstPdfBytes = $this->makeValidPdfBytes('EMPLOYEE-UPLOAD-V1');
        $firstUpload = $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $headerId), [
                'file' => $this->makeUploadedPdf('manual_v1.pdf', $firstPdfBytes),
            ]);
        $firstUpload->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonPath('attachment.name', 'manual_v1.pdf');

        // 2. Existence of a PDF attachment must NOT change source or block Employee replacement
        $patient->refresh();
        $this->assertSame('excel', $patient->IngestionSource);
        $this->assertFalse($patient->isPdfIngested());
        $this->assertTrue($patient->canEmployeeManageAttachment());

        $secondPdfBytes = $this->makeValidPdfBytes('EMPLOYEE-UPLOAD-V2');
        $replaceUpload = $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $headerId), [
                'file' => $this->makeUploadedPdf('manual_v2.pdf', $secondPdfBytes),
            ]);
        $replaceUpload->assertStatus(201)
            ->assertJsonPath('status', true)
            ->assertJsonPath('attachment.name', 'manual_v2.pdf');

        $this->assertDatabaseCount('files', 1);
        $this->assertSame(
            2,
            SystemAuditLog::where('action', 'TEST_FILE_UPLOADED')
                ->where('entity_id', (string) $headerId)
                ->count()
        );

        // 3. Inspector, Expert, Admin, and assigned Employee can view & download
        foreach ([$this->adminUser, $this->expertUser, $this->inspector1, $this->employee1] as $viewer) {
            $this->actingAs($viewer)->get(route('admin.tests.file.view', $headerId))->assertStatus(200);
            $this->actingAs($viewer)->get(route('admin.tests.file.download', $headerId))->assertStatus(200);
        }

        // 4. Employee can delete the attachment on Excel-ingested test
        $this->actingAs($this->employee1)
            ->deleteJson(route('admin.tests.file.delete', $headerId))
            ->assertStatus(200)
            ->assertJson(['status' => true]);

        $this->assertDatabaseCount('files', 0);
    }

    public function test_pdf_ingestion_records_pdf_source_and_blocks_employee_upload_replace_and_delete(): void
    {
        $ingested = $this->ingestPdfTest('P-PDF-LOCKED', 'ORIGINAL-INGESTED-PDF-BYTES');
        $headerId = $ingested['headerId'];
        $originalBytes = $ingested['pdfBytes'];

        $this->assertDatabaseHas('PatientHeader', [
            'Id' => $headerId,
            'IngestionSource' => 'pdf',
        ]);

        $patient = PatientHeader::with('file')->findOrFail($headerId);
        $mapped = PatientHeaderServiceFacade::mapPatientModel($patient);
        $this->assertSame('pdf', $mapped['ingestionSource']);
        $this->assertFalse($mapped['canManageAttachment']);

        $originalFile = $patient->file;
        $this->assertNotNull($originalFile);
        $originalPath = $originalFile->url;

        // 1. Employee attempt to upload/replace PDF (even attempting to spoof ingestion_source=excel) is rejected with 403
        $replacementBytes = $this->makeValidPdfBytes('UNAUTHORIZED-REPLACEMENT');
        $uploadAttempt = $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $headerId), [
                'file' => $this->makeUploadedPdf('hack.pdf', $replacementBytes),
                'ingestion_source' => 'excel',
                'IngestionSource' => 'excel',
            ]);

        $uploadAttempt->assertStatus(403)
            ->assertJson([
                'status' => false,
                'code' => 'PDF_INGESTION_IMMUTABLE',
                'ingestionSource' => 'pdf',
            ]);

        // 2. Employee attempt to delete ingested PDF is rejected with 403
        $deleteAttempt = $this->actingAs($this->employee1)
            ->deleteJson(route('admin.tests.file.delete', $headerId));

        $deleteAttempt->assertStatus(403)
            ->assertJson([
                'status' => false,
                'code' => 'PDF_INGESTION_IMMUTABLE',
                'ingestionSource' => 'pdf',
            ]);

        // 3. Original PDF record, raw bytes, disk state, and audit logs remain completely intact
        $this->assertDatabaseCount('files', 1);
        $this->assertDatabaseCount('system_audit_logs', 0);
        $storedFiles = Storage::disk(TestAttachmentStorageService::DISK)
            ->allFiles(TestAttachmentStorageService::DIRECTORY);
        $this->assertSame([$originalPath], $storedFiles);
        $this->assertSame(
            $originalBytes,
            Storage::disk(TestAttachmentStorageService::DISK)->get($originalPath)
        );

        // 4. Read-only view & download remain available to Employee, Inspector (assigned), Expert, and Admin
        foreach ([$this->adminUser, $this->expertUser, $this->inspector1, $this->employee1] as $viewer) {
            $view = $this->actingAs($viewer)->get(route('admin.tests.file.view', $headerId));
            $view->assertStatus(200);
            $this->assertSame($originalBytes, $view->streamedContent());

            $dl = $this->actingAs($viewer)->get(route('admin.tests.file.download', $headerId));
            $dl->assertStatus(200);
            $this->assertSame($originalBytes, $dl->streamedContent());
        }

        // 5. Unauthorized roles / out-of-scope users remain blocked with 403
        $this->actingAs($this->inspector2)->get(route('admin.tests.file.view', $headerId))->assertStatus(403);
        $this->actingAs($this->employee2)->get(route('admin.tests.file.download', $headerId))->assertStatus(403);
        $this->actingAs($this->adminUser)
            ->postJson(route('admin.tests.file.upload', $headerId), [
                'file' => $this->makeUploadedPdf('admin_attempt.pdf', $replacementBytes),
            ])
            ->assertStatus(403);
        $this->actingAs($this->expertUser)
            ->deleteJson(route('admin.tests.file.delete', $headerId))
            ->assertStatus(403);
    }

    public function test_source_is_not_inferred_from_attachment_absence_on_pdf_ingested_test(): void
    {
        $patient = PatientHeader::create([
            'PatientId' => 'P-PDF-NO-FILE',
            'DeviceId' => $this->device1->id,
            'DeviceCode' => $this->device1->device_code,
            'Status' => 'Imported',
            'IngestionSource' => IngestionSourceEnum::PDF->value,
            'CreatedAt' => now(),
            'UpdatedAt' => now(),
        ]);

        // Even with zero rows in `files`, source is explicitly PDF so Employee upload is blocked
        $this->assertDatabaseCount('files', 0);

        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $patient->Id), [
                'file' => $this->makeUploadedPdf('attempt.pdf', $this->makeValidPdfBytes('BLOCKED')),
            ])
            ->assertStatus(403)
            ->assertJson([
                'status' => false,
                'code' => 'PDF_INGESTION_IMMUTABLE',
            ]);

        $this->assertDatabaseCount('files', 0);
    }

    public function test_storage_service_defense_in_depth_rejects_replacing_pdf_ingested_test(): void
    {
        $ingested = $this->ingestPdfTest('P-PDF-SERVICE-GUARD');
        $patient = PatientHeader::with('file')->findOrFail($ingested['headerId']);
        $originalPath = $patient->file->url;

        $service = app(TestAttachmentStorageService::class);
        $newFile = $this->makeUploadedPdf('override.pdf', $this->makeValidPdfBytes('OVERRIDE'));

        $this->expectException(AuthorizationException::class);

        try {
            $service->storeForPatientHeader($patient, $newFile, true);
        } finally {
            $storedFiles = Storage::disk(TestAttachmentStorageService::DISK)
                ->allFiles(TestAttachmentStorageService::DIRECTORY);
            $this->assertSame([$originalPath], $storedFiles);
            $this->assertDatabaseCount('files', 1);
        }
    }

    public function test_optional_ingestion_source_payload_field_is_cross_validated_against_channel(): void
    {
        // Valid explicit matches succeed
        $excelId = $this->ingestExcelTest('P-EXPLICIT-EX', 'excel');
        $this->assertDatabaseHas('PatientHeader', ['Id' => $excelId, 'IngestionSource' => 'excel']);

        $pdf = $this->ingestPdfTest('P-EXPLICIT-PDF', 'EXPLICIT-PDF', 'pdf');
        $this->assertDatabaseHas('PatientHeader', ['Id' => $pdf['headerId'], 'IngestionSource' => 'pdf']);

        // Mismatch: JSON request claiming pdf is rejected with 422
        $this->postJson('/api/device/imports', [
            'ingestion_source' => 'pdf',
            'device_id' => $this->device1->id,
            'device_code' => $this->device1->device_code,
            'file_name' => 'spoof.pdf',
            'file_hash' => hash('sha256', 'spoof-json-pdf'),
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-SPOOF-1',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => null,
                'date_time' => '2026-11-27 10:00:00',
            ],
            'tests' => [
                ['substance' => 'THC', 'software_result' => '(-)Negative', 'visual_result' => null],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['ingestion_source']);

        // Mismatch: Multipart PDF request claiming excel is rejected with 422
        $pdfBytes = $this->makeValidPdfBytes('SPOOF-MULTIPART-EXCEL');
        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode([
                    'ingestion_source' => 'excel',
                    'device_id' => $this->device1->id,
                    'device_code' => $this->device1->device_code,
                    'file_name' => 'spoof.pdf',
                    'file_hash' => hash('sha256', $pdfBytes),
                    'patient' => [
                        'test_operator' => null,
                        'patient_id' => 'P-SPOOF-2',
                        'donor_id' => null,
                        'collection_site' => null,
                        'cup_lot_number' => null,
                        'date_time' => '2026-11-27 10:05:00',
                    ],
                    'tests' => [
                        ['substance' => 'THC', 'software_result' => '(-)Negative', 'visual_result' => null],
                    ],
                ], JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf('spoof.pdf', $pdfBytes),
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ingestion_source']);

        // Invalid value is rejected with 422
        $this->postJson('/api/device/imports', [
            'ingestion_source' => 'csv',
            'device_id' => $this->device1->id,
            'device_code' => $this->device1->device_code,
            'file_name' => 'bad.csv',
            'file_hash' => hash('sha256', 'bad-csv'),
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-SPOOF-3',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => null,
                'date_time' => '2026-11-27 10:10:00',
            ],
            'tests' => [
                ['substance' => 'THC', 'software_result' => '(-)Negative', 'visual_result' => null],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['ingestion_source']);
    }

    public function test_duplicate_ingestion_preserves_original_source_and_returns_it(): void
    {
        $pdf = $this->ingestPdfTest('P-DUP-PDF', 'DUP-PDF-CONTENT');

        $retry = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($pdf['payload'], JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf($pdf['fileName'], $pdf['pdfBytes']),
            ]);

        $retry->assertStatus(200)
            ->assertJson([
                'success' => true,
                'duplicate' => true,
                'patient_header_id' => $pdf['headerId'],
                'ingestion_source' => 'pdf',
            ]);

        $this->assertDatabaseCount('files', 1);
    }

    public function test_migration_backfills_historical_records_without_inferring_from_files_table(): void
    {
        // Recreate PatientHeader WITHOUT IngestionSource to simulate pre-migration database
        Schema::dropIfExists('PatientHeader');
        Schema::create('PatientHeader', function (Blueprint $table) {
            $table->increments('Id');
            $table->string('PatientId');
            $table->string('SourceFile')->nullable();
            $table->string('Status')->default('Imported');
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });

        $excelWithManualPdfId = DB::table('PatientHeader')->insertGetId([
            'PatientId' => 'HIST-EXCEL-WITH-FILE',
            'SourceFile' => 'device_export_01.xlsx',
            'Status' => 'Confirmed',
        ]);

        // Attach a manual PDF file to the historical Excel row — migration must NOT misclassify it as 'pdf'
        File::create([
            'name' => 'employee_uploaded.pdf',
            'url' => 'test_attachments/hist_manual.pdf',
            'reference_id' => $excelWithManualPdfId,
            'reference_type' => PatientHeader::class,
            'order' => 1,
            'is_active' => true,
            'is_image' => false,
            'description' => 'application/pdf',
        ]);

        $legacyNullSourceId = DB::table('PatientHeader')->insertGetId([
            'PatientId' => 'HIST-LEGACY-NULL',
            'SourceFile' => null,
            'Status' => 'SentToHIS',
        ]);

        $directPdfId = DB::table('PatientHeader')->insertGetId([
            'PatientId' => 'HIST-DIRECT-PDF',
            'SourceFile' => 'D600_20261126_Report.PDF ',
            'Status' => 'Imported',
        ]);

        $migration = require database_path('migrations/2026_11_27_000001_add_ingestion_source_to_patient_header_table.php');
        $migration->up();

        $this->assertTrue(Schema::hasColumn('PatientHeader', 'IngestionSource'));

        $this->assertSame('excel', DB::table('PatientHeader')->where('Id', $excelWithManualPdfId)->value('IngestionSource'));
        $this->assertSame('excel', DB::table('PatientHeader')->where('Id', $legacyNullSourceId)->value('IngestionSource'));
        $this->assertSame('pdf', DB::table('PatientHeader')->where('Id', $directPdfId)->value('IngestionSource'));

        // Verify rollback drops the column cleanly
        $migration->down();
        $this->assertFalse(Schema::hasColumn('PatientHeader', 'IngestionSource'));
    }

    public function test_inertia_details_and_role_dashboards_expose_authoritative_source_without_regression(): void
    {
        $excelId = $this->ingestExcelTest('P-DASH-EXCEL');
        $pdf = $this->ingestPdfTest('P-DASH-PDF', 'DASHBOARD-PDF-BYTES');
        $pdfId = $pdf['headerId'];

        // Employee uploads PDF to the Excel-ingested test
        $excelPdfBytes = $this->makeValidPdfBytes('EXCEL-MANUAL-PDF');
        $this->actingAs($this->employee1)
            ->postJson(route('admin.tests.file.upload', $excelId), [
                'file' => $this->makeUploadedPdf('excel_manual.pdf', $excelPdfBytes),
            ])
            ->assertStatus(201);

        // 1. Inertia Test Details page props expose authoritative source & capability flags
        $excelShow = $this->actingAs($this->employee1)
            ->get(route('patient.show', ['locale' => 'en', 'patient' => $excelId]));
        $excelShow->assertStatus(200);
        $excelPatientProp = $excelShow->viewData('page')['props']['patient'] ?? null;
        $this->assertIsArray($excelPatientProp);
        $this->assertSame('excel', $excelPatientProp['ingestionSource']);
        $this->assertTrue($excelPatientProp['canManageAttachment']);
        $this->assertNotEmpty($excelPatientProp['history']);

        $pdfShow = $this->actingAs($this->employee1)
            ->get(route('patient.show', ['locale' => 'en', 'patient' => $pdfId]));
        $pdfShow->assertStatus(200);
        $pdfPatientProp = $pdfShow->viewData('page')['props']['patient'] ?? null;
        $this->assertIsArray($pdfPatientProp);
        $this->assertSame('pdf', $pdfPatientProp['ingestionSource']);
        $this->assertFalse($pdfPatientProp['canManageAttachment']);
        $this->assertNotNull($pdfPatientProp['attachment']);
        $this->assertNotEmpty($pdfPatientProp['history']);

        // 2. Employee Dashboard data includes both tests with authoritative flags
        $empData = $this->actingAs($this->employee1)
            ->getJson(route('admin.employee.data'))
            ->assertOk()
            ->json('data');
        $this->assertSame(2, $empData['kpis']['totalIngestedCount']);
        $empTestsById = collect($empData['recentTests'])->keyBy('id');
        $this->assertSame('excel', $empTestsById[$excelId]['ingestionSource']);
        $this->assertTrue($empTestsById[$excelId]['canManageAttachment']);
        $this->assertSame('pdf', $empTestsById[$pdfId]['ingestionSource']);
        $this->assertFalse($empTestsById[$pdfId]['canManageAttachment']);

        // 3. Inspector, Expert, Admin, and Monitor endpoints remain healthy with mixed sources
        $inspData = $this->actingAs($this->inspector1)
            ->getJson(route('admin.inspector.data'))
            ->assertOk()
            ->json('data');
        $this->assertSame(2, $inspData['kpis']['pendingCount']);

        $supData = $this->actingAs($this->expertUser)
            ->getJson(route('admin.supervisor.data'))
            ->assertOk()
            ->json('data');
        $this->assertSame(2, $supData['kpis']['pendingCount']);

        $adminData = $this->actingAs($this->adminUser)
            ->getJson(route('admin.dashboard.data'))
            ->assertOk()
            ->json('data');
        $this->assertCount(2, $adminData['recentOperations']);

        $monitorData = $this->actingAs($this->adminUser)
            ->getJson(route('admin.monitor.data'))
            ->assertOk()
            ->json('data');
        $this->assertSame(2, $monitorData['summary']['total']);

        // 4. Inspector & Expert workflows remain functional for both Excel & PDF tests
        $this->actingAs($this->inspector1)
            ->postJson(route('admin.inspector.accept', $excelId))
            ->assertOk();
        $this->actingAs($this->expertUser)
            ->postJson(route('admin.supervisor.confirm', $pdfId), ['note' => 'Verified PDF'])
            ->assertOk()
            ->assertJsonPath('data.test.status', 'Confirmed')
            ->assertJsonPath('data.test.ingestionSource', 'pdf');

        // 5. Attachments remain accessible post-workflow decisions
        foreach ([$this->inspector1, $this->expertUser, $this->adminUser, $this->employee1] as $user) {
            $this->actingAs($user)->get(route('admin.tests.file.view', $excelId))->assertOk();
            $this->actingAs($user)->get(route('admin.tests.file.view', $pdfId))->assertOk();
        }
    }

    public function test_failed_pdf_ingestion_rolls_back_cleanly_and_subsequent_retry_succeeds(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('RETRY-AFTER-ROLLBACK-PDF');
        $fileHash = hash('sha256', $pdfBytes);
        $fileName = 'retry_after_fail.pdf';

        $payload = [
            'device_id' => $this->device1->id,
            'device_code' => $this->device1->device_code,
            'file_name' => $fileName,
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => 'Emp One',
                'patient_id' => 'P-RETRY-001',
                'donor_id' => 'D-RETRY-001',
                'collection_site' => 'Central Lab',
                'cup_lot_number' => 'LOT-R1',
                'date_time' => '2026-11-27 11:00:00',
            ],
            'tests' => [
                ['substance' => 'MET', 'software_result' => '(-)Negative', 'visual_result' => null],
            ],
        ];

        // Force failure during file DB insert on first attempt
        File::creating(function () {
            throw new \RuntimeException('Simulated transient DB error');
        });

        try {
            $this->withHeaders(['Accept' => 'application/json'])
                ->post('/api/device/imports', [
                    'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                    'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
                ])
                ->assertStatus(500);
        } finally {
            File::flushEventListeners();
        }

        // Zero inconsistent rows or orphan disk files
        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('PatientTests', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));

        // Subsequent retry succeeds cleanly as a fresh 201 PDF-ingested test
        $retry = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $retry->assertStatus(201)
            ->assertJson([
                'success' => true,
                'duplicate' => false,
                'ingestion_source' => 'pdf',
            ]);

        $headerId = (int) $retry->json('patient_header_id');
        $this->assertDatabaseHas('PatientHeader', [
            'Id' => $headerId,
            'IngestionSource' => 'pdf',
        ]);
        $this->assertDatabaseCount('files', 1);
    }
}
