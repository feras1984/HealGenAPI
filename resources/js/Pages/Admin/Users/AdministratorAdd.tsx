import React from 'react';
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import {Head, Link} from "@inertiajs/react";
import {Container} from "typedi";
import "reflect-metadata";
import AdminService from "@/Services/UserService/AdminService";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import {z} from "zod";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Box, Breadcrumbs, FormHelperText, Stack, Typography} from "@mui/material";
import ValidatedImage from "@/Components/ValidatedComponents/ValidatedImage";
import ValidatedCheckbox from "@/Components/ValidatedComponents/ValidatedCheckbox";
import CustomButton from "@/Components/Button/CustomButton";
import AdminRoleEnum from "@/Enums/AdminRoleEnum";
import ValidatedSelect from "@/Components/ValidatedComponents/ValidatedSelect";
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";
import {Visibility, VisibilityOff } from '@mui/icons-material';

const AdministratorAdd = () => {
    const adminService = Container.get(AdminService);
    const roles = Object.entries(AdminRoleEnum).map(([key, value]) => ({
        id: key,
        name: value,
    }));

    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================

    const blockSchema = z.object({
        firstName: z.string().min(3, {message: 'First Name should be at least 3 characters!'}),
        lastName: z.string().min(3, {message: 'Last Name should be at least 3 characters!'}),
        email: z.string()
            .email('Please enter valid email address!')
            .refine(
                async (email) => {
                    const response = await adminService.validateEmail(email);
                    return response.data.status;
                },
                {message: 'Email address already exists!'}
            )
        ,

        pwSchema: z.object({
            password: z
                .string()
                .min(12, "Password must be at least 12 characters")
                .regex(/[a-z]/, "Password must contain at least one lowercase letter")
                .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
                .regex(/[0-9]/, "Password must contain at least one number")
                .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

            passwordConfirmation: z.string(),
        }).refine(
            (data) => data.password === data.passwordConfirmation,
            {
                message: "Passwords do not match",
                path: ["passwordConfirmation"],
            }
        ),
    });

    const displayPassword = () => {
        setShowPassword(show => !show);
    }

    type blockSchemaType = z.infer<typeof blockSchema>;

    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(blockSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            role: "EMPLOYEE",
            email: "",
            pwSchema: {
                password: "",
                passwordConfirmation: "",
            },
            isActive: true,
            image: (null as (File | null)),
        }
    });

    const store = () => {
        if (methods.getValues('image') === null) return;
        setLoading(true);
        const formData = new FormData();
        //TODO: 2. Fill In Form Data
        formData.append('avatar', methods.getValues('image') as Blob);
        formData.append('firstName', methods.getValues('firstName'));
        formData.append('lastName', methods.getValues('lastName'));
        formData.append('email', methods.getValues('email'));
        formData.append('role', methods.getValues('role'));
        formData.append('password', methods.getValues('pwSchema.password'));
        formData.append('isActive', String(methods.getValues('isActive')));

        adminService.storeAdmin(formData)
            .then((res) => {
                methods.reset();
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'A new User has been added', severity: "success" })
                );
            })
            .catch((error) => {
                setSnackbar(snackbarState =>
                    ({
                        ...snackbarState,
                        open: true,
                        message: 'Error Happened while storing the user',
                        severity: "error"
                    })
                );
            }).
            finally(() => {
                setLoading(false);
            })
        ;
    }
    return (
        <AdminLayout>
            <Head title="Add User"></Head>
            {/*
            TODO: 1. ADD THE FORM HERE
            */}
            <Box>
                <Breadcrumbs>
                    <Link href={`/users`}>Back to users</Link>
                    <Typography>Add New User</Typography>
                </Breadcrumbs>
                <Box className="p-[16px]">
                    <Typography variant="h5">Add New User</Typography>
                </Box>

                <FormProvider {...methods}>
                    <Box
                        component="form"
                        sx={{
                            '& .MuiTextField-root': { m: 1, width: '100%' },
                        }}
                        noValidate
                        autoComplete="off"
                        onSubmit={methods.handleSubmit(store)}
                    >
                        <ValidatedImage
                            controllerName="avatar"
                            methods={methods}
                            rounded={true}
                            image={'/file/users/default.png'}
                        />

                        <ValidatedCheckbox
                            name="isActive"
                            id="isActive"
                            color="secondary"
                            control={methods.control}
                            label="Is Active"
                        />

                        <ValidatedInput
                            controlName="firstName"
                            name="firstName"
                            id="firstName"
                            label="First Name"
                            placeholder="First Name"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="lastName"
                            name="lastName"
                            id="lastName"
                            label="Last Name"
                            placeholder="Last Name"
                            control={methods.control}
                        />

                        <ValidatedInput
                            controlName="email"
                            name="email"
                            id="email"
                            label="Email"
                            placeholder="Email"
                            control={methods.control}
                        />

                        <ValidatedSelect
                            control={methods.control}
                            controlName='role'
                            id="role"
                            label="Choose Role"
                            placeholder="Role"
                            withNone={false}
                            items={roles.map(role => ({
                                id: role.id,
                                name: role.name,
                            }))}></ValidatedSelect>

                        <ValidatedInput
                            controlName="pwSchema.password"
                            name="password"
                            id="password"
                            label="Password"
                            placeholder="Password"
                            control={methods.control}
                            type={showPassword ? 'text' : 'password'}
                            adornmentDirection={'end'}
                            adornment={ showPassword ? <VisibilityOff /> : <Visibility />}
                            adornmentAction={displayPassword}

                        />

                        <ValidatedInput
                            controlName="pwSchema.passwordConfirmation"
                            name="passwordConfirmation"
                            id="passwordConfirmation"
                            label="Password Confirmation"
                            placeholder="Password Confirmation"
                            control={methods.control}
                            type={showPassword ? 'text' : 'password'}
                            adornmentDirection={'end'}
                            adornment={showPassword ? <VisibilityOff /> : <Visibility />}
                            adornmentAction={displayPassword}

                        />

                        <Stack
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                            spacing={2}
                            className="m-[8px]"
                        >
                            <CustomButton
                                task="add"
                                text={'User'}
                                disabled={loading}
                            ></CustomButton>
                        </Stack>
                    </Box>
                </FormProvider>
                <CustomSnackbar
                    open={snackbar.open}
                    message={snackbar.message}
                    onClose={handleClose}
                    severity={snackbar.severity}
                />
            </Box>
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />
        </AdminLayout>
    );
};

export default AdministratorAdd;
