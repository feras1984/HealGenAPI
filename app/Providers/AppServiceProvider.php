<?php

namespace App\Providers;

use App\Services\FileService\FileService;
use App\Services\FileService\UploadService;
use App\Services\PatientService\PatientHeaderService;
use App\Services\PatientService\PatientTestService;
use App\Services\SettingService\LanguageService;
use App\Services\UserService\AdminService\AdminService;
use App\Services\UserService\UserService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton('FileService', function ($app) {
            return new FileService();
        });

        $this->app->singleton('UploadService', function ($app) {
            return new UploadService();
        });

        $this->app->singleton('LanguageService', function ($app) {
            return new LanguageService();
        });

//        $this->app->singleton('UserService', function ($app) {
//            return new UserService();
//        });

        $this->app->singleton('UserService', function () {
            //Retrieve user instance for registration:
            $user = request()->user();
            return new AdminService();
//            if(is_null($user)) {
//                $data = request()->all();
//
//                if (array_key_exists('type', $data)) {
//
//                    switch ($data['type']) {
////                        case 'normal' : {
////                            return new NormalService();
////                        }
//
//                        default : {
//                            return new AdminService();
//                        }
//                    }
//                }
//                //Retrieve user instance for login:
//                else return new UserService();
//            }
//            else {
//
//                if ($user->reference instanceof Customer) {
//                    return new NormalService();
//                }
//
//                else {
//                    return new AdminService();
//                }
//            }

        });

        $this->app->singleton('AdminService', function () {
            return new AdminService();
        });

        $this->app->singleton('AdminService', function ($app) {
            return new AdminService();
        });

        $this->app->singleton('PatientHeaderService', function ($app) {
            return new PatientHeaderService();
        });

        $this->app->singleton('patientTestService', function ($app) {
            return new PatientTestService();
        });

        $this->app->singleton('LocationService', function ($app) {
            return new \App\Services\LocationService\LocationService();
        });

        $this->app->singleton('DeviceTypeService', function ($app) {
            return new \App\Services\DeviceTypeService\DeviceTypeService();
        });

        $this->app->singleton('DeviceService', function ($app) {
            return new \App\Services\DeviceService\DeviceService();
        });

        $this->app->singleton('DeviceUserService', function ($app) {
            return new \App\Services\DeviceUserService\DeviceUserService();
        });

        $this->app->singleton('MonitorService', function ($app) {
            return new \App\Services\MonitorService\MonitorService();
        });

        $this->app->singleton('InspectorService', function ($app) {
            return new \App\Services\InspectorService\InspectorService();
        });

        $this->app->singleton('SupervisorService', function ($app) {
            return new \App\Services\SupervisorService\SupervisorService();
        });

        $this->app->singleton('EmployeeDashboardService', function ($app) {
            return new \App\Services\EmployeeService\EmployeeDashboardService();
        });

        $this->app->singleton('AdminDashboardService', function ($app) {
            return new \App\Services\AdminDashboardService\AdminDashboardService();
        });

        $this->app->singleton('SystemAuditLogService', function ($app) {
            return new \App\Services\SystemAuditLogService\SystemAuditLogService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
