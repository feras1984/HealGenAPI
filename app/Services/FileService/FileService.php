<?php

namespace App\Services\FileService;

use App\Models\File;
use Illuminate\Support\Facades\Storage;

class FileService
{
    public function mapFileModel(File $file): array
    {
        return [
            'id' => $file->id,
            'name' => $file->name,
            'description' => $file->description,
            'url' => $file->url,
            'order' => $file->order,
            'isActive' => $file->is_active,
            'isCover' => $file->is_cover,
            'isImage' => $file->is_image,
        ];
    }
    public function storeFile(&$data, $property, $container): ?string
    {
        $file = $data[$property];

//        dd([
//            'temp_path' => $file->getPathname(),
//            'file_exists' => file_exists($file->getPathname()),
//            'file_readable' => is_readable($file->getPathname()),
//            'realpath' => realpath($file->getPathname()),
//            'storage_writable' => is_writable(storage_path('app/public/users')),
//            'temp_writable' => is_writable(sys_get_temp_dir()),
//            'temp_directory' => sys_get_temp_dir(),
//        ]);

//        dd([
//            'php_version' => PHP_VERSION,
//            'php_ini' => php_ini_loaded_file(),
//            'upload_tmp_dir' => ini_get('upload_tmp_dir'),
//            'sys_temp_dir' => ini_get('sys_temp_dir'),
//            'temp_directory' => sys_get_temp_dir(),
//            'temp_file' => $data[$property]->getPathname(),
//        ]);


        if ($data[$property] === 'null') return null;
        $imageName = $container . "-" . uniqid() . '.' . $data[$property]->getClientOriginalExtension();

        Storage::disk('public')->putFileAs($container, $data[$property], $imageName);
        $data[$property] = $imageName;
        return $imageName;
    }

    public function deleteFile($fileName, $container): void
    {
        Storage::disk('public')->delete($container . '/' . $fileName);
    }
}
