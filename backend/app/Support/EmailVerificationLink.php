<?php

namespace App\Support;

use App\Models\User;

/**
 * Email-verification links for the single-page frontend.
 *
 * The link opens a frontend page carrying `id`, `hash`, `expires` and an
 * HMAC `signature`; that page posts them back to the API. Because the
 * signature covers only those values (not a URL or host), it keeps working
 * however the API is served, and it stops working if the account's email
 * changes (the hash is derived from the address) or after it expires.
 */
class EmailVerificationLink
{
    /** Link lifetime in minutes. */
    private const LIFETIME_MINUTES = 1440;

    /**
     * @return array{id: int|string, hash: string, expires: int, signature: string}
     */
    public static function parameters(User $user): array
    {
        $expires = now()->addMinutes(self::LIFETIME_MINUTES)->getTimestamp();
        $hash = sha1($user->getEmailForVerification());

        return [
            'id' => $user->getKey(),
            'hash' => $hash,
            'expires' => $expires,
            'signature' => self::sign($user->getKey(), $hash, $expires),
        ];
    }

    public static function url(User $user): string
    {
        return rtrim((string) config('app.frontend_url'), '/').'/verify-email?'.http_build_query(self::parameters($user));
    }

    public static function isValid(User $user, string $hash, int $expires, string $signature): bool
    {
        if ($expires < now()->getTimestamp()) {
            return false;
        }

        // The address must be the one the link was issued for.
        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return false;
        }

        return hash_equals(self::sign($user->getKey(), $hash, $expires), $signature);
    }

    private static function sign(int|string $id, string $hash, int $expires): string
    {
        return hash_hmac('sha256', "{$id}|{$hash}|{$expires}", (string) config('app.key'));
    }
}
