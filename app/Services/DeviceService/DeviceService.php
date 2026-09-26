<?php

namespace App\Services\DeviceService;

use App\Models\Device;
use Carbon\Carbon;

class DeviceService
{
    public function mapDeviceModel(Device $device): array
    {
        $location = $device->location;
        $deviceType = $device->deviceType;

        return [
            'id' => $device->id,
            'locationId' => $device->location_id,
            'deviceTypeId' => $device->device_type_id,
            'locationName' => $location ? $location->name : '',
            'deviceTypeName' => $deviceType ? $deviceType->name : '',
            'name' => $device->name,
            'deviceCode' => $device->device_code,
            'serialNumber' => $device->serial_number ?? '',
            'ipAddress' => $device->ip_address ?? '',
            'isActive' => (bool) $device->is_active,
            'lastSeenAt' => $device->last_seen_at ? Carbon::make($device->last_seen_at)->format('M d, Y H:i') : '',
            'activatedAt' => $device->activated_at ? Carbon::make($device->activated_at)->format('M d, Y H:i') : '',
            'deactivatedAt' => $device->deactivated_at ? Carbon::make($device->deactivated_at)->format('M d, Y H:i') : '',
            'notes' => $device->notes ?? '',
            'createdAt' => $device->created_at ? Carbon::make($device->created_at)->format('M d, Y') : '',
        ];
    }

    public function getDevices(): array
    {
        $devices = Device::with(['location', 'deviceType'])->orderBy('id', 'desc')->get();
        $list = [];
        foreach ($devices as $device) {
            $list[] = $this->mapDeviceModel($device);
        }

        return $list;
    }

    public function getDevice(Device $device): array
    {
        $device->load(['location', 'deviceType']);
        return $this->mapDeviceModel($device);
    }

    public function store(array $data): Device
    {
        $isActive = filter_var($data['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN);

        $device = new Device();
        $device->fill([
            'location_id' => $data['locationId'],
            'device_type_id' => $data['deviceTypeId'],
            'name' => $data['name'],
            'device_code' => $data['deviceCode'],
            'serial_number' => $data['serialNumber'] ?? null,
            'ip_address' => $data['ipAddress'] ?? null,
            'is_active' => $isActive,
            'activated_at' => $isActive ? now() : null,
            'deactivated_at' => !$isActive ? now() : null,
            'notes' => $data['notes'] ?? null,
        ]);
        $device->save();

        return $device;
    }

    public function update(array $data, Device $device): Device
    {
        $isActive = filter_var($data['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $wasActive = (bool) $device->is_active;

        $activatedAt = $device->activated_at;
        $deactivatedAt = $device->deactivated_at;

        if ($isActive && !$wasActive) {
            $activatedAt = now();
        } elseif (!$isActive && $wasActive) {
            $deactivatedAt = now();
        }

        $device->fill([
            'location_id' => $data['locationId'],
            'device_type_id' => $data['deviceTypeId'],
            'name' => $data['name'],
            'device_code' => $data['deviceCode'],
            'serial_number' => $data['serialNumber'] ?? null,
            'ip_address' => $data['ipAddress'] ?? null,
            'is_active' => $isActive,
            'activated_at' => $activatedAt,
            'deactivated_at' => $deactivatedAt,
            'notes' => $data['notes'] ?? null,
        ]);
        $device->save();

        return $device;
    }

    public function toggleActive(Device $device): Device
    {
        $device->is_active = !$device->is_active;
        if ($device->is_active) {
            $device->activated_at = now();
        } else {
            $device->deactivated_at = now();
        }
        $device->save();

        return $device;
    }

    public function validateCode(string $deviceCode, ?int $ignoreId = null): ?Device
    {
        $query = Device::query()->where('device_code', $deviceCode);
        if ($ignoreId && $ignoreId > 0) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->first();
    }
}
