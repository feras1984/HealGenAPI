<?php

namespace App\Livewire;

use Livewire\Component;

class Logs extends Component
{
    public string $content = '';
    public function mount() {
        $this->loadLogs();
    }
    public function loadLogs()
    {
        $path = storage_path('logs/his.log');

        if (file_exists($path)) {
            $this->content = file_get_contents($path);
        } else {
            $this->content = "Log file not found.";
        }
    }

    public function render()
    {
        return view('livewire.logs')
            ->layout('livewire.layout.app-layout');
    }
}
