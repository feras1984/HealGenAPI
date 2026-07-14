<div>
    <h1 class="text-2xl font-bold">
        Dashboard
    </h1>

    <div class="grid grid-cols-3 gap-6 mt-6">

        <div class="bg-white p-6 rounded shadow">
            Total Patients: {{$totalPatients}}
        </div>

        <div class="bg-white p-6 rounded shadow">
            Pending HL7 Messages: {{$pendingMessages}}
        </div>

        <div class="bg-white p-6 rounded shadow">
            Failed Imports: {{$failedMessages}}
        </div>

    </div>
</div>
