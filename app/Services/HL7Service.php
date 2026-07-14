<?php

namespace App\Services;

class HL7Service
{
    public function buildMessage(array $patient, $tests): string
    {
        $patientId = $patient['PatientId'];
        $patientName = $patient['PatientName'] ?? '';

        $timestamp = now()->format('YmdHis');

        $hl7 = [];

        $hl7[] = "MSH|^~\\&|HEALGEN|LAB|HIS|HOSPITAL|{$timestamp}||ORU^R01|1001|P|2.3";

//        $hl7[] = "PID|||{$patient['PatientId']}||{$patient['PatientName'] ?? ''}";
//        $hl7[] = "PID|||" . $patient['PatientId'] . "||" . ($patient['PatientName'] ?? '');
        $hl7[] = "PID|||{$patientId}||{$patientName}";

        $hl7[] = "OBR|1|||LAB_TESTS";

        $i = 1;
        foreach ($tests as $test) {

            $substance = $test->Substance ?? '';
            $result = $test->SoftwareResult ?? '';

            $hl7[] = "OBX|{$i}|ST|{$substance}||{$result}";
            $i++;
        }

        return implode("\r", $hl7);
    }
}
