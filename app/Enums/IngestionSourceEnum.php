<?php

namespace App\Enums;

enum IngestionSourceEnum: string
{
    case EXCEL = 'excel';
    case PDF = 'pdf';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return [
            self::EXCEL->value,
            self::PDF->value,
        ];
    }

    public static function tryFromNormalized(?string $value): ?self
    {
        if ($value === null) {
            return null;
        }

        $normalized = strtolower(trim($value));

        return $normalized !== '' ? self::tryFrom($normalized) : null;
    }

    public function allowsEmployeeAttachmentManagement(): bool
    {
        return $this === self::EXCEL;
    }
}
