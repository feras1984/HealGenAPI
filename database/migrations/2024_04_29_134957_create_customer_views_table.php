<?php

use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    private $customerType = Customer::class;
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement('DROP VIEW IF EXISTS customers_view');

        DB::statement("
            CREATE VIEW customers_view AS
            SELECT
                users.id AS user_id,
                customers.id AS customer_id,
                customers.name,
                users.email,
                users.avatar,
                users.is_active,
                users.created_at
            FROM users
            INNER JOIN customers
                ON users.reference_id = customers.id
            WHERE users.reference_type = '{$this->customerType}'
        ");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('DROP VIEW IF EXISTS customers_view');
    }
};
