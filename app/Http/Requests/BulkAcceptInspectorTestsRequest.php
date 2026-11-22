<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkAcceptInspectorTestsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1|max:50',
            'ids.*' => 'required|integer|distinct',
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Please select at least one test to forward.',
            'ids.array' => 'Invalid test selection payload.',
            'ids.min' => 'Please select at least one test to forward.',
            'ids.max' => 'You can forward up to 50 tests in a single batch.',
            'ids.*.integer' => 'Each selected test ID must be a valid integer.',
            'ids.*.distinct' => 'Duplicate test IDs are not allowed in the same batch.',
        ];
    }
}
