<?php

namespace App\Services;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PatientService
{
    public function getPendingPatients(array $filters, int $perPage = 50): LengthAwarePaginator
    {
//        $query = DB::table('PatientHeader')
//            ->where('Status', 'Imported')
////            ->OrWhere('Status', 'FailedToSend')
//        ;

        $query = DB::table('PatientHeader')
            ->where(function ($query) use ($filters) {
                $query->where('Status', 'Imported')
                    ->orWhere('Status', 'FailedToSend');
            });

//        dd(!empty($filters['patient_id']));

        if (!empty($filters['patient_id'])) {
            $query->where('PatientId', $filters['patient_id']);
        }

        if (!empty($filters['donor_id'])) {
            $query->where('DonorId', $filters['donor_id']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('CreatedAt', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('CreatedAt', '<=', $filters['to_date']);
        }

        return $query
            ->orderBy('Id')
            ->paginate($perPage);
    }

    public function getPatientById(int $id): ?object
    {
        return DB::table('PatientHeader')
            ->where('Id', $id)
            ->first();
    }

    public function getPatientTests(int $patientHeaderId): Collection
    {
        return DB::table('PatientTests')
            ->where('PatientHeaderId', $patientHeaderId)
            ->get();
    }

    public function markAsSentToHIS(int $id, ?string $reference = null): bool
    {
        return DB::table('PatientHeader')
                ->where('Id', $id)
                ->update([
                    'Status' => 'SentToHIS',
//                    'HISReference' => $reference,
                    'UpdatedAt' => now(),
                ]) > 0;
    }

    public function markAsFailedToSend(int $id): bool
    {
        return DB::table('PatientHeader')
                ->where('Id', $id)
                ->update([
                    'Status' => 'FailedToSend',
                    'UpdatedAt' => now(),
                ]) > 0;
    }

    public function getPatientForHIS(int $id): ?array
    {
        $patient = DB::table('PatientHeader')
            ->where('Id', $id)
            ->first();

        if (!$patient) {
            return null;
        }

        $tests = DB::table('PatientTests')
            ->where('PatientHeaderId', $id)
            ->get();

        return [
            'patient' => (array) $patient,
            'tests' => $tests
        ];
    }

    public function exists(int $id): bool
    {
        return DB::table('PatientHeader')
            ->where('Id', $id)
            ->exists();
    }
}
