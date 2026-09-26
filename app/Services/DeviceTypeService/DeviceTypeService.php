<?php

namespace App\Services\DeviceTypeService;

use App\Models\DeviceType;
use Carbon\Carbon;

class DeviceTypeService
{
    public function mapDeviceTypeModel(DeviceType $deviceType): array
    {
        return [
            'id' => $deviceType->id,
            'name' => $deviceType->name,
            'manufacturer' => $deviceType->manufacturer ?? '',
            'model' => $deviceType->model ?? '',
            'description' => $deviceType->description ?? '',
            'isActive' => (bool) $deviceType->is_active,
            'createdAt' => $deviceType->created_at ? Carbon::make($deviceType->created_at)->format('M d, Y') : '',
        ];
    }

    public function getDeviceTypes(): array
    {
        $types = DeviceType::query()->orderBy('id', 'desc')->get();
        $list = [];
        foreach ($types as $type) {
            $list[] = $this->mapDeviceTypeModel($type);
        }

        return $list;
    }

    public function getDeviceType(DeviceType $deviceType): array
    {
        return $this->mapDeviceTypeModel($deviceType);
    }

    public function store(array $data): DeviceType
    {
        $deviceType = new DeviceType();
        $deviceType->fill([
            'name' => $data['name'],
            'manufacturer' => $data['manufacturer'] ?? null,
            'model' => $data['model'] ?? null,
            'description' => $data['description'] ?? null,
            'is_active' => filter_var($data['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN),
        ]);
        $deviceType->save();

        return $deviceType;
    }

    public function update(array $data, DeviceType $deviceType): DeviceType
    {
        $deviceType->fill([
            'name' => $data['name'],
            'manufacturer' => $data['manufacturer'] ?? null,
            'model' => $data['model'] ?? null,
            'description' => $data['description'] ?? null,
            'is_active' => filter_var($data['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN),
        ]);
        $deviceType->save();

        return $deviceType;
    }

    public function toggleActive(DeviceType $deviceType): DeviceType
    {
        $deviceType->is_active = !$deviceType->is_active;
        $deviceType->save();

        return $deviceType;
    }
}
