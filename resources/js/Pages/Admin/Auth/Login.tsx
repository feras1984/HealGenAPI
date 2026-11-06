import React from 'react';
import styles from "./styles.module.scss";
import {Head} from "@inertiajs/react";
import AuthAdminLayout from "@/Layouts/Admin/AuthAdminLayout";
import {Box, Card, CardContent, Paper, Typography} from "@mui/material";
import LoginForm from "@/Pages/Admin/Auth/Partials/LoginForm";
import {PageProps} from "@/types";

const Login = ({ status, canResetPassword }: PageProps<{ status?: string, canResetPassword: boolean }>) => {
    const logo = `${window.location.origin}/file/logo`;
    return (
        <AuthAdminLayout>
            <Head title="Login"></Head>
            <Box className="flex justify-center">
                <Paper elevation={3} className="register-paper">
                    <Card sx={{margin: 'auto', boxShadow: 'none'}}>
                        <Box
                            component="div"
                            className="p-4 flex flex-col items-start gap-3 w-full"
                        >
                            <Box className="flex justify-start items-center gap-4 w-full">
                                <img
                                    src="/images/logo-1.png"
                                    alt="Logo 1"
                                    style={{ maxHeight: '55px', width: 'auto', objectFit: 'contain' }}
                                />
                                <img
                                    src="/images/logo-2.png"
                                    alt="Logo 2"
                                    style={{ maxHeight: '55px', width: 'auto', objectFit: 'contain' }}
                                />
                                <Typography sx={{margin: 'auto'}} variant="h5"><strong>Log In</strong></Typography>
                            </Box>
                        </Box>

                        <CardContent>
                            <LoginForm status={status} canResetPassword={canResetPassword}/>
                        </CardContent>

                    </Card>
                </Paper>
            </Box>
        </AuthAdminLayout>
    );
};

export default Login;
