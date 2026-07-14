<header
    class="h-16 bg-white shadow flex items-center justify-between px-6"
>
    <div class="flex items-center justify-start gap-3">
        <div class="flex items-center justify-end">
            <button
                @click="open = !open"
                class=" cursor-pointer gray-900"
            >
                ☰
            </button>
        </div>

        <h1 class="text-xl font-bold">
            NRC
        </h1>
    </div>



    <div class="flex items-center gap-6">


{{--        <!-- Messages -->--}}
{{--        <button class="text-xl cursor-pointer">--}}
{{--            💬--}}
{{--        </button>--}}


{{--        <!-- Notifications -->--}}
{{--        <button class="text-xl cursor-pointer">--}}
{{--            🔔--}}
{{--        </button>--}}


        <!-- Profile -->
        <button class="flex items-center gap-2 cursor-pointer">

{{--            <img--}}
{{--                src="https://ui-avatars.com/api/?name=Admin"--}}
{{--                class="w-9 h-9 rounded-full"--}}
{{--            >--}}

            <span>
                Admin
            </span>

        </button>

        <livewire:auth.logout />


    </div>

</header>
