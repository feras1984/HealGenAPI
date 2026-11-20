import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Paper, CircularProgress } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { DocumentItem } from '../Interfaces/DocumentViewerTypes';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/Redux/Store/hook';

interface ImageViewerStrategyProps {
    document: DocumentItem;
}

export const ImageViewerStrategy: React.FC<ImageViewerStrategyProps> = ({ document }) => {
    const { t } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);

    const [scale, setScale] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.4));
    const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
    const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);
    const handleReset = () => {
        setScale(1);
        setRotation(0);
    };

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Interactive Control Floating Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Paper
                    elevation={2}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 3,
                        backgroundColor: dark ? '#1e293b' : '#ffffff',
                        border: '1px solid',
                        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }}
                >
                    <Tooltip title={t('documentViewer.zoomIn') || "Zoom In"}>
                        <span>
                            <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 3.5} color="primary">
                                <ZoomInIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Typography variant="caption" sx={{ minWidth: 42, textAlign: 'center', fontWeight: 600, color: 'text.secondary' }}>
                        {Math.round(scale * 100)}%
                    </Typography>

                    <Tooltip title={t('documentViewer.zoomOut') || "Zoom Out"}>
                        <span>
                            <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.4} color="primary">
                                <ZoomOutIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Box sx={{ width: '1px', height: 20, backgroundColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', mx: 0.5 }} />

                    <Tooltip title={t('documentViewer.rotateLeft') || "Rotate Left 90°"}>
                        <IconButton size="small" onClick={handleRotateLeft} color="primary">
                            <RotateLeftIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={t('documentViewer.rotateRight') || "Rotate Right 90°"}>
                        <IconButton size="small" onClick={handleRotateRight} color="primary">
                            <RotateRightIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Box sx={{ width: '1px', height: 20, backgroundColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', mx: 0.5 }} />

                    <Tooltip title={t('documentViewer.resetView') || "Reset View"}>
                        <IconButton size="small" onClick={handleReset} color="secondary">
                            <RestartAltIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Paper>
            </Box>

            {/* Viewport Canvas */}
            <Box
                sx={{
                    flexGrow: 1,
                    position: 'relative',
                    minHeight: { xs: 400, md: 580 },
                    maxHeight: '70vh',
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: dark ? '#0b1120' : '#f1f5f9',
                    borderRadius: 2,
                    p: 2,
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            backgroundColor: dark ? 'rgba(11,17,32,0.8)' : 'rgba(241,245,249,0.8)',
                        }}
                    >
                        <CircularProgress size={36} color="primary" />
                    </Box>
                )}

                <img
                    src={document.url}
                    alt={document.name}
                    onLoad={() => setLoading(false)}
                    onError={() => setLoading(false)}
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        maxWidth: '100%',
                        maxHeight: '65vh',
                        objectFit: 'contain',
                        borderRadius: 6,
                        boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                />
            </Box>
        </Box>
    );
};

export default ImageViewerStrategy;
