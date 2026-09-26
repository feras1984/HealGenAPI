<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $table = 'devices';

    protected $fillable = [
        'location_id',
        'device_type_id',
        'name',
        'device_code',
        'serial_number',
        'ip_address',
        'is_active',
        'last_seen_at',
        'activated_at',
        'deactivated_at',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_seen_at' => 'datetime',
        'activated_at' => 'datetime',
        'deactivated_at' => 'datetime',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function deviceType()
    {
        return $this->belongsTo(DeviceType::class, 'device_type_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'device_user')
            ->withPivot(['id', 'assigned_at', 'unassigned_at', 'is_active'])
            ->withTimestamps();
    }
}
