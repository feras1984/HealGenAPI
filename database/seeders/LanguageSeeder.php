<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $languages = [
            [
                'name' => 'English',
                'code' => 'en',
                'flag_code' => 'gb',
                'level_order' => 1,
                'direction' => 'ltr',
                'is_active' => true,
            ],
            [
                'name' => 'العربية',
                'code' => 'ar',
                'flag_code' => 'ae',
                'level_order' => 2,
                'direction' => 'rtl',
                'is_active' => true,
            ],
        ];

        foreach ($languages as $lang) {
            DB::table('languages')->updateOrInsert(
                ['code' => $lang['code']],
                array_merge($lang, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
