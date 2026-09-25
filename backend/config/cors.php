<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    |
    | Restricted to the known Next.js development frontend. Add further
    | origins via the FRONTEND_URL / EXTRA_CORS_ORIGINS env values instead
    | of opening a wildcard.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(array_unique(array_merge(
        [env('FRONTEND_URL', 'http://localhost:3000')],
        array_filter(array_map('trim', explode(',', (string) env('EXTRA_CORS_ORIGINS', ''))))
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Accept', 'Authorization'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
