<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ config('app.name', 'HealGen') }}</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    @livewireStyles
</head>

<body class="bg-gray-100">

<div x-data="{ open: true }" class="flex min-h-screen">

    <div class="flex h-screen w-full">
        <livewire:layout.sidebar />

        <div class="flex-1 transition-all duration-300"
             :class="open ? 'ml-64' : 'ml-16'"
        >
            <livewire:layout.header />

            <main
                class="flex-1 overflow-y-auto p-6"
            >
                {{ $slot }}
            </main>
        </div>
    </div>

</div>

<livewire:components.notifications />

@livewireScripts

</body>

</html>
