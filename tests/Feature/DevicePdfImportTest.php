<?php

namespace Tests\Feature;

use App\Facades\PatientService\PatientHeaderService as PatientHeaderServiceFacade;
use App\Models\Admin;
use App\Models\Device;
use App\Models\DeviceType;
use App\Models\DeviceUser;
use App\Models\File;
use App\Models\Location;
use App\Models\PatientHeader;
use App\Models\User;
use App\Services\PatientService\TestAttachmentStorageService;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use RuntimeException;
use Tests\TestCase;

class DevicePdfImportTest extends TestCase
{
    private Location $location;
    private Device $device;
    private User $adminUser;
    private User $employeeUser;
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

        Storage::fake(TestAttachmentStorageService::DISK);

        $this->createSchema();
        $this->seedBaseData();
    }

    protected function tearDown(): void
    {
        File::flushEventListeners();
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
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('device_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_type_id')->nullable();
            $table->foreignId('location_id')->nullable();
            $table->string('name', 150);
            $table->string('device_code', 100)->unique();
            $table->string('serial_number', 100)->nullable();
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
            $table->dateTime('ProcessedAt')->nullable();
            $table->string('Status')->default('Imported');
            $table->string('FileHash')->nullable()->unique();
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
            $table->integer('order');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_image')->default(true);
            $table->boolean('is_cover')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['reference_id', 'reference_type'], 'files_reference_index');
        });
    }

    private function seedBaseData(): void
    {
        $this->location = Location::create([
            'name' => 'Dubai Central Lab',
            'code' => 'DXB-01',
        ]);

        $deviceType = DeviceType::create([
            'name' => 'HealGen D600',
            'manufacturer' => 'HealGen',
            'model' => 'D600',
        ]);

        $this->device = Device::create([
            'location_id' => $this->location->id,
            'device_type_id' => $deviceType->id,
            'name' => 'HealGen D600 #4',
            'device_code' => 'D600-DXB-004',
            'is_active' => true,
        ]);

        $adminRef = Admin::create(['first_name' => 'Super', 'last_name' => 'Admin', 'role' => 'Administrator']);
        $this->adminUser = User::create([
            'email' => 'admin@healgen.test',
            'reference_id' => $adminRef->id,
            'reference_type' => Admin::class,
        ]);

        $empRef = Admin::create(['first_name' => 'Lab', 'last_name' => 'Operator', 'role' => 'Employee']);
        $this->employeeUser = User::create([
            'email' => 'employee@healgen.test',
            'reference_id' => $empRef->id,
            'reference_type' => Admin::class,
        ]);

        DeviceUser::create([
            'device_id' => $this->device->id,
            'user_id' => $this->employeeUser->id,
            'assigned_at' => Carbon::now()->subDay(),
            'is_active' => true,
        ]);
    }

    /**
     * Build a minimal syntactically valid PDF binary payload whose bytes stay unmodified.
     */
    private function makeValidPdfBytes(string $marker = 'HEALGEN-D600-REPORT'): string
    {
        return "%PDF-1.4\n"
            . "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            . "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            . "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n"
            . "4 0 obj\n<< /Length " . strlen($marker) . " >>\nstream\n{$marker}\nendstream\nendobj\n"
            . "%%EOF\n";
    }

    private function makeUploadedFile(string $fileName, string $bytes, ?string $mimeType = null): UploadedFile
    {
        $file = UploadedFile::fake()->createWithContent($fileName, $bytes);
        if ($mimeType !== null) {
            $file->mimeType($mimeType);
        }
        if (isset($file->tempFile) && is_resource($file->tempFile)) {
            fflush($file->tempFile);
        }

        // Keep reference alive until tearDown so PHP doesn't close/unlink the tmpfile mid-request
        $this->uploadedFiles[] = $file;

        return $file;
    }

    private function makeUploadedPdf(string $fileName, string $pdfBytes): UploadedFile
    {
        return $this->makeUploadedFile($fileName, $pdfBytes, 'application/pdf');
    }

    private function build13SubstanceTests(): array
    {
        $substances = ['MET', 'COC', 'MDMA', 'MOP', 'MTD', 'BZO', 'BAR', 'KET', 'BUP', 'THC', 'TRA', 'K3', 'PGB'];

        return array_map(static function (string $substance, int $index): array {
            $softwareResult = match ($index) {
                0 => '(+)Positive',
                12 => 'Invalid',
                default => '(-)Negative',
            };

            return [
                'substance' => $substance,
                'software_result' => $softwareResult,
                'visual_result' => null,
            ];
        }, $substances, array_keys($substances));
    }

    private function build16SubstanceTests(): array
    {
        $substances = ['MET', 'COC', 'MDMA', 'MOP', 'MTD', 'BZO', 'BAR', 'KET', 'BUP', 'THC', 'TRA', 'K3', 'PGB', 'PCP', 'OPI', 'AMP'];

        return array_map(static fn (string $substance): array => [
            'substance' => $substance,
            'software_result' => '(-)Negative',
            'visual_result' => '(-)Negative',
        ], $substances);
    }

    private function attachDeviceLogSpy(): TestHandler
    {
        $handler = new TestHandler();
        $logger = new Logger('device', [$handler]);
        Log::shouldReceive('channel')
            ->with('device')
            ->andReturn($logger);

        return $handler;
    }

    public function test_excel_json_import_remains_backward_compatible(): void
    {
        $hash = str_repeat('a', 64);

        $payload = [
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => 'report.xlsx',
            'file_hash' => $hash,
            'patient' => [
                'test_operator' => 'Operator A',
                'patient_id' => 'P-EXCEL-001',
                'donor_id' => 'D-EXCEL-001',
                'collection_site' => 'Site DXB',
                'cup_lot_number' => 'LOT-2026-01',
                'date_time' => '2026-11-26 08:30:00',
            ],
            'tests' => [
                [
                    'substance' => 'MET',
                    'software_result' => '(-)Negative',
                    'visual_result' => '(-)Negative',
                ],
                [
                    'substance' => 'THC',
                    'software_result' => '(+)Positive',
                    'visual_result' => null,
                ],
            ],
        ];

        $response = $this->postJson('/api/device/imports', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'duplicate' => false,
                'tests_inserted' => 2,
                'status' => 'Imported',
            ]);

        $headerId = $response->json('patient_header_id');
        $this->assertNotNull($headerId);
        $this->assertDatabaseHas('PatientHeader', [
            'Id' => $headerId,
            'PatientId' => 'P-EXCEL-001',
            'SourceFile' => 'report.xlsx',
            'FileHash' => $hash,
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'Status' => 'Imported',
        ]);
        $this->assertDatabaseCount('PatientTests', 2);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));

        // Duplicate Excel retry returns 200 OK
        $dupResponse = $this->postJson('/api/device/imports', $payload);
        $dupResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'duplicate' => true,
                'patient_header_id' => $headerId,
            ]);
        $this->assertDatabaseCount('PatientHeader', 1);
    }

    public function test_valid_multipart_pdf_import_13_tests_with_null_optionals_stores_identical_pdf_and_serves_via_existing_endpoints(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('D600-13-PANEL-TEST-CONTENT-001');
        $fileHash = hash('sha256', $pdfBytes);
        $fileName = 'D600_20261126_001.pdf';

        $payload = [
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => $fileName,
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-PDF-13-001',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => 'CUP-13-LOT',
                'date_time' => '2026-11-26 09:15:00',
            ],
            'tests' => $this->build13SubstanceTests(),
        ];

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'duplicate' => false,
                'tests_inserted' => 13,
                'status' => 'Imported',
            ]);

        $headerId = $response->json('patient_header_id');
        $this->assertNotNull($headerId);

        // Verify PatientHeader & PatientTests persisted
        $this->assertDatabaseHas('PatientHeader', [
            'Id' => $headerId,
            'PatientId' => 'P-PDF-13-001',
            'TestOperator' => null,
            'DonorId' => null,
            'CollectionSite' => null,
            'CupLotNumber' => 'CUP-13-LOT',
            'DateTime' => '2026-11-26 09:15:00',
            'SourceFile' => $fileName,
            'FileHash' => $fileHash,
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'Status' => 'Imported',
        ]);
        $this->assertDatabaseCount('PatientTests', 13);
        $this->assertDatabaseHas('PatientTests', [
            'PatientHeaderId' => $headerId,
            'Substance' => 'MET',
            'SoftwareResult' => '(+)Positive',
            'VisualResult' => null,
        ]);
        $this->assertDatabaseHas('PatientTests', [
            'PatientHeaderId' => $headerId,
            'Substance' => 'PGB',
            'SoftwareResult' => 'Invalid',
            'VisualResult' => null,
        ]);

        // Verify exact same `files` schema and disk path convention as manual PDF upload
        $fileRecord = File::query()
            ->where('reference_id', $headerId)
            ->where('reference_type', PatientHeader::class)
            ->first();

        $this->assertNotNull($fileRecord);
        $this->assertSame($fileName, $fileRecord->name);
        $this->assertMatchesRegularExpression(
            '/^test_attachments\/test_' . $headerId . '_[a-f0-9]+\.pdf$/',
            $fileRecord->url
        );
        $this->assertSame(1, (int) $fileRecord->order);
        $this->assertTrue((bool) $fileRecord->is_active);
        $this->assertFalse((bool) $fileRecord->is_image);
        $this->assertSame('application/pdf', $fileRecord->description);

        // Verify raw PDF bytes stored unmodified on the `public` disk
        $disk = Storage::disk(TestAttachmentStorageService::DISK);
        $this->assertTrue($disk->exists($fileRecord->url));
        $storedBytes = $disk->get($fileRecord->url);
        $this->assertSame($pdfBytes, $storedBytes);
        $this->assertSame($fileHash, hash('sha256', $storedBytes));

        // Verify PatientHeader::file relation & PatientHeaderService mapping match manual upload
        $patientModel = PatientHeader::with('file')->findOrFail($headerId);
        $mapped = PatientHeaderServiceFacade::mapPatientModel($patientModel);
        $this->assertNotNull($mapped['attachment']);
        $this->assertSame($fileName, $mapped['attachment']['name']);
        $this->assertFalse($mapped['attachment']['isImage']);
        $this->assertSame(route('admin.tests.file.view', $headerId), $mapped['attachment']['url']);
        $this->assertSame(route('admin.tests.file.download', $headerId), $mapped['attachment']['downloadUrl']);

        // Verify existing inline PDF view endpoint serves the imported PDF identically
        $viewResponse = $this->actingAs($this->adminUser)
            ->get(route('admin.tests.file.view', $headerId));
        $viewResponse->assertStatus(200);
        $this->assertStringContainsString('application/pdf', (string) $viewResponse->headers->get('Content-Type'));
        $this->assertStringContainsString('inline', (string) $viewResponse->headers->get('Content-Disposition'));
        $this->assertSame($pdfBytes, $viewResponse->streamedContent());

        // Verify existing download endpoint serves identical unmodified PDF bytes
        $downloadResponse = $this->actingAs($this->employeeUser)
            ->get(route('admin.tests.file.download', $headerId));
        $downloadResponse->assertStatus(200);
        $this->assertStringContainsString('attachment', (string) $downloadResponse->headers->get('Content-Disposition'));
        $this->assertSame($pdfBytes, $downloadResponse->streamedContent());
    }

    public function test_valid_multipart_pdf_import_16_tests_and_file_part_payload_succeeds(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('D600-16-PANEL-TEST-CONTENT-002');
        $fileHash = hash('sha256', $pdfBytes);
        $fileName = 'D600_16panel_002.pdf';

        $payload = [
            'device_id' => null,
            'device_code' => $this->device->device_code,
            'file_name' => $fileName,
            'file_hash' => strtoupper($fileHash),
            'patient' => [
                'test_operator' => 'Tech Sarah',
                'patient_id' => 'P-PDF-16-002',
                'donor_id' => 'D-PDF-16-002',
                'collection_site' => 'Clinic B',
                'cup_lot_number' => 'CUP-16-LOT',
                'date_time' => '2026-11-26 10:00:00',
            ],
            'tests' => $this->build16SubstanceTests(),
        ];

        // Also exercises `payload` arriving as an UploadedFile part (e.g. multipart part with filename)
        $payloadFile = $this->makeUploadedFile(
            'payload.json',
            json_encode($payload, JSON_THROW_ON_ERROR),
            'application/json'
        );

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadFile,
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'duplicate' => false,
                'tests_inserted' => 16,
                'status' => 'Imported',
            ]);

        $headerId = $response->json('patient_header_id');
        $this->assertDatabaseHas('PatientHeader', [
            'Id' => $headerId,
            'DeviceId' => $this->device->id,
            'DeviceCode' => $this->device->device_code,
            'FileHash' => $fileHash,
        ]);
        $this->assertDatabaseCount('PatientTests', 16);
        $this->assertDatabaseCount('files', 1);
    }

    public function test_duplicate_pdf_retry_with_identical_file_hash_returns_200_without_duplicate_rows_or_files(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('D600-DUPLICATE-RETRY-TEST');
        $fileHash = hash('sha256', $pdfBytes);
        $fileName = 'retry_report.pdf';

        $payloadJson = json_encode([
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => $fileName,
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-DUP-001',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => 'LOT-DUP',
                'date_time' => '2026-11-26 11:00:00',
            ],
            'tests' => $this->build13SubstanceTests(),
        ], JSON_THROW_ON_ERROR);

        $first = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $first->assertStatus(201);
        $originalHeaderId = $first->json('patient_header_id');

        $storedFilesBeforeRetry = Storage::disk(TestAttachmentStorageService::DISK)
            ->allFiles(TestAttachmentStorageService::DIRECTORY);
        $this->assertCount(1, $storedFilesBeforeRetry);

        // Retry submission with exact same file_hash and PDF
        $retry = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $retry->assertStatus(200)
            ->assertJson([
                'success' => true,
                'duplicate' => true,
                'patient_header_id' => $originalHeaderId,
            ]);

        $this->assertDatabaseCount('PatientHeader', 1);
        $this->assertDatabaseCount('PatientTests', 13);
        $this->assertDatabaseCount('files', 1);

        $storedFilesAfterRetry = Storage::disk(TestAttachmentStorageService::DISK)
            ->allFiles(TestAttachmentStorageService::DIRECTORY);
        $this->assertSame($storedFilesBeforeRetry, $storedFilesAfterRetry);
    }

    public function test_validation_rejects_missing_payload(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('NO-PAYLOAD');

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'report_pdf' => $this->makeUploadedPdf('orphan.pdf', $pdfBytes),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payload']);

        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));
    }

    public function test_validation_rejects_malformed_json_payload(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('MALFORMED-JSON');

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => '{"device_id": 4, "broken": ',
                'report_pdf' => $this->makeUploadedPdf('broken.pdf', $pdfBytes),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payload']);

        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));
    }

    public function test_validation_rejects_missing_report_pdf(): void
    {
        $payloadJson = json_encode([
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => 'missing.pdf',
            'file_hash' => str_repeat('b', 64),
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-NO-PDF',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => null,
                'date_time' => '2026-11-26 12:00:00',
            ],
            'tests' => [
                ['substance' => 'MET', 'software_result' => '(-)Negative', 'visual_result' => null],
            ],
        ], JSON_THROW_ON_ERROR);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['report_pdf']);

        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('files', 0);
    }

    public function test_validation_rejects_non_pdf_file_even_with_pdf_extension(): void
    {
        $fakeBytes = 'This is plain text pretending to be a PDF document.';
        $hash = hash('sha256', $fakeBytes);

        $payloadJson = json_encode([
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => 'spoofed.pdf',
            'file_hash' => $hash,
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-NON-PDF',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => null,
                'date_time' => '2026-11-26 12:05:00',
            ],
            'tests' => [
                ['substance' => 'MET', 'software_result' => '(-)Negative', 'visual_result' => null],
            ],
        ], JSON_THROW_ON_ERROR);

        // 1. Plain text file with .txt extension (rejected by mimetypes:application/pdf)
        $txtFile = $this->makeUploadedFile('notes.txt', $fakeBytes, 'text/plain');
        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $txtFile,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['report_pdf']);

        // 2. Spoofed .pdf file without %PDF- magic header (rejected by header check)
        $spoofedFile = $this->makeUploadedFile('spoofed.pdf', $fakeBytes, 'application/pdf');

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $spoofedFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['report_pdf']);

        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));
    }

    public function test_validation_rejects_sha256_mismatch(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('ACTUAL-PDF-BYTES');
        $wrongHash = str_repeat('f', 64);

        $payloadJson = json_encode([
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => 'mismatch.pdf',
            'file_hash' => $wrongHash,
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-HASH-MISMATCH',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => null,
                'date_time' => '2026-11-26 12:10:00',
            ],
            'tests' => [
                ['substance' => 'MET', 'software_result' => '(-)Negative', 'visual_result' => null],
            ],
        ], JSON_THROW_ON_ERROR);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $this->makeUploadedPdf('mismatch.pdf', $pdfBytes),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['report_pdf']);

        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));
    }

    public function test_validation_rejects_missing_required_test_and_patient_fields(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('MISSING-REQUIRED-FIELDS');
        $fileHash = hash('sha256', $pdfBytes);

        $payloadJson = json_encode([
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => 'invalid_fields.pdf',
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => null,
                'patient_id' => '',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => null,
                'date_time' => '2026-11-26 12:15:00',
            ],
            'tests' => [
                [
                    'substance' => '',
                    'software_result' => '(-)Negative',
                    'visual_result' => null,
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $this->makeUploadedPdf('invalid_fields.pdf', $pdfBytes),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['patient.patient_id', 'tests.0.substance']);

        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('PatientTests', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame([], Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY));
    }

    public function test_transaction_rollback_on_db_failure_cleans_up_stored_pdf_without_orphans(): void
    {
        $pdfBytes = $this->makeValidPdfBytes('ROLLBACK-TEST-PDF');
        $fileHash = hash('sha256', $pdfBytes);
        $fileName = 'rollback_case.pdf';

        // Simulate a DB failure right AFTER the PDF bytes have been written to disk
        File::creating(function () {
            throw new RuntimeException('Simulated DB error while creating files record.');
        });

        $payloadJson = json_encode([
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => $fileName,
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => null,
                'patient_id' => 'P-ROLLBACK-001',
                'donor_id' => null,
                'collection_site' => null,
                'cup_lot_number' => 'LOT-RB',
                'date_time' => '2026-11-26 13:00:00',
            ],
            'tests' => $this->build13SubstanceTests(),
        ], JSON_THROW_ON_ERROR);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => $payloadJson,
                'report_pdf' => $this->makeUploadedPdf($fileName, $pdfBytes),
            ]);

        $response->assertStatus(500);

        // Full rollback: zero DB rows AND zero orphaned PDF files on disk
        $this->assertDatabaseCount('PatientHeader', 0);
        $this->assertDatabaseCount('PatientTests', 0);
        $this->assertDatabaseCount('files', 0);
        $this->assertSame(
            [],
            Storage::disk(TestAttachmentStorageService::DISK)->allFiles(TestAttachmentStorageService::DIRECTORY)
        );
    }

    public function test_device_logs_never_contain_sensitive_patient_data(): void
    {
        $handler = $this->attachDeviceLogSpy();

        $sensitivePatientId = 'P-CONFIDENTIAL-987654';
        $sensitiveDonorId = 'D-PRIVATE-123456';
        $sensitiveOperator = 'Dr. Sensitive Operator';
        $sensitiveSite = 'Secret Collection Clinic';

        $pdfBytes = $this->makeValidPdfBytes('PRIVACY-CHECK-PDF');
        $fileHash = hash('sha256', $pdfBytes);

        $validPayload = [
            'device_id' => $this->device->id,
            'device_code' => $this->device->device_code,
            'file_name' => 'privacy_report.pdf',
            'file_hash' => $fileHash,
            'patient' => [
                'test_operator' => $sensitiveOperator,
                'patient_id' => $sensitivePatientId,
                'donor_id' => $sensitiveDonorId,
                'collection_site' => $sensitiveSite,
                'cup_lot_number' => 'LOT-PRIV',
                'date_time' => '2026-11-26 14:00:00',
            ],
            'tests' => [
                [
                    'substance' => 'MET',
                    'software_result' => '(+)Positive',
                    'visual_result' => '(+)Positive',
                ],
            ],
        ];

        // 1. Success log
        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($validPayload, JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf('privacy_report.pdf', $pdfBytes),
            ])
            ->assertStatus(201);

        // 2. Duplicate log
        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($validPayload, JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf('privacy_report.pdf', $pdfBytes),
            ])
            ->assertStatus(200);

        // 3. Validation failure log (SHA-256 mismatch)
        $badPayload = $validPayload;
        $badPayload['file_hash'] = str_repeat('0', 64);
        $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/device/imports', [
                'payload' => json_encode($badPayload, JSON_THROW_ON_ERROR),
                'report_pdf' => $this->makeUploadedPdf('privacy_report.pdf', $pdfBytes),
            ])
            ->assertStatus(422);

        $records = $handler->getRecords();
        $this->assertNotEmpty($records);

        $serializedLogs = json_encode(
            array_map(static fn ($record) => [
                'message' => $record->message,
                'context' => $record->context,
            ], $records),
            JSON_THROW_ON_ERROR
        );

        foreach ([
            $sensitivePatientId,
            $sensitiveDonorId,
            $sensitiveOperator,
            $sensitiveSite,
            '(+)Positive',
            'MET',
        ] as $forbidden) {
            $this->assertStringNotContainsString(
                $forbidden,
                $serializedLogs,
                "Sensitive token [{$forbidden}] leaked into device log."
            );
        }
    }
}
