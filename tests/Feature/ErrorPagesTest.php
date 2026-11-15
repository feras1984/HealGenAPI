<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class ErrorPagesTest extends TestCase
{

    protected function setUp(): void
    {
        parent::setUp();

        if (!\Illuminate\Support\Facades\Schema::hasTable('languages')) {
            \Illuminate\Support\Facades\Schema::create('languages', function (\Illuminate\Database\Schema\Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code');
                $table->string('flag_code')->nullable();
                $table->integer('level_order')->nullable();
                $table->string('direction')->default('ltr');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        Route::middleware('web')->group(function () {
            Route::get('/test-error/401', function () {
                abort(Response::HTTP_UNAUTHORIZED);
            });
            Route::get('/test-error/403', function () {
                abort(Response::HTTP_FORBIDDEN);
            });
            Route::get('/test-error/404', function () {
                abort(Response::HTTP_NOT_FOUND);
            });
            Route::get('/test-error/500', function () {
                abort(Response::HTTP_INTERNAL_SERVER_ERROR);
            });
        });

        Route::prefix('api')->group(function () {
            Route::get('/test-error/401', function () {
                abort(Response::HTTP_UNAUTHORIZED);
            });
            Route::get('/test-error/403', function () {
                abort(Response::HTTP_FORBIDDEN);
            });
            Route::get('/test-error/404', function () {
                abort(Response::HTTP_NOT_FOUND);
            });
            Route::get('/test-error/500', function () {
                abort(Response::HTTP_INTERNAL_SERVER_ERROR);
            });
        });
    }

    private function getInertiaHeaders(): array
    {
        $version = (new HandleInertiaRequests())->version(request());
        $headers = [
            'X-Inertia' => 'true',
        ];
        if ($version) {
            $headers['X-Inertia-Version'] = $version;
        }
        return $headers;
    }

    public function test_401_web_request_renders_unauthorized_inertia_page(): void
    {
        $response = $this->get('/test-error/401');

        $response->assertStatus(401);
        $response->assertInertia(fn (Assert $page) =>
            $page->component('Admin/Errors/Unauthorized')
                ->where('status', 401)
                ->where('title', 'Unauthorized Access')
                ->where('message', 'Authentication is required to access this page or the requested resource.')
                ->where('support', 'Please sign in with valid credentials, or contact your administrator.')
        );
    }

    public function test_401_inertia_xhr_returns_401_with_unauthorized_component(): void
    {
        $response = $this->withHeaders($this->getInertiaHeaders())
            ->get('/test-error/401');

        $response->assertStatus(401);
        $response->assertHeader('X-Inertia', 'true');

        $json = $response->json();
        $this->assertSame('Admin/Errors/Unauthorized', $json['component']);
        $this->assertSame(401, $json['props']['status']);
        $this->assertSame('Unauthorized Access', $json['props']['title']);
    }

    public function test_401_api_request_returns_json(): void
    {
        $response = $this->getJson('/api/test-error/401');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => false,
            'message' => 'Authentication is required to access this resource.',
        ]);
    }

    public function test_403_web_request_renders_forbidden_inertia_page(): void
    {
        $response = $this->get('/test-error/403');

        $response->assertStatus(403);
        $response->assertInertia(fn (Assert $page) =>
            $page->component('Admin/Errors/Forbidden')
                ->where('status', 403)
                ->where('title', 'Access Restricted')
                ->where('message', "You don't have permission to access this page or the requested resource.")
                ->where('support', 'Please contact your administrator if you believe this is a mistake.')
        );
    }

    public function test_403_inertia_xhr_returns_403_with_forbidden_component(): void
    {
        $response = $this->withHeaders($this->getInertiaHeaders())
            ->get('/test-error/403');

        $response->assertStatus(403);
        $response->assertHeader('X-Inertia', 'true');

        $json = $response->json();
        $this->assertSame('Admin/Errors/Forbidden', $json['component']);
        $this->assertSame(403, $json['props']['status']);
        $this->assertSame('Access Restricted', $json['props']['title']);
    }

    public function test_403_api_request_returns_json(): void
    {
        $response = $this->getJson('/api/test-error/403');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => false,
            'message' => "You don't have permission to access this page or the requested resource.",
        ]);
    }

    public function test_404_web_request_renders_not_found_inertia_page(): void
    {
        $response = $this->get('/test-error/404');

        $response->assertStatus(404);
        $response->assertInertia(fn (Assert $page) =>
            $page->component('Admin/Errors/NotFound')
                ->where('status', 404)
                ->where('title', 'Page Not Found')
                ->where('message', "Sorry, the page you're looking for doesn't exist or may have been moved.")
                ->where('support', 'You can return to your dashboard and continue working.')
        );
    }

    public function test_404_inertia_xhr_returns_404_with_not_found_component(): void
    {
        $response = $this->withHeaders($this->getInertiaHeaders())
            ->get('/test-error/404');

        $response->assertStatus(404);
        $response->assertHeader('X-Inertia', 'true');

        $json = $response->json();
        $this->assertSame('Admin/Errors/NotFound', $json['component']);
        $this->assertSame(404, $json['props']['status']);
        $this->assertSame('Page Not Found', $json['props']['title']);
    }

    public function test_404_api_request_returns_json(): void
    {
        $response = $this->getJson('/api/test-error/404');

        $response->assertStatus(404);
        $response->assertJson([
            'status' => false,
            'message' => 'The requested page or resource was not found.',
        ]);
    }

    public function test_500_web_request_renders_server_error_inertia_page(): void
    {
        // Turn off debug for testing 500 error page presentation
        config(['app.debug' => false]);

        $response = $this->get('/test-error/500');

        $response->assertStatus(500);
        $response->assertInertia(fn (Assert $page) =>
            $page->component('Admin/Errors/ServerError')
                ->where('status', 500)
                ->where('title', 'Internal Server Error')
                ->where('message', 'Something went wrong on our end. We are actively working to fix the issue.')
                ->where('support', 'Please try again in a few moments or return to your dashboard.')
        );
    }

    public function test_500_inertia_xhr_returns_500_with_server_error_component(): void
    {
        config(['app.debug' => false]);

        $response = $this->withHeaders($this->getInertiaHeaders())
            ->get('/test-error/500');

        $response->assertStatus(500);
        $response->assertHeader('X-Inertia', 'true');

        $json = $response->json();
        $this->assertSame('Admin/Errors/ServerError', $json['component']);
        $this->assertSame(500, $json['props']['status']);
        $this->assertSame('Internal Server Error', $json['props']['title']);
    }

    public function test_500_api_request_returns_json(): void
    {
        $response = $this->getJson('/api/test-error/500');

        $response->assertStatus(500);
        $response->assertJsonStructure([
            'status',
            'message',
        ]);
    }
}
