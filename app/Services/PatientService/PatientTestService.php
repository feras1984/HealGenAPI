<?php

namespace App\Services\PatientService;

use App\Models\PatientHeader;
use App\Models\PatientTest;
use Carbon\Carbon;

class PatientTestService
{
    public function mapTestModel(PatientTest $test): array
    {
//        $tests = $patientHeader->tests();
        return [
            'id' => $test->Id,
            'patientHeaderId' => $test->PatientHeaderId,
            'substance' => $test->Substance,
            'softwareResult' => $test->SoftwareResult,
            'visualResult' => $test->VisualResult,
            'createdAt' => Carbon::make($test->CreatedAt)->format('M d, Y'),
        ];
    }
}
