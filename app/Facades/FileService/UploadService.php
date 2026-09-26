<?php

namespace App\Facades\FileService;

use App\Models\File;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array mapFileModel(File $file)
 * @method static void deleteFile(int $id, string $container)
 * @method static string storeFile($data, $reference, $id, $order = 0)
 * @method static array saveFile(array $data, string $url = 'url', string $container = 'uploads')
 * @method static array updateFile($id, $url = 'url', $container = 'uploads')
 */
class UploadService extends Facade
{
    protected static function getFacadeAccessor(): string
    { return 'UploadService'; }
}
