<div class="mt-8 bg-white rounded-lg shadow">

    <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">
            Latest Patients
        </h2>
    </div>

    <div class="overflow-x-auto">

        <table class="min-w-full text-sm">

            <thead class="bg-gray-100">
            <tr>
                <th class="px-4 py-3 text-left">Patient ID</th>
                <th class="px-4 py-3 text-left">Donor ID</th>
                <th class="px-4 py-3 text-left">Cup Lot</th>
                <th class="px-4 py-3 text-left">Status</th>
                <th class="px-4 py-3 text-left">Processed At</th>
                <th class="px-4 py-3 text-center">Action</th>
            </tr>
            </thead>

            <tbody>

            @forelse($patients as $patient)

                <tr class="border-b hover:bg-gray-50">

                    <td class="px-4 py-3">
                        {{ $patient->PatientId }}
                    </td>

                    <td class="px-4 py-3">
                        {{ $patient->DonorId }}
                    </td>

                    <td class="px-4 py-3">
                        {{ $patient->CupLotNumber }}
                    </td>

                    <td class="px-4 py-3">
                        {{ $patient->Status }}
                    </td>

                    <td class="px-4 py-3">
                        {{ $patient->ProcessedAt }}
                    </td>

                    <td class="px-4 py-3 text-center">

                        <a
                            href="{{ route('tests.details', $patient->Id) }}"
                            class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                        >
                            Edit
                        </a>

                    </td>

                </tr>

            @empty

                <tr>
                    <td colspan="6" class="text-center py-8 text-gray-500">
                        No records found.
                    </td>
                </tr>

            @endforelse

            </tbody>

        </table>

        <div class="mt-6">
            {{ $patients->links() }}
        </div>

    </div>

</div>
