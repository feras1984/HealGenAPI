<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;
use RuntimeException;

class TestAdminSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'first_name' => 'James',
                'last_name'  => 'Anderson',
                'email'      => 'james@email.com',
                'password'   => 'Jv7!mQ2#xLp9',
                'role'       => 'Administrator',
            ],
            [
                'first_name' => 'Daniel',
                'last_name'  => 'Mitchell',
                'email'      => 'daniel@email.com',
                'password'   => 'dK4@Rz8!Tq2M',
                'role'       => 'Expert',
            ],
            [
                'first_name' => 'Michael',
                'last_name'  => 'Bennett',
                'email'      => 'michael@email.com',
                'password'   => 'M9#bL3!wX7@p',
                'role'       => 'Inspector',
            ],
            [
                'first_name' => 'Ryan',
                'last_name'  => 'Thompson',
                'email'      => 'ryan@email.com',
                'password'   => 'rT6$Nq2@Kx8!',
                'role'       => 'Inspector',
            ],
            [
                'first_name' => 'David',
                'last_name'  => 'Parker',
                'email'      => 'david@email.com',
                'password'   => 'Dp8!zQ4#Lm2@',
                'role'       => 'Employee',
            ],
            [
                'first_name' => 'Alex',
                'last_name'  => 'Morgan',
                'email'      => 'alex@email.com',
                'password'   => 'A3@vN7!qR5#x',
                'role'       => 'Employee',
            ],
            [
                'first_name' => 'Oliver',
                'last_name'  => 'Hayes',
                'email'      => 'oliver.hayes@email.com',
                'password'   => 'Ol7!qZ2#vKm9',
                'role'       => 'Employee',
            ],
            [
                'first_name' => 'Ethan',
                'last_name'  => 'Carter',
                'email'      => 'ethan.carter@email.com',
                'password'   => 'Et4@xR8!nQ2L',
                'role'       => 'Employee',
            ],
        ];

        DB::transaction(function () use ($users) {
            foreach ($users as $data) {
                $existingUser = DB::table('users')
                    ->where('email', $data['email'])
                    ->first();

                if ($existingUser) {
                    if ($existingUser->reference_type !== \App\Models\Admin::class) {
                        throw new RuntimeException(
                            "Email already belongs to another account type: {$data['email']}"
                        );
                    }

                    $adminId = $existingUser->reference_id;

                    DB::table('admins')
                        ->where('id', $adminId)
                        ->update([
                            'first_name' => $data['first_name'],
                            'last_name'  => $data['last_name'],
                            'role'       => $data['role'],
                            'updated_at' => Carbon::now(),
                        ]);

                    DB::table('users')
                        ->where('id', $existingUser->id)
                        ->update([
                            'password'   => Hash::make($data['password']),
                            'is_active'  => true,
                            'updated_at' => Carbon::now(),
                        ]);

                    continue;
                }

                $now = Carbon::now();

                $adminId = DB::table('admins')->insertGetId([
                    'first_name' => $data['first_name'],
                    'last_name'  => $data['last_name'],
                    'role'       => $data['role'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                DB::table('users')->insert([
                    'reference_id'   => $adminId,
                    'reference_type' => \App\Models\Admin::class,
                    'email'          => $data['email'],
                    'password'       => Hash::make($data['password']),
                    'is_active'      => true,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]);
            }
        });

        $this->command->info('All 8 test admin accounts processed successfully.');
    }
}
