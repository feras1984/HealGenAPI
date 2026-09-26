<div>
    <h2 class="text-lg font-semibold">Patient Information</h2>

    <div class="flex justify-start items-center gap-5 px-[16px] py-[4px]">
        <h2 class="font-bold w-[100px]">Patient ID: </h2>
        <p>{{ $patient->PatientId }}</p>
    </div>

    <div class="flex justify-start items-center gap-5 px-[16px] py-[4px]">
        <h2 class="font-bold w-[100px]">Donor ID: </h2>
        <p>{{ $patient->DonorId }}</p>
    </div>

    <div class="flex justify-start items-center gap-5 px-[16px] py-[4px]">
        <h2 class="font-bold w-[100px]">Status: </h2>
        <p>{{ $patient->Status }}</p>
    </div>

    <button
            wire:click="sendToHis"
            wire:loading.attr="disabled"
            class="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
        <span wire:loading.remove wire:target="sendToHis">
            Send to HIS
        </span>

        <span wire:loading wire:target="sendToHis">
            Sending...
        </span>
    </button>

    <hr class="my-6">

    <table class="w-full">
        <thead class="bg-gray-100">
        <tr>
            <th class="px-4 py-2 text-left">Substance</th>
            <th class="px-4 py-2 text-left">Software Result</th>
            <th class="px-4 py-2 text-left">Visual Result</th>
        </tr>
        </thead>

        <tbody>
        @foreach($tests as $test)
            <tr class="border-t">
                <td class="px-4 py-2 text-left">{{ $test->Substance }}</td>
                <td class="px-4 py-2 text-left">{{ $test->SoftwareResult }}</td>
                <td class="px-4 py-2 text-left">{{ $test->VisualResult }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>


    @if (session()->has('success'))
        <div
            x-data="{ show: true }"
            x-init="setTimeout(() => show = false, 4000)"
            x-show="show"
            x-transition
            class="fixed bottom-6 right-6 z-50
               bg-green-600 text-white
               px-5 py-3 rounded-lg shadow-lg"
        >
            ✅ {{ session('success') }}
        </div>
    @endif

    @if (session()->has('error'))
        <div
            x-data="{ show: true }"
            x-init="setTimeout(() => show = false, 4000)"
            x-show="show"
            x-transition
            class="fixed bottom-6 right-6 z-50
               bg-red-600 text-white
               px-5 py-3 rounded-lg shadow-lg"
        >
            ❌ {{ session('error') }}
        </div>
    @endif
</div>

