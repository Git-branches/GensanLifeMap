<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ];
    }

    /**
     * Only fields the client may set. Role is never accepted here —
     * every registration creates a citizen; elevation happens only
     * through out-of-band administration.
     *
     * @return array{name: string, email: string, password: string}
     */
    public function accountAttributes(): array
    {
        /** @var array{name: string, email: string, password: string} */
        $attributes = $this->only(['name', 'email', 'password']);

        return $attributes;
    }
}
