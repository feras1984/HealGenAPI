import React, {useState} from 'react';
import Administrator from "@/models/User/Administrator";
import {Container} from "typedi";
import AdminService from "@/Services/UserService/AdminService";
import CommonService from "@/Services/CommonService/CommonService";
import AdminRoleEnum from "@/Enums/AdminRoleEnum";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import {z} from "zod";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import {Head, Link} from "@inertiajs/react";
import {Box, Breadcrumbs, Stack, Typography} from "@mui/material";
import ValidatedImage from "@/Components/ValidatedComponents/ValidatedImage";
import ValidatedSwitch from "@/Components/ValidatedComponents/ValidatedSwitch";
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";
import ValidatedSelect from "@/Components/ValidatedComponents/ValidatedSelect";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import CustomButton from "@/Components/Button/CustomButton";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import {useAppDispatch, useAppSelector} from "@/Redux/Store/hook";
import {getUser} from "@/Redux/Reducers/UserSlice/UserSlice";
import User from "@/models/User/User";

const UserEdit: React.FC<
    {
        user: Administrator,
        enabled?: boolean,
    }
> = ({user, enabled = true}) => {
    const adminService = Container.get(AdminService);
    const commonService = Container.get(CommonService);
    const [selectedUser, setSelectedUser] = useState<Administrator>({...user});
    const roles = Object.entries(AdminRoleEnum).map(([key, value]) => ({
        id: key,
        name: value,
    }));

    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const dispatch = useAppDispatch();
    const usr = useAppSelector(state => state.user.user);
    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================
    // Handle Modal for Delete:
    const [openModal, setOpenModal] = useState<boolean>(false);
    const handleCloseModal = () => {
        setOpenModal(false);
    }

    const handleOpenModal = () => {
        setOpenModal(true);
    }

    // =========================================================================================

    const blockSchema = z.object({
        firstName: z.string().min(3, {message: 'First Name should be at least 3 characters!'}),
        lastName: z.string().min(3, {message: 'Last Name should be at least 3 characters!'}),
        email: z.string()
            .email('Please enter valid email address!')
            .refine(
                async (email) => {
                    const response = await adminService.validateEmail(email, selectedUser.id);
                    return response.data.status;
                },
                {message: 'Email address already exists!'}
            )
        ,

        // pwSchema: z.object({
        //     password: z
        //         .string()
        //         .min(12, "Password must be at least 12 characters")
        //         .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        //         .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        //         .regex(/[0-9]/, "Password must contain at least one number")
        //         .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
        //
        //     passwordConfirmation: z.string(),
        // }).refine(
        //     (data) => data.password === data.passwordConfirmation,
        //     {
        //         message: "Passwords do not match",
        //         path: ["passwordConfirmation"],
        //     }
        // ),
        pwSchema: z.object({
            password: z.string(),
            passwordConfirmation: z.string(),
        }).superRefine((data, ctx) => {
            // Empty password means: don't change the existing password
            if (data.password === '') {
                return;
            }

            if (data.password.length < 12) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['password'],
                    message: 'Password must be at least 12 characters',
                });
            }

            if (!/[a-z]/.test(data.password)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['password'],
                    message: 'Password must contain at least one lowercase letter',
                });
            }

            if (!/[A-Z]/.test(data.password)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['password'],
                    message: 'Password must contain at least one uppercase letter',
                });
            }

            if (!/[0-9]/.test(data.password)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['password'],
                    message: 'Password must contain at least one number',
                });
            }

            if (!/[^A-Za-z0-9]/.test(data.password)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['password'],
                    message: 'Password must contain at least one special character',
                });
            }

            if (data.password !== data.passwordConfirmation) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['passwordConfirmation'],
                    message: 'Passwords do not match',
                });
            }
        }),
    });

    type blockSchemaType = z.infer<typeof blockSchema>;

    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(blockSchema),
        defaultValues: {
            firstName: selectedUser.firstName,
            lastName: selectedUser.lastName,
            role: selectedUser.role,
            email: selectedUser.email,
            pwSchema: {
                password: "",
                passwordConfirmation: "",
            },
            isActive: selectedUser.isActive,
            image: (null as (File | null)),
        }
    });

    const displayPassword = () => {
        setShowPassword(show => !show);
    }

    // // =========================================================================================
    // // Handle image upload:
    //
    const onUpload = () => {
        const formData = new FormData();
        formData.append('avatar', methods.getValues('image') as Blob);
        adminService.uploadAvatar(formData, selectedUser.id)
            .then(response => {
                console.log('user: ', response.data.user);
                console.log('usr: ', usr)
                if(user.id === usr.id) {

                    dispatch(getUser({...selectedUser, avatar: response.data.user.avatar}));
                }
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'The avatar has been updated', severity: "success" })
                );
            })
            .catch(error => {
                console.log(error);
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Error Happened while uploading avatar', severity: "error" })
                );
            })
        // const imageId = selectedBlock.images.find(img => img.isCover)?.id || -1;
        // const formData = new FormData();
        // formData.append('image', (methods.getValues('image') as Blob));
        // formData.append('url', selectedUser->avatar);
        // blockService.uploadImage(formData, block.id).then(response => {
        //     setSelectedBlock(response.data);
        //     setSnackbar(snackbarState =>
        //         ({ ...snackbarState, open: true, message: 'Image has been updated!', severity: "success" })
        //     );
        // }).catch(error => {
        //     setSnackbar(snackbarState =>
        //         ({ ...snackbarState, open: true, message: 'Error Happened while uploading image!', severity: "error" })
        //     );
        // })
    }

    // =========================================================================================
    // Handle delete block

    // const deleteBlock = () => {
    //     setOpenModal(false);
    //     blockService.deleteBlock(block.id)
    //         .then(response => {
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true, message: 'Block has been deleted!', severity: "success" })
    //             );
    //             router.get('/admin/get-block/' + block.category);
    //         })
    //         .catch(error => {
    //             setSnackbar(snackbarState =>
    //                 ({ ...snackbarState, open: true, message: 'Error Happened while deleting block!', severity: "error" })
    //             );
    //         })
    // }

    // =========================================================================================
    // Handle Switch button:

    const receiveSwitchState = (value: boolean) => {
        // const formData = new FormData();
        // formData.append('isActive', String(value));
        //
        // blockService.blockActivation(formData, block.id).then(response => {
        //     setSelectedBlock(response.data);
        //     setSnackbar(snackbarState =>
        //         ({ ...snackbarState, open: true, message: 'Block status has been successfully updated!', severity: "success" })
        //     );
        // }).catch(error => {
        //     setSnackbar(snackbarState =>
        //         ({ ...snackbarState, open: true, message: 'Error Happened while updating block status!', severity: "error" })
        //     );
        // })
    }

    const onSubmit =  () => {
        const formData = new FormData();
        setLoading(true);
        formData.append('isActive', String(methods.getValues('isActive')));
        // formData.append('translations', JSON.stringify(methods.getValues('translations')));
        formData.append('firstName', methods.getValues('firstName'));
        formData.append('lastName', methods.getValues('lastName'));
        formData.append('email', methods.getValues('email'));
        formData.append('role', methods.getValues('role'));
        if (methods.getValues('pwSchema.password').length > 0) {
            formData.append('password', methods.getValues('pwSchema.password'));
        }
        formData.append('isActive', String(methods.getValues('isActive')));


        adminService.updateAdmin(formData, user.id).then(response => {
            setSelectedUser(response.data.user);
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'The user has been updated', severity: "success" })
            );
        }).catch(error => {
            console.log(error);
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Error Happened while updating user', severity: "error" })
            );
        }).finally(() => {
            setLoading(false);
        })
    }

    React.useEffect(() => {
        methods.getValues('image');
    }, [methods]);
    return (
        <Box>
            <Box>
                {/*<Breadcrumbs>*/}
                {/*    <Link href={`/users`}>Back to users</Link>*/}
                {/*    <Typography>Update User {selectedUser.name}</Typography>*/}
                {/*</Breadcrumbs>*/}
                <Box className="p-[16px]">
                    <Typography variant="h5">Update User {selectedUser.name}</Typography>
                </Box>

                <FormProvider {...methods}>
                    <Box
                        component="form"
                        sx={{
                            '& .MuiTextField-root': { m: 1, width: '100%' },
                        }}
                        noValidate
                        autoComplete="off"
                        onSubmit={methods.handleSubmit(onSubmit)}
                    >
                        <ValidatedImage
                            controllerName="image"
                            methods={methods}
                            image={`/file/users/${selectedUser.avatar}`}
                            onUpload={onUpload}
                            rounded={true}
                        />

                        {enabled && <ValidatedSwitch
                            controlName="isActive"
                            name="isActive"
                            id="isActive"
                            color="secondary"
                            methods={methods}
                            label="Is Active"
                            sendSwitchState={(value) => receiveSwitchState(value)}
                        />}

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

                        {enabled && <ValidatedInput
                            controlName="email"
                            name="email"
                            id="email"
                            label="Email"
                            placeholder="Email"
                            control={methods.control}
                        />}

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
                            <CustomButton task="update" text={'user'}></CustomButton>
                            {/*<CustomButton task="delete" text={'user'} onClick={handleOpenModal}></CustomButton>*/}
                        </Stack>
                    </Box>
                </FormProvider>
                <CustomSnackbar
                    open={snackbar.open}
                    message={snackbar.message}
                    onClose={handleClose}
                    severity={snackbar.severity}
                />

                {/*<DeleteModal*/}
                {/*    open={openModal}*/}
                {/*    onClose={handleCloseModal}*/}
                {/*    message={`Are you sure that you want to delete ${blockService.getBlockName(selectedBlock)}`}*/}
                {/*    confirmDelete={deleteBlock}*/}
                {/*></DeleteModal>*/}
            </Box>
        </Box>
    );
};

export default UserEdit;
