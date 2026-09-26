<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('device') ? $this->route('device')->id : null;

        return [
            'locationId' => 'required|integer|exists:locations,id',
            'deviceTypeId' => 'required|integer|exists:device_types,id',
            'name' => 'required|string|min:2|max:150',
            'deviceCode' => 'required|string|min:2|max:100|unique:devices,device_code,' . ($id ?? 'NULL') . ',id',
            'serialNumber' => 'nullable|string|max:150|unique:devices,serial_number,' . ($id ?? 'NULL') . ',id',
            'ipAddress' => 'nullable|string|max:45',
//            'isActive' => 'nullable|boolean|string',
            'notes' => 'nullable|string',
        ];
    }
}
