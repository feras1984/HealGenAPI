import React from 'react';
import { Alert, Button } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppSelector } from "@/Redux/Store/hook";
import { useTranslation } from "react-i18next";

interface QueueDelayBannerProps {
    delayedCount: number;
    thresholdHours?: number;
    showDelayedOnly: boolean;
    onToggleDelayedOnly: () => void;
}

const QueueDelayBanner: React.FC<QueueDelayBannerProps> = ({
    delayedCount,
    thresholdHours = 48,
    showDelayedOnly,
    onToggleDelayedOnly,
}) => {
    const { t, i18n } = useTranslation();
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';

    if (delayedCount === 0 && !showDelayedOnly) {
        return null;
    }

    return (
        <Alert
            severity="warning"
            icon={<ScheduleIcon fontSize="inherit" />}
            dir={isRtl ? 'rtl' : 'ltr'}
            sx={{ mb: 2, borderRadius: 2, alignItems: 'center' }}
            action={
                <Button
                    color="inherit"
                    size="small"
                    variant={showDelayedOnly ? 'contained' : 'outlined'}
                    onClick={onToggleDelayedOnly}
                    sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                    {showDelayedOnly
                        ? (t('delay.showAllTests') || 'Show All')
                        : (t('delay.showDelayedOnly') || 'Show Delayed Only')}
                </Button>
            }
        >
            {t('delay.queueBannerMessage', { count: delayedCount, hours: thresholdHours }) ||
                `${delayedCount} test(s) exceeded the ${thresholdHours}-hour delay threshold between workflow stages.`}
        </Alert>
    );
};

export default QueueDelayBanner;
