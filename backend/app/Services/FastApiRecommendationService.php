<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FastApiRecommendationService
{
    public function recommend(int $userId, int $limit = 20): array
    {
        $baseUrl = rtrim((string) config('services.fastapi.base_url', 'http://127.0.0.1:8010'), '/');
        $timeout = (int) config('services.fastapi.timeout_seconds', 30);
        $connectTimeout = (int) config('services.fastapi.connect_timeout_seconds', 3);

        try {
            $response = Http::acceptJson()
                ->connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->post("{$baseUrl}/recommend", [
                    'user_id' => $userId,
                    'limit' => $limit,
                ]);

            $response->throw();

            return [
                'ok' => true,
                'status_code' => $response->status(),
                'data' => $response->json(),
            ];
        } catch (ConnectionException $e) {
            Log::error('FastAPI recommendation connection failed', ['error' => $e->getMessage()]);
            return [
                'ok' => false,
                'status_code' => 503,
                'message' => 'Recommendation service is unavailable. Please try again.',
                'error' => $e->getMessage(),
            ];
        } catch (RequestException $e) {
            $statusCode = $e->response?->status() ?? 502;
            Log::error('FastAPI recommendation request failed', [
                'error' => $e->getMessage(),
                'status' => $statusCode,
                'body' => $e->response?->body(),
            ]);

            return [
                'ok' => false,
                'status_code' => $statusCode,
                'message' => 'Recommendation service returned an error.',
                'error' => $e->getMessage(),
                'response_body' => $e->response?->json(),
            ];
        }
    }

    public function train(int $trainingUserLimit = 3000, int $userOffset = 0): array
    {
        $baseUrl = rtrim((string) config('services.fastapi.base_url', 'http://127.0.0.1:8010'), '/');
        $timeout = (int) config('services.fastapi.train_timeout_seconds', 180);
        $connectTimeout = (int) config('services.fastapi.connect_timeout_seconds', 3);

        try {
            $response = Http::acceptJson()
                ->connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->post("{$baseUrl}/api/v1/recommendations/train", [
                    'training_user_limit' => $trainingUserLimit,
                    'user_offset' => $userOffset,
                ]);

            $response->throw();

            return [
                'ok' => true,
                'status_code' => $response->status(),
                'data' => $response->json(),
            ];
        } catch (ConnectionException $e) {
            Log::error('FastAPI recommendation train connection failed', ['error' => $e->getMessage()]);
            return [
                'ok' => false,
                'status_code' => 503,
                'message' => 'Recommendation training service is unavailable. Please try again.',
                'error' => $e->getMessage(),
            ];
        } catch (RequestException $e) {
            $statusCode = $e->response?->status() ?? 502;
            Log::error('FastAPI recommendation train request failed', [
                'error' => $e->getMessage(),
                'status' => $statusCode,
                'body' => $e->response?->body(),
            ]);

            return [
                'ok' => false,
                'status_code' => $statusCode,
                'message' => 'Recommendation training failed at AI service.',
                'error' => $e->getMessage(),
                'response_body' => $e->response?->json(),
            ];
        }
    }
}
