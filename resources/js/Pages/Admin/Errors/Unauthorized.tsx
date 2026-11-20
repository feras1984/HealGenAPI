import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import AppRoot from "@/AppRoot";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from "@mui/material";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LoginIcon from "@mui/icons-material/Login";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

interface UnauthorizedProps {
    status?: number;
    title?: string;
    message?: string;
    support?: string;
}

const Unauthorized: React.FC<UnauthorizedProps> = ({
    status = 401,
    title = "Unauthorized Access",
    message = "Authentication is required to access this page or the requested resource.",
    support = "Please sign in with valid credentials, or contact your administrator.",
}) => {
    const { t, i18n } = useTranslation();
    const pageProps = usePage().props as any;
    const user = pageProps?.auth?.user || pageProps?.user;
    const direction = useAppSelector(state => state.languages.direction);
    const currentLang = useAppSelector(state => state.languages.language);
    const isRtl = direction === 'rtl' || currentLang === 'ar' || i18n.language === 'ar';
    const activeLang = isRtl ? 'ar' : 'en';

    const dashboardUrl = `/${activeLang}`;
    const loginUrl = `/${activeLang}/login`;

    const displayTitle = (title && title !== "Unauthorized Access") ? title : t('errors.unauthorizedTitle');
    const displayMessage = (message && message !== "Authentication is required to access this page or the requested resource.") ? message : t('errors.unauthorizedMessage');
    const displaySupport = (support && support !== "Please sign in with valid credentials, or contact your administrator.") ? support : t('errors.unauthorizedSupport');

    const errorCard = (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: { xs: 4, sm: 8 },
                px: 2,
                direction: isRtl ? 'rtl' : 'ltr',
            }}
        >
            <Card
                elevation={3}
                sx={{
                    maxWidth: 580,
                    width: "100%",
                    borderRadius: 3,
                    textAlign: "center",
                    p: { xs: 2.5, sm: 4.5 },
                    border: (theme) =>
                        theme.palette.mode === "dark"
                            ? "1px solid rgba(255, 255, 255, 0.08)"
                            : "1px solid rgba(0, 0, 0, 0.06)",
                    boxShadow: (theme) =>
                        theme.palette.mode === "dark"
                            ? "0 12px 36px rgba(0, 0, 0, 0.6)"
                            : "0 12px 36px rgba(0, 0, 0, 0.08)",
                }}
            >
                <CardContent
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        p: 0,
                        "&:last-child": { pb: 0 },
                    }}
                >
                    {/* Security Key / Lock Icon */}
                    <Box
                        sx={{
                            width: 88,
                            height: 88,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 2.5,
                            backgroundColor: (theme) =>
                                theme.palette.mode === "dark"
                                    ? "rgba(237, 108, 2, 0.18)"
                                    : "rgba(237, 108, 2, 0.1)",
                            color: "warning.main",
                        }}
                    >
                        <VpnKeyOutlinedIcon sx={{ fontSize: 46 }} />
                    </Box>

                    {/* HTTP Status Code Badge */}
                    <Chip
                        label={`${t('errors.httpStatus') || 'HTTP'} ${status}`}
                        color="warning"
                        size="small"
                        variant="outlined"
                        sx={{
                            fontWeight: 700,
                            letterSpacing: 1.2,
                            textTransform: "uppercase",
                            mb: 2,
                            px: 1,
                        }}
                    />

                    {/* Title */}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            mb: 1.5,
                            color: "text.primary",
                            fontSize: { xs: "1.5rem", sm: "1.875rem" },
                        }}
                    >
                        {displayTitle}
                    </Typography>

                    {/* Primary Message */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: "text.secondary",
                            mb: 1.5,
                            maxWidth: 460,
                            lineHeight: 1.6,
                            fontSize: { xs: "0.95rem", sm: "1.05rem" },
                        }}
                    >
                        {displayMessage}
                    </Typography>

                    {/* Supporting Text */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            opacity: 0.85,
                            mb: 4,
                            maxWidth: 440,
                            lineHeight: 1.5,
                        }}
                    >
                        {displaySupport}
                    </Typography>

                    {/* Action Buttons */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ width: "100%", justifyContent: "center" }}
                    >
                        {user ? (
                            <Button
                                component={Link}
                                href={dashboardUrl}
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<DashboardIcon />}
                                sx={{
                                    px: 4,
                                    py: 1.25,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    minWidth: 200,
                                }}
                            >
                                {t('errors.backToDashboard') || "Back to Dashboard"}
                            </Button>
                        ) : (
                            <Button
                                component={Link}
                                href={loginUrl}
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<LoginIcon />}
                                sx={{
                                    px: 4,
                                    py: 1.25,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    minWidth: 200,
                                }}
                            >
                                {t('errors.signIn') || "Sign In"}
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );

    if (!user) {
        return (
            <AppRoot>
                <Head title={`${status} - ${displayTitle}`} />
                <Box
                    sx={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.default",
                        p: 2,
                        direction: isRtl ? 'rtl' : 'ltr',
                    }}
                >
                    {errorCard}
                </Box>
            </AppRoot>
        );
    }

    return (
        <AdminLayout>
            <Head title={`${status} - ${displayTitle}`} />
            {errorCard}
        </AdminLayout>
    );
};

export default Unauthorized;
