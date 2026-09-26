<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRegistrationRequest extends FormRequest
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
        $user = $this->route('user');
        return [
            'email' => [
                'required',
                'email',
                Rule::unique('users')
                ->ignore($this->route('user')),
            ],
            'password' => [
//                'required',
                $user ? 'nullable' : 'required',
                'min:12'
            ],
        ];
    }

    public function messages(): array{
        return [
            'email.required' => 'The email is required.',
            'email.email' => 'Email format is not valid.',
            'password.required' => 'The password is required.',
            'password.min' => 'Minimum Password Length is 12 characters.',
        ];
    }
}
