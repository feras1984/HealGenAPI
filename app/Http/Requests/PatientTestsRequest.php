<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PatientTestsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'patient_header_id' => 'required|integer|exists:PatientHeader,Id',
        ];
    }

    public function messages(): array
    {
        return [
            'per_page.min' => 'per_page must be >= 1',
        ];
    }
}
