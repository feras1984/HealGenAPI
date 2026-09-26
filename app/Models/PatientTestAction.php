<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientTestAction extends Model
{
    use HasFactory;

    protected $table = 'patient_test_actions';

    protected $fillable = [
        'patient_header_id',
        'user_id',
        'role',
        'action',
        'previous_status',
        'new_status',
        'reason',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function patientHeader(): BelongsTo
    {
        return $this->belongsTo(PatientHeader::class, 'patient_header_id', 'Id');
    }
}
