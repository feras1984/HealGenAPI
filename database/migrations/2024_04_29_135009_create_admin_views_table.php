<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private $adminType = \App\Models\Admin::class;
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement('DROP VIEW IF EXISTS admins_view');

        DB::statement("
            CREATE VIEW admins_view AS
            SELECT
                users.id AS user_id,
                admins.id AS admin_id,
                admins.first_name,
                admins.last_name,
                admins.role,
                users.email,
                users.avatar,
                users.is_active,
                users.created_at
            FROM users
            INNER JOIN admins
                ON users.reference_id = admins.id
            WHERE users.reference_type = '{$this->adminType}'
        ");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('DROP VIEW IF EXISTS admins_view');
    }
};
