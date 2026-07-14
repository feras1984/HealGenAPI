<div
    :class="open ? 'w-64' : 'w-16'"
    class="fixed top-0 left-0 h-screen bg-slate-800 text-white transition-all duration-300"
>



    <nav class="mt-5 space-y-1">

        <a
            class="flex items-center px-4 py-3 hover:bg-gray-700 rounded cursor-pointer"
            href="/"
        >
        <span class="text-xl">
            🏠
        </span>

            <span
                x-show="open"
                x-transition:enter="transition-opacity duration-200 delay-200"
                x-transition:enter-start="opacity-0"
                x-transition:enter-end="opacity-100"
                class="ml-3 whitespace-nowrap"
            >
            Dashboard
        </span>
        </a>

        <a
            class="flex items-center px-4 py-3 hover:bg-gray-700 rounded cursor-pointer"
            href="/tests"
        >
        <span class="text-xl">
            🔬
        </span>

            <span
                x-show="open"
                x-transition:enter="transition-opacity duration-200 delay-200"
                x-transition:enter-start="opacity-0"
                x-transition:enter-end="opacity-100"
                class="ml-3 whitespace-nowrap"
            >
            Tests
        </span>
        </a>


{{--        <a class="flex items-center px-4 py-3 hover:bg-gray-700 rounded cursor-pointer">--}}
{{--        <span class="text-xl">--}}
{{--            📩--}}
{{--        </span>--}}

{{--            <span--}}
{{--                x-show="open"--}}
{{--                x-transition:enter="transition-opacity duration-200 delay-200"--}}
{{--                x-transition:enter-start="opacity-0"--}}
{{--                x-transition:enter-end="opacity-100"--}}
{{--                class="ml-3 whitespace-nowrap"--}}
{{--            >--}}
{{--            HL7 Messages--}}
{{--        </span>--}}
{{--        </a>--}}


        <a
            class="flex items-center px-4 py-3 hover:bg-gray-700 rounded cursor-pointer"
            href="{{route('logs')}}"
        >
        <span class="text-xl">
            📋
        </span>

            <span
                x-show="open"
                x-transition:enter="transition-opacity duration-200 delay-200"
                x-transition:enter-start="opacity-0"
                x-transition:enter-end="opacity-100"
                class="ml-3 whitespace-nowrap"
            >
            Logs
        </span>
        </a>


{{--        <a--}}
{{--            class="flex items-center px-4 py-3 hover:bg-gray-700 rounded cursor-pointer"--}}
{{--        >--}}
{{--        <span class="text-xl">--}}
{{--            ⚙️--}}
{{--        </span>--}}

{{--            <span--}}
{{--                x-show="open"--}}
{{--                x-transition:enter="transition-opacity duration-200 delay-200"--}}
{{--                x-transition:enter-start="opacity-0"--}}
{{--                x-transition:enter-end="opacity-100"--}}
{{--                class="ml-3 whitespace-nowrap"--}}
{{--            >--}}
{{--            Settings--}}
{{--        </span>--}}
{{--        </a>--}}

    </nav>

</div>
