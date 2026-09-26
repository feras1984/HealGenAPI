<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('location') ? $this->route('location')->id : null;

        return [
            'name' => 'required|string|min:3|max:150',
            'code' => 'required|string|min:2|max:50|unique:locations,code,' . ($id ?? 'NULL') . ',id',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
//            'isActive' => 'nullable|boolean|string',
            'notes' => 'nullable|string',
        ];
    }
}
