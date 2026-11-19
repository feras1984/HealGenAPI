import React from 'react';
import { Head } from "@inertiajs/react";
import AuthAdminLayout from "@/Layouts/Admin/AuthAdminLayout";
import { Box, Card, CardContent, Paper, Typography } from "@mui/material";
import LoginForm from "@/Pages/Admin/Auth/Partials/LoginForm";
import { PageProps } from "@/types";
import { useTranslation } from "react-i18next";

const Login = ({ status, canResetPassword }: PageProps<{ status?: string, canResetPassword: boolean }>) => {
    const { t } = useTranslation();

    return (
        <AuthAdminLayout>
            <Head title={t('auth.signIn') || "Login"}></Head>
            <Box className="flex justify-center w-full">
                <Paper elevation={3} className="register-paper w-full" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    <Card sx={{ margin: 'auto', boxShadow: 'none' }}>
                        <Box
                            component="div"
                            className="p-5 flex flex-col items-center gap-3 w-full border-b"
                            sx={{ borderColor: 'divider' }}
                        >
                            <Box className="flex justify-center items-center gap-4 w-full">
                                <img
                                    src="/images/logo-1.png"
                                    alt="Logo 1"
                                    style={{ maxHeight: '50px', width: 'auto', objectFit: 'contain' }}
                                />
                                <img
                                    src="/images/logo-2.png"
                                    alt="Logo 2"
                                    style={{ maxHeight: '50px', width: 'auto', objectFit: 'contain' }}
                                />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mt: 1, textAlign: 'center' }}>
                                {t('auth.signIn') || 'Sign In'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                {t('auth.loginSubtitle') || 'Access HealGen Clinical Diagnostic System'}
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 4 }}>
                            <LoginForm status={status} canResetPassword={canResetPassword} />
                        </CardContent>
                    </Card>
                </Paper>
            </Box>
        </AuthAdminLayout>
    );
};

export default Login;
