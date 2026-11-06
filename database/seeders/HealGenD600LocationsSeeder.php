<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class HealGenD600LocationsSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {

            $now = now();

            /*
             * 1. Device Type
             */
            $deviceType = DB::table('device_types')
                ->where('manufacturer', 'HealGen')
                ->where('model', 'D600')
                ->first();

            if ($deviceType) {
                if ($deviceType->name !== 'HealGen D600') {
                    throw new RuntimeException(
                        'HealGen D600 exists with a different name.'
                    );
                }

                $deviceTypeId = $deviceType->id;
            } else {
                $deviceTypeId = DB::table('device_types')
                    ->insertGetId([
                        'name' => 'HealGen D600',
                        'manufacturer' => 'HealGen',
                        'model' => 'D600',
                        'description' => 'HealGen D600 Laboratory Analyzer',
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
            }

            /*
             * 2. Locations
             */
            $locations = [
                [
                    'name' => 'Dubai Healthcare City',
                    'code' => 'DXB-HC-001',
                    'address' => 'Dubai Healthcare City, Oud Metha, Dubai',
                    'city' => 'Dubai',
                    'country' => 'United Arab Emirates',
                    'devices' => [
                        ['HealGen D600 - HC01', 'D600-HC-001'],
                        ['HealGen D600 - HC02', 'D600-HC-002'],
                        ['HealGen D600 - HC03', 'D600-HC-003'],
                        ['HealGen D600 - HC04', 'D600-HC-004'],
                    ],
                ],
                [
                    'name' => 'Al Barsha Medical Center',
                    'code' => 'DXB-BAR-002',
                    'address' => 'Al Barsha 1, Dubai',
                    'city' => 'Dubai',
                    'country' => 'United Arab Emirates',
                    'devices' => [
                        ['HealGen D600 - BAR01', 'D600-BAR-001'],
                        ['HealGen D600 - BAR02', 'D600-BAR-002'],
                        ['HealGen D600 - BAR03', 'D600-BAR-003'],
                        ['HealGen D600 - BAR04', 'D600-BAR-004'],
                    ],
                ],
                [
                    'name' => 'Deira Medical Center',
                    'code' => 'DXB-DEI-003',
                    'address' => 'Deira, Dubai',
                    'city' => 'Dubai',
                    'country' => 'United Arab Emirates',
                    'devices' => [
                        ['HealGen D600 - DEI01', 'D600-DEI-001'],
                        ['HealGen D600 - DEI02', 'D600-DEI-002'],
                        ['HealGen D600 - DEI03', 'D600-DEI-003'],
                        ['HealGen D600 - DEI04', 'D600-DEI-004'],
                    ],
                ],
                [
                    'name' => 'Jumeirah Medical Center',
                    'code' => 'DXB-JUM-004',
                    'address' => 'Jumeirah 1, Dubai',
                    'city' => 'Dubai',
                    'country' => 'United Arab Emirates',
                    'devices' => [
                        ['HealGen D600 - JUM01', 'D600-JUM-001'],
                        ['HealGen D600 - JUM02', 'D600-JUM-002'],
                        ['HealGen D600 - JUM03', 'D600-JUM-003'],
                    ],
                ],
            ];

            /*
             * 3. Insert Locations and Devices
             */
            foreach ($locations as $locationData) {

                $devices = $locationData['devices'];

                unset($locationData['devices']);

                $location = DB::table('locations')
                    ->where('code', $locationData['code'])
                    ->first();

                if ($location) {
                    if ($location->name !== $locationData['name']) {
                        throw new RuntimeException(
                            "Location code conflict: {$locationData['code']}"
                        );
                    }

                    $locationId = $location->id;
                } else {
                    $locationId = DB::table('locations')
                        ->insertGetId(array_merge(
                            $locationData,
                            [
                                'is_active' => true,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]
                        ));
                }

                /*
                 * 4. Insert Devices
                 */
                foreach ($devices as [$deviceName, $deviceCode]) {

                    $device = DB::table('devices')
                        ->where('device_code', $deviceCode)
                        ->first();

                    if ($device) {
                        if (
                            $device->name !== $deviceName ||
                            (int) $device->location_id !== (int) $locationId ||
                            (int) $device->device_type_id !== (int) $deviceTypeId
                        ) {
                            throw new RuntimeException(
                                "Device data conflict: {$deviceCode}"
                            );
                        }

                        continue;
                    }

//                    DB::table('devices')->insert([
//                        'location_id' => $locationId,
//                        'device_type_id' => $deviceTypeId,
//                        'name' => $deviceName,
//                        'device_code' => $deviceCode,
//                        'is_active' => true,
//                        'created_at' => $now,
//                        'updated_at' => $now,
//                    ]);

                    DB::table('devices')->insert([
                        'location_id' => $locationId,
                        'device_type_id' => $deviceTypeId,
                        'name' => $deviceName,
                        'device_code' => $deviceCode,
                        'serial_number' => 'SN-' . $deviceCode,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        });

        $this->command->info(
            'HealGen D600 locations and devices seeded successfully.'
        );
    }
}
