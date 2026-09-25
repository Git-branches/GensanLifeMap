<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public submission endpoint; admin moderation is separately protected.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Required until auth lands; then it will be derived from the session/token.
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'category' => ['required', 'string', 'in:road,flooding,garbage,streetlight,accessibility,environment,other'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            // File upload only; clients may never set photo_path directly.
            'photo' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
