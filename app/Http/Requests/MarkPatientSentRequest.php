<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkPatientSentRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_header_id' => 'required|integer|exists:PatientHeader,Id',
            'status'            => 'required|string|in:SentToHIS,FailedToSend',
            'his_reference'     => 'nullable|string|max:150',
        ];
    }

    public function messages(): array
    {
        return [
            'per_page.min' => 'per_page must be >= 1',
        ];
    }
}
