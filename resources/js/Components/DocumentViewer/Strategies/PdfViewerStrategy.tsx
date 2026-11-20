import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { DocumentItem } from '../Interfaces/DocumentViewerTypes';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/Redux/Store/hook';

interface PdfViewerStrategyProps {
    document: DocumentItem;
    downloadUrl?: string;
}

export const PdfViewerStrategy: React.FC<PdfViewerStrategyProps> = ({ document, downloadUrl }) => {
    const { t } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);
    const [loading, setLoading] = useState(true);

    const pdfSrc = document.url.includes('#') ? document.url : `${document.url}#toolbar=1&navpanes=0`;
    const targetDownload = downloadUrl || document.downloadUrl || document.url;

    useEffect(() => {
        // Fallback timer: Chromium/Firefox PDF plugin frames do not reliably dispatch standard DOM load events.
        // Dismiss loading overlay after 1200ms so the viewer and toolbar are always accessible.
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [pdfSrc]);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Quick Action Top Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                <Button
                    size="small"
                    component="a"
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                >
                    {t('documentViewer.openNewTab') || 'Open in New Tab'}
                </Button>
                <Button
                    size="small"
                    component="a"
                    href={targetDownload}
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon fontSize="small" />}
                >
                    {t('common.download') || 'Download PDF'}
                </Button>
            </Box>

            {/* PDF Embedded Container */}
            <Box
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    minHeight: { xs: 450, md: 620 },
                    backgroundColor: dark ? '#0f172a' : '#f8fafc',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }}
            >
                {loading && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            backgroundColor: dark ? 'rgba(15,23,42,0.85)' : 'rgba(248,250,252,0.85)',
                            pointerEvents: 'none',
                        }}
                    >
                        <CircularProgress size={40} color="primary" />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            {t('documentViewer.loadingPdf') || 'Loading PDF document...'}
                        </Typography>
                    </Box>
                )}

                <iframe
                    src={pdfSrc}
                    title={document.name}
                    width="100%"
                    height="100%"
                    style={{ minHeight: '620px', display: 'block', border: 'none', width: '100%' }}
                    onLoad={() => setLoading(false)}
                />
            </Box>
        </Box>
    );
};

export default PdfViewerStrategy;
