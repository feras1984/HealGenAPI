<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function getDeviceIdAttribute()
    {
        return $this->attributes['DeviceId'] ?? $this->attributes['device_id'] ?? null;
    }

    public function getDeviceCodeAttribute()
    {
        return $this->attributes['DeviceCode'] ?? $this->attributes['device_code'] ?? null;
    }
}
