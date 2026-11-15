<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PatientHeader extends Model
{
    protected $table = 'PatientHeader';
    protected $primaryKey = 'Id';

    const CREATED_AT = 'CreatedAt';
    const UPDATED_AT = 'UpdatedAt';

    protected $fillable = [
        'DeviceId',
        'DeviceCode',
        'device_id',
        'device_code',
        'PatientId',
        'DonorId',
        'CollectionSite',
        'CupLotNumber',
        'Status',
        'CreatedAt',
        'UpdatedAt',
    ];

    public function tests(): HasMany
    {
        return $this->hasMany(PatientTest::class, 'PatientHeaderId', 'Id');
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'DeviceId', 'id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(PatientTestAction::class, 'patient_header_id', 'Id');
    }

    public function file(): \Illuminate\Database\Eloquent\Relations\MorphOne
    {
        return $this->morphOne(File::class, 'reference', 'reference_type', 'reference_id', 'Id')->latestOfMany('id');
    }

    public function files(): \Illuminate\Database\Eloquent\Relations\MorphMany
    {
        return $this->morphMany(File::class, 'reference', 'reference_type', 'reference_id', 'Id');
    }

    public function latestInspectorAction(): HasOne
    {
        return $this->hasOne(PatientTestAction::class, 'patient_header_id', 'Id')
            ->whereIn('action', ['INSPECTOR_ACCEPT', 'INSPECTOR_REJECT'])
            ->latestOfMany('id');
    }

    public function getDeviceIdAttribute()
    {
        return $this->attributes['DeviceId'] ?? $this->attributes['device_id'] ?? null;
    }

    public function getDeviceCodeAttribute()
    {
        return $this->attributes['DeviceCode'] ?? $this->attributes['device_code'] ?? null;
    }
}
