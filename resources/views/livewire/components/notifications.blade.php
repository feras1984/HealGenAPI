<div
    x-data="{
        show: false,
        message: '',
        type: 'success'
    }"
    x-on:notify.window="
        type = $event.detail[0].type;
        message = $event.detail[0].message;
        show = true;

        clearTimeout(window.toastTimer);

        window.toastTimer = setTimeout(() => {
            show = false;
        }, 4000);
    "
    x-show="show"
    x-transition
    class="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white"
    :class="type === 'success' ? 'bg-green-600' : 'bg-red-600'"
>
    <span x-text="message"></span>
</div>
