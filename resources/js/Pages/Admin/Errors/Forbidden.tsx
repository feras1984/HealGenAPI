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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";

interface ForbiddenProps {
    status?: number;
    title?: string;
    message?: string;
    support?: string;
}

const Forbidden: React.FC<ForbiddenProps> = ({
    status = 403,
    title = "Access Restricted",
    message = "You don't have permission to access this page or the requested resource.",
    support = "Please contact your administrator if you believe this is a mistake.",
}) => {
    const pageProps = usePage().props as any;
    const user = pageProps?.auth?.user || pageProps?.user;

    // The root route ('/') automatically resolves to the role-appropriate dashboard
    const dashboardUrl = "/";

    const errorCard = (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: { xs: 4, sm: 8 },
                px: 2,
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
                    {/* Security Restriction Icon */}
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
                                    ? "rgba(239, 68, 68, 0.18)"
                                    : "rgba(239, 68, 68, 0.1)",
                            color: "error.main",
                        }}
                    >
                        <LockOutlinedIcon sx={{ fontSize: 46 }} />
                    </Box>

                    {/* HTTP Status Code Badge */}
                    <Chip
                        label={`HTTP ${status}`}
                        color="error"
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
                        {title}
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
                        {message}
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
                        {support}
                    </Typography>

                    {/* Primary Action Button */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        sx={{ width: "100%", justifyContent: "center" }}
                    >
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
                            Back to Dashboard
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );

    if (!user) {
        return (
            <AppRoot>
                <Head title={`${status} - ${title}`} />
                <Box
                    sx={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.default",
                        p: 2,
                    }}
                >
                    {errorCard}
                </Box>
            </AppRoot>
        );
    }

    return (
        <AdminLayout>
            <Head title={`${status} - ${title}`} />
            {errorCard}
        </AdminLayout>
    );
};

export default Forbidden;
