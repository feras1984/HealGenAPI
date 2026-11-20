export type DocumentViewerMode = 'employee' | 'inspector' | 'supervisor' | 'readOnly';

export interface DocumentItem {
    id?: number | string;
    name: string;
    url: string;             // Remote storage URL or local Object URL
    downloadUrl?: string;    // Direct streaming endpoint (/tests/{id}/file/download)
    isImage: boolean;
    mimeType?: string;
    createdAt?: string;
    fileObject?: File;       // Local File object if in pre-upload staging state
}

export interface DocumentViewerProps {
    open: boolean;
    onClose: () => void;
    document: DocumentItem | null;
    mode?: DocumentViewerMode;
    onUpload?: (file: File) => Promise<void>;
    onDelete?: () => void | Promise<void>;
    onDownload?: () => void;
    uploading?: boolean;
}
