<?php

namespace App\Http\Controllers;

use App\Facades\PatientService\PatientHeaderService;
use App\Facades\PatientService\PatientTestService;
use App\Models\Device;
use App\Models\DeviceUser;
use App\Models\File;
use App\Models\PatientHeader;
use App\Services\PatientService\TestAttachmentStorageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HTTPResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientController extends Controller
{
    public function __construct(
        private TestAttachmentStorageService $attachmentStorageService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $patients = PatientHeaderService::getPatients($user);
        return Inertia::render('Admin/Patient/PatientList', [
            'patients' => $patients,
        ]);
    }

    /**
     * Check if a user has access to a patient test record.
     * Rules:
     * - Test Details can only be opened by authorized roles ('administrator', 'expert', 'inspector', 'employee').
     * - Admin and Expert can open any test.
     * - Inspector can open test details related to their current assigned location.
     * - Employee can open only tests related to their assigned devices.
     * - Otherwise, 403 is returned.
     * - Write access (upload/delete file) is strictly restricted to employees for their assigned devices.
     */
    private function authorizePatientAccess(Request $request, PatientHeader $patient, bool $writeAccess = false): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $adminRef = $user->reference()->first();
        $role = strtolower($adminRef && isset($adminRef->role) ? trim($adminRef->role) : '');

        // Only authorized roles are allowed
        $authorizedRoles = ['administrator', 'expert', 'inspector', 'employee'];
        if (!in_array($role, $authorizedRoles, true)) {
            abort(403, 'Unauthorized role. You do not have permission to access test records.');
        }

        // File upload/delete is strictly for employee role
        if ($writeAccess && $role !== 'employee') {
            abort(403, 'Unauthorized. Only users with the Employee role can upload or delete test attachments.');
        }

        // Admin and Expert can open any test
        if ($role === 'administrator' || $role === 'expert') {
            return;
        }

        if ($role === 'inspector') {
            $assignedLocationId = $user->getAssignedLocationId();
            if (!$assignedLocationId) {
                abort(403, 'You are not currently assigned to an active location.');
            }

            $patientDeviceId = $patient->DeviceId ?? $patient->device_id;
            $patientLocationId = $patient->device?->location_id
                ?? ($patientDeviceId ? Device::where('id', $patientDeviceId)->value('location_id') : null)
                ?? ($patient->DeviceCode ? Device::where('device_code', $patient->DeviceCode)->value('location_id') : null);

            if (!$patientLocationId || (int)$patientLocationId !== (int)$assignedLocationId) {
                abort(403, 'Unauthorized access to test record outside your assigned location.');
            }

            return;
        }

        if ($role === 'employee') {
            $assignedDeviceUsers = DeviceUser::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->with('device')
                ->get();

            if ($assignedDeviceUsers->isEmpty()) {
                abort(403, 'You are not currently assigned to any active device.');
            }

            $assignedDeviceIds = $assignedDeviceUsers->pluck('device_id')->map(fn($id) => (int)$id)->all();
            $assignedDeviceCodes = $assignedDeviceUsers->pluck('device.device_code')->filter()->all();

            $patientDeviceId = $patient->DeviceId ?? $patient->device_id;
            if (!$patientDeviceId && ($patient->DeviceCode ?? $patient->device_code)) {
                $patientDeviceId = Device::where('device_code', $patient->DeviceCode ?? $patient->device_code)->value('id');
            }

            $patientDeviceCode = $patient->DeviceCode ?? $patient->device_code;
            if (!$patientDeviceCode && $patientDeviceId) {
                $patientDeviceCode = Device::where('id', $patientDeviceId)->value('device_code');
            }

            $hasAccess = false;
            if ($patientDeviceId && in_array((int)$patientDeviceId, $assignedDeviceIds, true)) {
                $hasAccess = true;
            } elseif ($patientDeviceCode && in_array($patientDeviceCode, $assignedDeviceCodes, true)) {
                $hasAccess = true;
            }

            if (!$hasAccess) {
                abort(403, 'Unauthorized access to test record. This test did not originate from your assigned devices.');
            }

            return;
        }

        abort(403, 'Unauthorized access to test record.');
    }

    public function show(Request $request, PatientHeader $patient): Response
    {
        $this->authorizePatientAccess($request, $patient, false);

        $patient->load([
            'device.location',
            'device.deviceType',
            'tests',
            'file',
            'latestInspectorAction.user.reference',
            'latestSupervisorAction.user.reference',
            'actions.user.reference',
        ]);

        return Inertia::render('Admin/Patient/PatientDetails', [
            'patient' => PatientHeaderService::mapPatientModel($patient),
        ]);
    }

    /**
     * Upload an attachment (PDF / Image) for a test record.
     * Strictly restricted to users with the Employee role assigned to the test's device.
     */
    public function uploadFile(Request $request, PatientHeader $patient): JsonResponse
    {
        $this->authorizePatientAccess($request, $patient, true);
        $user = $request->user();

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,webp,bmp|max:20480',
        ]);

        try {
            $uploadedFile = $request->file('file');
            $file = $this->attachmentStorageService->storeForPatientHeader($patient, $uploadedFile, true);

            \App\Facades\SystemAuditLogService\SystemAuditLogService::logAction(
                $user,
                'TEST_FILE_UPLOADED',
                'PatientHeader',
                (string) $patient->Id,
                "Employee uploaded test attachment: {$file->name}."
            );

            return response()->json([
                'status' => true,
                'message' => 'Test file uploaded successfully!',
                'attachment' => [
                    'id' => $file->id,
                    'name' => $file->name,
                    'url' => route('admin.tests.file.view', $patient->Id),
                    'downloadUrl' => route('admin.tests.file.download', $patient->Id),
                    'isImage' => (bool) $file->is_image,
                    'description' => $file->description,
                    'createdAt' => Carbon::make($file->created_at)->format('M d, Y H:i:s'),
                ],
            ], HTTPResponse::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to upload test file.',
                'details' => $e->getMessage(),
            ], HTTPResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Preview / view the attachment inline for a test record.
     * Available to all authorized roles (Admin, Supervisor, Inspector for their location, Employee for their devices).
     */
    public function viewFile(Request $request, PatientHeader $patient): StreamedResponse|BinaryFileResponse
    {
        $this->authorizePatientAccess($request, $patient, false);

        $file = $patient->file;
        if (!$file) {
            abort(404, 'No file attached to this test.');
        }

        if (!Storage::disk('public')->exists($file->url)) {
            abort(404, 'The attached file does not exist on storage.');
        }

        $mime = $file->description ?: Storage::disk('public')->mimeType($file->url);

        return Storage::disk('public')->response(
            $file->url,
            $file->name,
            [
                'Content-Type' => $mime ?: 'application/octet-stream',
                'Content-Disposition' => 'inline; filename="' . addslashes($file->name) . '"',
            ]
        );
    }

    /**
     * Download the attachment for a test record.
     * Available to all authorized roles (Admin, Supervisor, Inspector for their location, Employee for their devices).
     */
    public function downloadFile(Request $request, PatientHeader $patient): StreamedResponse|BinaryFileResponse
    {
        $this->authorizePatientAccess($request, $patient, false);

        $file = $patient->file;
        if (!$file) {
            abort(404, 'No file attached to this test.');
        }

        if (!Storage::disk('public')->exists($file->url)) {
            abort(404, 'The attached file does not exist on storage.');
        }

        return Storage::disk('public')->download(
            $file->url,
            $file->name,
            [
                'Content-Type' => $file->description ?: 'application/octet-stream',
            ]
        );
    }

    /**
     * Delete an attachment for a test record.
     * Restricted to users with the Employee role assigned to the test's device.
     */
    public function deleteFile(Request $request, PatientHeader $patient): JsonResponse
    {
        $this->authorizePatientAccess($request, $patient, true);

        $file = $patient->file;
        if ($file) {
            Storage::disk('public')->delete($file->url);
            $file->delete();
        }

        return response()->json([
            'status' => true,
            'message' => 'Attachment removed successfully!',
        ], HTTPResponse::HTTP_OK);
    }
}

