<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:100',
            'manufacturer' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'description' => 'nullable|string',
//            'isActive' => 'nullable|boolean|string',
        ];
    }
}
