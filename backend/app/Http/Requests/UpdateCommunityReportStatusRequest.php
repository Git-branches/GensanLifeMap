<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCommunityReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route-level placeholder middleware currently denies all callers with
        // 401 until real admin authentication is added in the next phase.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:under_review,verified,resolved,rejected'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var \App\Models\CommunityReport|null $report */
            $report = $this->route('communityReport');

            if (! $report) {
                return;
            }

            $allowed = self::allowedTransitions()[$report->status] ?? [];

            if (! in_array($this->input('status'), $allowed, true)) {
                $validator->errors()->add(
                    'status',
                    "Cannot transition report from [{$report->status}] to [{$this->input('status')}]."
                );
            }
        });
    }

    /**
     * @return array<string, list<string>>
     */
    public static function allowedTransitions(): array
    {
        return [
            'submitted' => ['under_review', 'verified', 'rejected'],
            'under_review' => ['verified', 'rejected', 'resolved'],
            'verified' => ['resolved', 'rejected'],
            'resolved' => [],
            'rejected' => [],
        ];
    }
}
