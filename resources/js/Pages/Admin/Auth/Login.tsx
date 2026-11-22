import React from 'react';
import { Head } from "@inertiajs/react";
import AuthAdminLayout from "@/Layouts/Admin/AuthAdminLayout";
import { Box, Card, CardContent, Paper, Typography } from "@mui/material";
import LoginForm from "@/Pages/Admin/Auth/Partials/LoginForm";
import { PageProps } from "@/types";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/Redux/Store/hook";

const Login = ({ status, canResetPassword }: PageProps<{ status?: string, canResetPassword: boolean }>) => {
    const { t } = useTranslation();
    const dark = useAppSelector(state => state.theme.dark);

    return (
        <AuthAdminLayout>
            <Head title={t('auth.signIn') || "Login"}></Head>
            <Box className="flex justify-center w-full">
                <Paper
                    elevation={3}
                    className="register-paper w-full"
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        ...(dark
                            ? {
                                  border: '1px solid rgba(0, 168, 107, 0.3)',
                                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                              }
                            : {}),
                    }}
                >
                    <Card sx={{ margin: 'auto', boxShadow: 'none' }}>
                        <Box
                            component="div"
                            className="p-5 flex flex-col items-center gap-3 w-full border-b"
                            sx={{ borderColor: 'divider' }}
                        >
                            <Box
                                className="flex justify-center items-center gap-4"
                                sx={
                                    dark
                                        ? {
                                              backgroundColor: 'rgba(255, 255, 255, 0.96)',
                                              px: 2.5,
                                              py: 1.25,
                                              borderRadius: 2,
                                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                                          }
                                        : { width: '100%' }
                                }
                            >
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
