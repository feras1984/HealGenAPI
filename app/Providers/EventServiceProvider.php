<?php

namespace App\Providers;

use App\Events\SendBrochureEvent;
use App\Listeners\SendBrochureListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        SendBrochureEvent::class => [
            SendBrochureListener::class,
        ],
    ];
}
