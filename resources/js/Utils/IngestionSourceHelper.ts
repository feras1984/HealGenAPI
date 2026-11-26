export type IngestionSource = 'excel' | 'pdf';

export interface IngestionSourceAware {
    ingestionSource?: string | null;
    canManageAttachment?: boolean | null;
}

/**
 * Normalize the authoritative backend ingestion source.
 * Defaults missing/legacy values to 'excel' without inferring from attachment existence.
 */
export function normalizeIngestionSource(value?: string | null): IngestionSource {
    if (typeof value === 'string' && value.trim().toLowerCase() === 'pdf') {
        return 'pdf';
    }

    return 'excel';
}

export function isPdfIngestedTest(patient?: IngestionSourceAware | null): boolean {
    return normalizeIngestionSource(patient?.ingestionSource) === 'pdf';
}

/**
 * Determine whether the current user can upload, replace, or remove a test attachment.
 * Strictly requires the Employee role AND an Excel-ingested (non-PDF) test record.
 * Backend authorization enforces the exact same rule independently.
 */
export function canEmployeeManageTestAttachment(
    userRole?: string | null,
    patient?: IngestionSourceAware | null
): boolean {
    const normalizedRole = String(userRole || '').trim().toLowerCase();
    if (normalizedRole !== 'employee') {
        return false;
    }

    if (isPdfIngestedTest(patient)) {
        return false;
    }

    if (patient?.canManageAttachment === false) {
        return false;
    }

    return true;
}

export function resolveDocumentViewerMode(
    userRole?: string | null,
    patient?: IngestionSourceAware | null
): 'employee' | 'readOnly' {
    return canEmployeeManageTestAttachment(userRole, patient) ? 'employee' : 'readOnly';
}
