<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Language;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LocaleAuthenticationTest extends TestCase
{
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'cache.default' => 'array',
            'session.driver' => 'array',
        ]);
        DB::purge();

        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        $this->createSchema();
        $this->seedTestData();
    }

    protected function createSchema(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('code', 10)->unique();
            $table->string('direction', 10)->default('ltr');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('role');
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('url');
            $table->unsignedBigInteger('reference_id');
            $table->string('reference_type');
            $table->integer('order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_image')->default(true);
            $table->boolean('is_cover')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->index(['reference_id', 'reference_type'], 'reference');
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 50)->unique();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_type_id')->nullable();
            $table->foreignId('location_id')->nullable();
            $table->string('name', 150);
            $table->string('device_code', 50)->unique();
            $table->string('serial_number', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('location_inspectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id');
            $table->foreignId('user_id');
            $table->dateTime('assigned_at');
            $table->dateTime('unassigned_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('PatientHeader', function (Blueprint $table) {
            $table->id('Id');
            $table->string('PatientId')->nullable();
            $table->string('DonorId')->nullable();
            $table->string('CollectionSite')->nullable();
            $table->string('CupLotNumber')->nullable();
            $table->string('Status')->default('Awaiting Inspection');
            $table->unsignedBigInteger('DeviceId')->nullable();
            $table->string('DeviceCode')->nullable();
            $table->dateTime('CreatedAt')->nullable();
            $table->dateTime('UpdatedAt')->nullable();
        });
    }

    protected function seedTestData(): void
    {
        Language::create(['name' => 'English', 'code' => 'en', 'direction' => 'ltr', 'is_active' => true]);
        Language::create(['name' => 'العربية', 'code' => 'ar', 'direction' => 'rtl', 'is_active' => true]);

        $adminRef = Admin::create(['first_name' => 'Super', 'last_name' => 'Admin', 'role' => 'Administrator']);

        $this->adminUser = User::create([
            'email' => 'admin@healgen.test',
            'password' => Hash::make('Secret123!'),
            'reference_id' => $adminRef->id,
            'reference_type' => Admin::class,
            'is_active' => true,
        ]);
    }

    public function test_get_arabic_login_sets_locale_and_inertia_props(): void
    {
        $response = $this->get('/ar/login');

        $response->assertStatus(200);
        $this->assertEquals('ar', app()->getLocale());
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Auth/Login')
                 ->where('lang', 'ar')
                 ->where('direction', 'rtl')
        );
    }

    public function test_get_english_login_sets_locale_and_inertia_props(): void
    {
        $response = $this->get('/en/login');

        $response->assertStatus(200);
        $this->assertEquals('en', app()->getLocale());
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Auth/Login')
                 ->where('lang', 'en')
                 ->where('direction', 'ltr')
        );
    }

    public function test_post_arabic_login_preserves_locale_and_redirects_to_ar(): void
    {
        $response = $this->post('/ar/login', [
            'email' => 'admin@healgen.test',
            'password' => 'Secret123!',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/ar');
        $response->assertSessionHas('locale', 'ar');
        $response->assertPlainCookie('locale', 'ar');
    }

    public function test_post_english_login_preserves_locale_and_redirects_to_en(): void
    {
        $response = $this->post('/en/login', [
            'email' => 'admin@healgen.test',
            'password' => 'Secret123!',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/en');
        $response->assertSessionHas('locale', 'en');
        $response->assertPlainCookie('locale', 'en');
    }

    public function test_locale_switch_endpoint_updates_session_and_cookie(): void
    {
        $this->actingAs($this->adminUser);

        $responseAr = $this->postJson('/locale/ar');
        $responseAr->assertStatus(200);
        $responseAr->assertJson(['success' => true, 'locale' => 'ar']);
        $responseAr->assertSessionHas('locale', 'ar');
        $responseAr->assertPlainCookie('locale', 'ar');

        $responseEn = $this->postJson('/locale/en');
        $responseEn->assertStatus(200);
        $responseEn->assertJson(['success' => true, 'locale' => 'en']);
        $responseEn->assertSessionHas('locale', 'en');
        $responseEn->assertPlainCookie('locale', 'en');
    }

    public function test_root_url_redirects_authenticated_user_based_on_saved_cookie(): void
    {
        $this->actingAs($this->adminUser);

        // When cookie is ar, redirect to /ar
        $responseAr = $this->withUnencryptedCookie('locale', 'ar')->get('/');
        $responseAr->assertRedirect('/ar');

        // When cookie is en, redirect to /en
        $responseEn = $this->withUnencryptedCookie('locale', 'en')->get('/');
        $responseEn->assertRedirect('/en');
    }

    public function test_inspector_login_redirects_to_arabic_inspector_dashboard(): void
    {
        $inspRef = Admin::create(['first_name' => 'Michael', 'last_name' => 'Bennett', 'role' => 'Inspector']);
        $inspector = User::create([
            'email' => 'michael@email.com',
            'password' => Hash::make('Secret123!'),
            'reference_id' => $inspRef->id,
            'reference_type' => Admin::class,
            'is_active' => true,
        ]);

        $response = $this->post('/ar/login', [
            'email' => 'michael@email.com',
            'password' => 'Secret123!',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect('/ar');

        $dashResponse = $this->actingAs($inspector)->withUnencryptedCookie('locale', 'ar')->get('/ar');
        $dashResponse->assertRedirect();
        $this->assertStringContainsString('/ar/inspector/dashboard', $dashResponse->headers->get('Location'));

        $pageResponse = $this->actingAs($inspector)->withUnencryptedCookie('locale', 'ar')->get('/ar/inspector/dashboard');
        $pageResponse->assertStatus(200);
        $pageResponse->assertInertia(fn ($page) =>
            $page->component('Admin/Inspector/InspectorDashboard')
                 ->where('lang', 'ar')
                 ->where('direction', 'rtl')
        );
    }
}
