<?php

namespace App\Facades\FileService;


use App\Models\File;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapFileModel(File $file)
 * @method static string storeFile(&$data, $property, $container)
 * @method static void deleteFile($fileName, $container)
 */
class FileService extends Facade
{
    protected static function getFacadeAccessor(): string
    { return 'FileService'; }
}
