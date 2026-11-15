<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city',
        'country',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class, 'location_id');
    }

    public function inspectorAssignments(): HasMany
    {
        return $this->hasMany(LocationInspector::class, 'location_id');
    }

    public function activeInspectorAssignment(): HasOne
    {
        return $this->hasOne(LocationInspector::class, 'location_id')->where('is_active', true);
    }

    public function activeInspector(): HasOneThrough
    {
        return $this->hasOneThrough(
            User::class,
            LocationInspector::class,
            'location_id', // Foreign key on LocationInspector table
            'id',          // Foreign key on User table
            'id',          // Local key on Location table
            'user_id'      // Local key on LocationInspector table
        )->where('location_inspectors.is_active', true);
    }
}
