<?php

namespace App\Services\PatientService;

use App\Models\File;
use App\Models\PatientHeader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class TestAttachmentStorageService
{
    public const DISK = 'public';
    public const DIRECTORY = 'test_attachments';

    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];

    /**
     * Store a manually uploaded test attachment (PDF or Image) for a PatientHeader,
     * optionally replacing any existing attachment.
     */
    public function storeForPatientHeader(
        PatientHeader $patient,
        UploadedFile $uploadedFile,
        bool $replaceExisting = true
    ): File {
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        $isImage = in_array($extension, self::IMAGE_EXTENSIONS, true);
        $storedPath = $this->storeUploadedFileOnDisk((int) $patient->Id, $uploadedFile, $extension);

        try {
            if ($replaceExisting) {
                $existing = $patient->file;
                if ($existing) {
                    Storage::disk(self::DISK)->delete($existing->url);
                    $existing->delete();
                }
            }

            return $this->createFileRecord(
                (int) $patient->Id,
                $storedPath,
                $uploadedFile->getClientOriginalName(),
                $isImage,
                $uploadedFile->getClientMimeType()
            );
        } catch (Throwable $exception) {
            $this->deleteStoredPath($storedPath);

            throw $exception;
        }
    }

    /**
     * Store an automated device-imported PDF attachment using the exact same disk,
     * directory, filename convention, and `files` schema as manual PDF uploads.
     *
     * Populates `$storedPath` immediately after writing to disk so callers can
     * reliably delete the file if the surrounding DB transaction rolls back.
     */
    public function storePdfForImportedPatient(
        int $patientHeaderId,
        UploadedFile $pdfFile,
        ?string $displayName = null,
        ?string &$storedPath = null
    ): File {
        $safeName = $this->sanitizeDisplayName($displayName ?: $pdfFile->getClientOriginalName());
        $storedPath = $this->storeUploadedFileOnDisk($patientHeaderId, $pdfFile, 'pdf');

        return $this->createFileRecord(
            $patientHeaderId,
            $storedPath,
            $safeName,
            false,
            'application/pdf'
        );
    }

    /**
     * Write the uploaded file's raw bytes unmodified to the shared disk and directory.
     */
    public function storeUploadedFileOnDisk(
        int $patientHeaderId,
        UploadedFile $uploadedFile,
        ?string $extension = null
    ): string {
        $ext = strtolower($extension ?? $uploadedFile->getClientOriginalExtension());
        $filename = 'test_' . $patientHeaderId . '_' . uniqid() . ($ext !== '' ? '.' . $ext : '');
        $path = $uploadedFile->storeAs(self::DIRECTORY, $filename, self::DISK);

        if ($path === false || $path === '') {
            throw new RuntimeException('Failed to store test attachment file on disk.');
        }

        return $path;
    }

    /**
     * Persist the polymorphic `files` record linking the stored attachment to `PatientHeader`.
     */
    public function createFileRecord(
        int $patientHeaderId,
        string $storedPath,
        string $displayName,
        bool $isImage,
        ?string $mimeType
    ): File {
        return File::create([
            'name' => $displayName,
            'url' => $storedPath,
            'reference_id' => $patientHeaderId,
            'reference_type' => PatientHeader::class,
            'order' => 1,
            'is_active' => true,
            'is_image' => $isImage,
            'description' => $mimeType,
        ]);
    }

    /**
     * Verify that the raw bytes of an uploaded file start with the `%PDF-` signature.
     */
    public function hasValidPdfHeader(UploadedFile $file): bool
    {
        $realPath = $file->getRealPath();
        if ($realPath === false || !is_file($realPath)) {
            return false;
        }

        $handle = @fopen($realPath, 'rb');
        if ($handle === false) {
            return false;
        }

        try {
            $header = fread($handle, 5);
        } finally {
            fclose($handle);
        }

        return $header === '%PDF-';
    }

    /**
     * Verify that the SHA-256 hex digest of an uploaded file's raw bytes matches `$expectedHash`.
     */
    public function verifySha256(UploadedFile $file, string $expectedHash): bool
    {
        $realPath = $file->getRealPath();
        if ($realPath === false || !is_file($realPath)) {
            return false;
        }

        $actualHash = @hash_file('sha256', $realPath);
        if ($actualHash === false) {
            return false;
        }

        return hash_equals(strtolower($expectedHash), strtolower($actualHash));
    }

    /**
     * Safely delete a previously stored file path (used during transaction rollback cleanup).
     */
    public function deleteStoredPath(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        try {
            if (Storage::disk(self::DISK)->exists($path)) {
                Storage::disk(self::DISK)->delete($path);
            }
        } catch (Throwable $exception) {
            Log::channel('device')->warning(
                'Failed to clean up stored test attachment after rollback.',
                [
                    'event' => 'attachment_cleanup_failed',
                    'exception_class' => get_class($exception),
                ]
            );
        }
    }

    private function sanitizeDisplayName(?string $name): string
    {
        if ($name === null) {
            return 'report.pdf';
        }

        $normalized = str_replace('\\', '/', trim($name));
        $base = basename($normalized);

        return $base !== '' && $base !== '.' && $base !== '..'
            ? $base
            : 'report.pdf';
    }
}
