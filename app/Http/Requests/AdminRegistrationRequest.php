<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminRegistrationRequest extends UserRegistrationRequest
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
        $rules = parent::rules();
        $rules['firstName'] = [
            'required',
            'min:3'
        ];
        $rules['lastName'] = [
            'required',
            'min:3'
        ];
        return $rules;
    }

    public function messages(): array{
        return [
            'firstName.required' => 'First name is required',
            'firstName.min' => 'Minimum length is 3',
            'lastName.required' => 'Last name is required',
            'lastName.min' => 'Minimum length is 3',
        ];
    }
}
