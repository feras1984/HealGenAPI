<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemAuditLog extends Model
{
    use HasFactory;

    protected $table = 'system_audit_logs';

    protected $fillable = [
        'user_id',
        'user_name',
        'role',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'ip_address',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
