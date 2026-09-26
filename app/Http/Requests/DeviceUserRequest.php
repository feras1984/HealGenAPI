<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'deviceId' => 'required|integer|exists:devices,id',
            'userId' => 'required|integer|exists:users,id',
        ];
    }
}
