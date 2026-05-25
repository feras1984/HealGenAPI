<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    public function index(): \Illuminate\Http\JsonResponse
    {
        $patients = DB::table('PatientHeader')
            ->orderByDesc('Id')
            ->limit(50)
            ->get();

        return response()->json($patients);
    }

    public function show($id): \Illuminate\Http\JsonResponse
    {
        $patient = DB::table('PatientHeader')
            ->where('Id', $id)
            ->first();

        if (!$patient) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($patient);
    }

    public function tests($id): \Illuminate\Http\JsonResponse
    {
        $tests = DB::table('PatientTests')
            ->where('PatientHeaderId', $id)
            ->get();

        return response()->json($tests);
    }
}
