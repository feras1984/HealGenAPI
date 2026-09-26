<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceType extends Model
{
    use HasFactory;

    protected $table = 'device_types';

    protected $fillable = [
        'name',
        'manufacturer',
        'model',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function devices()
    {
        return $this->hasMany(Device::class, 'device_type_id');
    }
}
