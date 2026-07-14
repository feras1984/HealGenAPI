<?php

namespace App\Livewire\Tests;

use Illuminate\Support\Facades\DB;
use Livewire\Component;

class Tests extends Component
{
    public function render()
    {
        $patients = DB::table('patientHeader')
            ->latest('CreatedAt')
            ->paginate(20);

        return view('livewire.Tests.tests', [
            'patients' => $patients,
        ])
            ->layout('livewire.layout.app-layout');
    }

//    public function edit($patientID) {
//        dd('EDIT: ', $patientID);
//    }
}
