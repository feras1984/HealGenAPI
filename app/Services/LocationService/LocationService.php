<?php

namespace App\Services\LocationService;

use App\Models\Location;
use Carbon\Carbon;

class LocationService
{
    public function mapLocationModel(Location $location): array
    {
        return [
            'id' => $location->id,
            'name' => $location->name,
            'code' => $location->code,
            'address' => $location->address ?? '',
            'city' => $location->city ?? '',
            'country' => $location->country ?? '',
            'isActive' => (bool) $location->is_active,
            'notes' => $location->notes ?? '',
            'createdAt' => $location->created_at ? Carbon::make($location->created_at)->format('M d, Y') : '',
        ];
    }

    public function getLocations(): array
    {
        $locations = Location::query()->orderBy('id', 'desc')->get();
        $list = [];
        foreach ($locations as $location) {
            $list[] = $this->mapLocationModel($location);
        }

        return $list;
    }

    public function getLocation(Location $location): array
    {
        return $this->mapLocationModel($location);
    }

    public function store(array $data): Location
    {
        $location = new Location();
        $location->fill([
            'name' => $data['name'],
            'code' => $data['code'],
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'country' => $data['country'] ?? null,
            'is_active' => filter_var($data['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notes' => $data['notes'] ?? null,
        ]);
        $location->save();

        return $location;
    }

    public function update(array $data, Location $location): Location
    {
        $location->fill([
            'name' => $data['name'],
            'code' => $data['code'],
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'country' => $data['country'] ?? null,
            'is_active' => filter_var($data['isActive'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notes' => $data['notes'] ?? null,
        ]);
        $location->save();

        return $location;
    }

    public function toggleActive(Location $location): Location
    {
        $location->is_active = !$location->is_active;
        $location->save();

        return $location;
    }

    public function validateCode(string $code, ?int $ignoreId = null): ?Location
    {
        $query = Location::query()->where('code', $code);
        if ($ignoreId && $ignoreId > 0) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->first();
    }
}
