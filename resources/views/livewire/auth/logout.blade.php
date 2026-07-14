<form method="POST" action="{{ route('logout') }}">
    @csrf

    <button
        type="submit"
        class="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
    >
        🚪
        <span>Logout</span>
    </button>
</form>
