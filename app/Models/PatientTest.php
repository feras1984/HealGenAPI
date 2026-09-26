<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientTest extends Model
{
    protected $table = 'PatientTests';
    protected $primaryKey = 'Id';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'PatientHeaderId',
        'Substance',
        'SoftwareResult',
        'VisualResult',
    ];
    public function patientHeader(): BelongsTo
    {
        return $this->belongsTo(PatientHeader::class, 'PatientHeaderId', 'Id');
    }
}
