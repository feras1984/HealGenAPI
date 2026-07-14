<?php

namespace App\Livewire;

use Illuminate\Support\Facades\DB;
use Livewire\Component;

class Dashboard extends Component
{
    public function render()
    {
        $totalPatients = DB::table("PatientHeader")->count();
        $pendingMessages = DB::table("PatientHeader")->where("Status", 'Imported')->count();
        $failedMessages = DB::table("PatientHeader")->where("Status", 'FailedToSend')->count();
        return view('livewire.dashboard', [
            'totalPatients' => $totalPatients,
            'pendingMessages' => $pendingMessages,
            'failedMessages' => $failedMessages,
        ])
            ->layout('livewire.layout.app-layout');
    }
}
