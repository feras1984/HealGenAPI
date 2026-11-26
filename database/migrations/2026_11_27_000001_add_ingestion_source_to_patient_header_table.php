<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DEFAULT_CONSTRAINT_NAME = 'DF_PatientHeader_IngestionSource';

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('PatientHeader')) {
            return;
        }

        $driver = DB::getDriverName();
        $columnAdded = false;

        if (!Schema::hasColumn('PatientHeader', 'IngestionSource')) {
            Schema::table('PatientHeader', function (Blueprint $table) use ($driver) {
                if ($driver === 'sqlsrv') {
                    // Add nullable first without an unnamed default constraint so backfill
                    // and named constraint creation remain cleanly reversible on SQL Server.
                    $table->string('IngestionSource', 20)->nullable();
                } else {
                    $table->string('IngestionSource', 20)->default('excel');
                }
            });
            $columnAdded = true;
        }

        DB::transaction(function () use ($driver, $columnAdded) {
            $hasSourceFile = Schema::hasColumn('PatientHeader', 'SourceFile');

            if ($hasSourceFile) {
                $pdfPredicate = $driver === 'sqlsrv'
                    ? "LOWER(LTRIM(RTRIM(ISNULL(SourceFile, '')))) LIKE '%.pdf'"
                    : "LOWER(TRIM(COALESCE(SourceFile, ''))) LIKE '%.pdf'";

                $pdfQuery = DB::table('PatientHeader')->whereRaw($pdfPredicate);

                if (!$columnAdded || $driver === 'sqlsrv') {
                    $pdfQuery->whereNull('IngestionSource');
                }

                $pdfQuery->update(['IngestionSource' => 'pdf']);
            }

            DB::table('PatientHeader')
                ->whereNull('IngestionSource')
                ->update(['IngestionSource' => 'excel']);
        });

        if ($driver === 'sqlsrv') {
            DB::statement("ALTER TABLE [PatientHeader] ALTER COLUMN [IngestionSource] NVARCHAR(20) NOT NULL;");

            $existingDefault = DB::selectOne(
                "SELECT dc.name
                 FROM sys.default_constraints dc
                 INNER JOIN sys.columns c
                     ON dc.parent_object_id = c.object_id
                     AND dc.parent_column_id = c.column_id
                 WHERE dc.parent_object_id = OBJECT_ID(N'PatientHeader')
                   AND c.name = N'IngestionSource'"
            );

            if (!$existingDefault) {
                DB::statement(
                    "ALTER TABLE [PatientHeader] ADD CONSTRAINT [" . self::DEFAULT_CONSTRAINT_NAME . "] DEFAULT (N'excel') FOR [IngestionSource];"
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('PatientHeader') || !Schema::hasColumn('PatientHeader', 'IngestionSource')) {
            return;
        }

        if (DB::getDriverName() === 'sqlsrv') {
            $constraints = DB::select(
                "SELECT dc.name
                 FROM sys.default_constraints dc
                 INNER JOIN sys.columns c
                     ON dc.parent_object_id = c.object_id
                     AND dc.parent_column_id = c.column_id
                 WHERE dc.parent_object_id = OBJECT_ID(N'PatientHeader')
                   AND c.name = N'IngestionSource'"
            );

            foreach ($constraints as $constraint) {
                $escapedName = str_replace(']', ']]', (string) $constraint->name);
                DB::statement("ALTER TABLE [PatientHeader] DROP CONSTRAINT [{$escapedName}];");
            }
        }

        Schema::table('PatientHeader', function (Blueprint $table) {
            $table->dropColumn('IngestionSource');
        });
    }
};
