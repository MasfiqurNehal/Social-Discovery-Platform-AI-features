<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FastApiChatbotService
{
    public function ask(?int $userId, string $message, ?int $conversationId = null): array
    {
        $baseUrl = rtrim((string) config('services.fastapi.base_url', 'http://127.0.0.1:8010'), '/');
        $timeout = (int) config('services.fastapi.chat_timeout_seconds', 40);
        $connectTimeout = (int) config('services.fastapi.connect_timeout_seconds', 3);

        try {
            $response = Http::acceptJson()
                ->connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->post("{$baseUrl}/api/v1/chatbot/ask", [
                    'user_id' => $userId,
                    'message' => $message,
                    'conversation_id' => $conversationId,
                ]);

            $response->throw();

            return [
                'ok' => true,
                'status_code' => $response->status(),
                'data' => $response->json(),
            ];
        } catch (ConnectionException $e) {
            Log::error('FastAPI chatbot connection failed', ['error' => $e->getMessage()]);
            return [
                'ok' => false,
                'status_code' => 503,
                'message' => 'Chatbot service is unavailable. Please try again.',
                'error' => $e->getMessage(),
            ];
        } catch (RequestException $e) {
            Log::error('FastAPI chatbot request failed', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
            ]);
            return [
                'ok' => false,
                'status_code' => $e->response?->status() ?? 502,
                'message' => 'Chatbot service returned an error.',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function history(int $conversationId, int $limit = 30): array
    {
        $baseUrl = rtrim((string) config('services.fastapi.base_url', 'http://127.0.0.1:8010'), '/');
        $timeout = (int) config('services.fastapi.chat_timeout_seconds', 40);
        $connectTimeout = (int) config('services.fastapi.connect_timeout_seconds', 3);

        try {
            $response = Http::acceptJson()
                ->connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->get("{$baseUrl}/api/v1/chatbot/conversations/{$conversationId}/messages", [
                    'limit' => $limit,
                ]);

            $response->throw();

            return [
                'ok' => true,
                'status_code' => $response->status(),
                'data' => $response->json(),
            ];
        } catch (ConnectionException $e) {
            Log::error('FastAPI chatbot history connection failed', ['error' => $e->getMessage()]);
            return [
                'ok' => false,
                'status_code' => 503,
                'message' => 'Chatbot history service is unavailable. Please try again.',
                'error' => $e->getMessage(),
            ];
        } catch (RequestException $e) {
            Log::error('FastAPI chatbot history request failed', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'body' => $e->response?->body(),
            ]);
            return [
                'ok' => false,
                'status_code' => $e->response?->status() ?? 502,
                'message' => 'Chatbot history service returned an error.',
                'error' => $e->getMessage(),
            ];
        }
    }
}
