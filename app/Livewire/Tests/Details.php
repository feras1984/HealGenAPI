<?php

namespace App\Livewire\Tests;

use App\Services\HISService;
use Illuminate\Support\Facades\DB;
use Livewire\Component;

class Details extends Component
{
    public $patient;
    public $tests;
    private HISService $HISService;

    public function __construct()
    {
        $this->HISService = new HISService();
    }

    public function mount(int $patientId)
    {
        $this->patient = DB::table('PatientHeader')
            ->where('Id', $patientId)
            ->first();

        $this->tests = DB::table('PatientTests')
            ->where('PatientHeaderId', $patientId)
            ->get();
    }
    public function render()
    {
//        dd($patientId);
        return view('livewire.Tests.details',
        [
            'patient' => $this->patient,
            'tests' => $this->tests,
        ]
        )
            ->layout('livewire.layout.app-layout');
    }

    public function sendToHis() {
        try {
            $response = $this->HISService->sendPatient($this->patient->Id);
            $this->patient->refresh();

            // Success
            if ($response['success']) {
                $this->dispatch('notify', [
                    'type' => 'success',
                    'message' => 'Patient data has been sent to the HIS successfully.',
                ]);
            }


            // Error
            else {
                $this->dispatch('notify', [
                    'type' => 'error',
                    'message' => 'Failed to send patient data to the HIS. Please try again.',
                ]);
            }

        } catch (\Exception $exception) {
            $this->dispatch('notify', [
                'type' => 'error',
                'message' => 'Error while sending patient data to the HIS. Please try again.',
            ]);
        }


    }
}
