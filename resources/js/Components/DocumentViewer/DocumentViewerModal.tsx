import React, { useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    CircularProgress,
    Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import { DocumentViewerProps } from './Interfaces/DocumentViewerTypes';
import PdfViewerStrategy from './Strategies/PdfViewerStrategy';
import ImageViewerStrategy from './Strategies/ImageViewerStrategy';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/Redux/Store/hook';

export const DocumentViewerModal: React.FC<DocumentViewerProps> = ({
    open,
    onClose,
    document,
    mode = 'readOnly',
    onUpload,
    onDelete,
    onDownload,
    uploading = false
}) => {
    const { t, i18n } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!document) return null;

    const isEmployee = mode === 'employee';
    const isPreUploadStaging = Boolean(document.fileObject && onUpload);
    const downloadUrl = document.downloadUrl || (document.id ? `/tests/${document.id}/file/download` : document.url);

    const handleReplaceClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleConfirmUpload = () => {
        if (document.fileObject && onUpload) {
            onUpload(document.fileObject);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            dir={isRtl ? 'rtl' : 'ltr'}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    backgroundColor: dark ? '#1e293b' : '#ffffff',
                    backgroundImage: 'none',
                    direction: isRtl ? 'rtl' : 'ltr',
                    textAlign: isRtl ? 'right' : 'left',
                    maxHeight: '92vh',
                }
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    p: 2.5,
                    borderBottom: '1px solid',
                    borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    direction: isRtl ? 'rtl' : 'ltr',
                }}
            >
                {/* Left: Document Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: document.isImage ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: document.isImage ? 'primary.main' : 'error.main',
                            flexShrink: 0,
                        }}
                    >
                        {document.isImage ? <ImageIcon /> : <PictureAsPdfIcon />}
                    </Box>

                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ fontSize: '1.05rem' }}>
                                {document.name}
                            </Typography>
                            <Chip
                                label={document.isImage ? (t('tests.imageDocument') || 'Image') : (t('tests.pdfDocument') || 'PDF')}
                                size="small"
                                color={document.isImage ? 'primary' : 'error'}
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                            />
                            {isPreUploadStaging && (
                                <Chip
                                    label={t('documentViewer.previewBeforeUpload') || 'Ready to Upload'}
                                    size="small"
                                    color="warning"
                                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                                />
                            )}
                        </Box>
                        {document.createdAt && (
                            <Typography variant="caption" color="text.secondary">
                                {t('tests.uploaded') || 'Uploaded'}: {document.createdAt}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Right: Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Pre-upload confirmation buttons for Employee */}
                    {isPreUploadStaging ? (
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={handleConfirmUpload}
                            disabled={uploading}
                            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            {uploading ? (t('common.loading') || 'Uploading...') : (t('documentViewer.confirmUpload') || 'Confirm Upload')}
                        </Button>
                    ) : (
                        <>
                            {/* Universal Download Button (Unless it's an unpersisted local file) */}
                            {!document.fileObject && (
                                <Button
                                    component="a"
                                    href={downloadUrl}
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    startIcon={<DownloadIcon />}
                                    onClick={onDownload}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                                >
                                    {t('common.download') || 'Download'}
                                </Button>
                            )}

                            {/* Employee-Only Replace & Delete Controls */}
                            {isEmployee && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileInputChange}
                                    />
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="secondary"
                                        disabled={uploading}
                                        onClick={handleReplaceClick}
                                        startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                                        sx={{ textTransform: 'none', borderRadius: 2 }}
                                    >
                                        {uploading ? (t('common.loading') || 'Uploading...') : (t('common.replace') || 'Replace')}
                                    </Button>

                                    {onDelete && (
                                        <Tooltip title={t('tests.removeDocument') || 'Remove document'}>
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={onDelete}
                                                disabled={uploading}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', ml: 0.5 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            {/* Viewer Body (Strategy Dispatcher) */}
            <DialogContent
                dividers
                sx={{
                    p: { xs: 1.5, md: 3 },
                    backgroundColor: dark ? '#0f172a' : '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: { xs: 450, md: 620 },
                }}
            >
                {document.isImage ? (
                    <ImageViewerStrategy document={document} />
                ) : (
                    <PdfViewerStrategy document={document} downloadUrl={downloadUrl} />
                )}
            </DialogContent>

            {/* Footer */}
            <DialogActions
                sx={{
                    px: 3,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    direction: isRtl ? 'rtl' : 'ltr',
                    justifyContent: isRtl ? 'flex-start' : 'flex-end',
                }}
            >
                <Button onClick={onClose} variant="text" color="inherit" sx={{ textTransform: 'none' }}>
                    {t('common.close') || 'Close'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DocumentViewerModal;
