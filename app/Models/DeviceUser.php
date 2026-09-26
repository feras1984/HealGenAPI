<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeviceUser extends Model
{
    use HasFactory;

    protected $table = 'device_user';

    protected $fillable = [
        'device_id',
        'user_id',
        'assigned_at',
        'unassigned_at',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'assigned_at' => 'datetime',
        'unassigned_at' => 'datetime',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
