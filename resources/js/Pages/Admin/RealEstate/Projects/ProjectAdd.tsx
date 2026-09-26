import React from 'react';
import {Container} from "typedi";
import FormService from "@/Services/FormService/FormService";
import BlockService from "@/Services/BlockService/BlockService";
import CommonService from "@/Services/CommonService/CommonService";
import {Link, usePage} from "@inertiajs/react";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import {z} from "zod";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Box, Stack, Typography, Breadcrumbs} from "@mui/material";
import ValidatedImage from "@/Components/ValidatedComponents/ValidatedImage";
import ValidatedCheckbox from "@/Components/ValidatedComponents/ValidatedCheckbox";
import BasicTranslation from "@/Components/Translations/BasicTranslation";
import CustomButton from "@/Components/Button/CustomButton";
import CustomSnackbar from "@/Components/Snackbar/CustomSnackbar";
import {Block} from "@/models/block/Block";
import BlockCategories from "@/Enums/BlockCategories";
import ValidatedSelect from "@/Components/ValidatedComponents/ValidatedSelect";
import ProjectTypeEnum from "@/Enums/ProjectTypeEnum";
import ProjectStatusEnum from "@/Enums/ProjectStatusEnum";
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";
import ValidatedDatePicker from "@/Components/ValidatedComponents/ValidatedDatePicker";
import AddFileButton from "@/Components/AddFileButton/AddFileButton";
import {HandoverEnum, PaymentPlanEnum} from "@/Enums/PaymentPlanEnum";

const ProjectAdd: React.FC<{category: string}> = ({category}) => {
    const formService = Container.get(FormService);
    const blockService = Container.get(BlockService);
    const commonService = Container.get(CommonService);
    const languages = usePage().props.settings.languages;
    const [communities, setCommunities] = React.useState<Block []>([]);
    const [developers, setDevelopers] = React.useState<Block []>([]);
    const [cities, setCities] = React.useState<Block []>([]);
    const [qrCode, setQrCode] = React.useState<File | null>(null);
    const [brochure, setBrochure] = React.useState<File | null>(null);
    const types = Object.entries(ProjectTypeEnum).map(([key, value]) => ({
        id: key,
        name: value,
    }));
    const statuses =  Object.entries(ProjectStatusEnum).map(([key, value]) => ({
        id: key,
        name: value,
    }));

    const paymentPlanTypes = Object.entries(PaymentPlanEnum).map(([key, value]) => ({
        id: key,
        name: value
    }));

    const quarters = Object.entries(HandoverEnum).map(([key, value]) => ({
        id: key,
        name: value,
    }))
    // =========================================================================================
    // Snackbar configuration section:

    const {snackbar, setSnackbar, handleClose} =
        useSnackbarHook({open: false, message: '', severity: "success"});

    // =========================================================================================
    // Fetch Communities, Developers, and Cities from DB:
    React.useEffect(() => {
        Promise.all([
            blockService.getActiveBlocks(commonService.toSnakeCase(BlockCategories.COMMUNITIES)),
            blockService.getActiveBlocks(commonService.toSnakeCase(BlockCategories.DEVELOPERS)),
            blockService.getActiveBlocks(commonService.toSnakeCase(BlockCategories.CITY)),
        ]).then(([com, dev, cit]) => {
            setCommunities(com.data);
            setDevelopers(dev.data);
            setCities(cit.data);
        })
    }, [])


    // =========================================================================================
    const blockSchema = z.object({
        isActive: z.boolean().default(true),
        // Record key is "ar" or "en" of length 2:
        translations: z.record(z.string().length(2),z.object({
            name: z.string().min(3, {message: 'Title should be at least 3 characters!'}),
            // brief: z.string().min(10),
            // description: z.string().max(100, {message: " Description shouldn't exceed 100 characters!"})
            // description: z.string().min(10),
        })),
        downPayment: z.string().default('20')
            .refine((val) => formService.isNumeric(val), {
                message: "Estimated value must be a number"
            })
            .refine((val) => formService.isPositive(val), {
                message: "Estimated value must be a positive number"
            })
            .refine((val) => formService.isPercent(val), {
                message: "maximum number is 100"
            }),

        youtubeUrl: z
            .string()
            .optional()
            .or(z.literal(""))
            .refine((val) => {
                if (!val) return true;

                try {
                    const url = new URL(val);

                    // youtu.be/VIDEOID
                    if (url.hostname === "youtu.be") {
                        return url.pathname.length > 1;
                    }

                    // youtube.com/*
                    if (url.hostname.includes("youtube.com")) {
                        const v = url.searchParams.get("v");
                        if (v && v.length === 11) return true;

                        // shorts
                        if (url.pathname.startsWith("/shorts/")) {
                            const id = url.pathname.split("/")[2];
                            return id && id.length === 11;
                        }
                    }
                } catch (e) {
                    return false;
                }
            }, {message: "Invalid YouTube URL"}
        ),

        constructionPaymentRate: z.string().default('50')
            .refine((val) => formService.isNumeric(val), {
                message: "Estimated value must be a number"
            })
            .refine((val) => formService.isPositive(val), {
                message: "Estimated value must be a positive number"
            })
            .refine((val) => formService.isPercent(val), {
                message: "maximum number is 100"
            }),

        handoverPaymentRate: z.string().default('50')
            .refine((val) => formService.isNumeric(val), {
                message: "Estimated value must be a number"
            })
            .refine((val) => formService.isPositive(val), {
                message: "Estimated value must be a positive number"
            })
            .refine((val) => formService.isPercent(val), {
                message: "maximum number is 100"
            }),

        paymentPlanType: z.string().min(1, {message: "Payment Plan Type is Required"}),
        quarter: z.string().min(1, {message: "Payment Plan Type is Required"}),
        handoverDate: z.date({message: "Handover date is required!"}),


    });

    type blockSchemaType = z.infer<typeof blockSchema>;

    //TODO: comply methods with z.infer type:
    const methods = useForm({
        mode: "onBlur",
        reValidateMode: "onBlur",
        resolver: zodResolver(blockSchema),
        defaultValues: {
            isActive: true,
            image: (null as (File | null)),
            translations: formService.generateDefaultValues(languages),
            communityId: -1,
            developerId: -1,
            cityId: -1,
            type: ProjectTypeEnum.Apartment,
            status: ProjectStatusEnum.READY,
            lunchDate: new Date(),
            lunchPrice: 0,
            downPayment: '20',
            youtubeUrl: '',
            brochure: brochure?.name || '',
            qrCode: qrCode?.name || '',
            constructionPaymentRate: '50',
            handoverPaymentRate: '50',
            paymentPlanType: PaymentPlanEnum.ON_HANDOVER,
            quarter: "Q1",
            handoverDate: new Date(),

        }
    });

    const qrCodeChanged = (file: File | null) => {
        setQrCode(file);
        if(file) {
            methods.setValue('qrCode', file.name);
        }
    }

    const brochureChanged = (file: File | null) => {
        setBrochure(file);
        if(file) {
            methods.setValue('brochure', file.name);
        }
    }

    const onSubmit =  () => {
        // console.log(methods.getValues('image'));
        console.log('HERE')
        if (methods.getValues('image') === null) return;
        const formData = new FormData();
        formData.append('category', category);
        formData.append('parentId', '-1');
        formData.append('image', (methods.getValues('image') as Blob));
        formData.append('isActive', String(methods.getValues('isActive')));
        formData.append('translations', JSON.stringify(methods.getValues('translations')));
        formData.append('isImage', 'true');
        formData.append('isCover', 'true');
        formData.append('communityId', methods.getValues('communityId').toString());
        formData.append('developerId', methods.getValues('developerId').toString());
        formData.append('cityId', methods.getValues('cityId').toString());
        formData.append('lunchPrice', methods.getValues('lunchPrice').toString());
        formData.append('lunchDate', new Date(methods.getValues('lunchDate')).toDateString());
        formData.append('status', methods.getValues('status'));
        formData.append('type', methods.getValues('type'));
        formData.append('downPayment', methods.getValues('downPayment'));
        formData.append('youtubeUrl', methods.getValues('youtubeUrl'));
        formData.append('brochure', brochure as Blob);
        formData.append('qrCode', qrCode as Blob);
        formData.append('constructionPaymentRate', methods.getValues('constructionPaymentRate').toString())
        formData.append('handoverPaymentRate', methods.getValues('handoverPaymentRate').toString())
        formData.append('paymentPlanType', methods.getValues('paymentPlanType').toString())
        formData.append('quarter', methods.getValues('quarter').toString())
        formData.append('handoverDate', new Date(methods.getValues('handoverDate')).toDateString())


        blockService.storeBlock(formData).then(response => {
            methods.reset();
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'A new block has been added', severity: "success" })
            );
        }).catch(error => {
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Error Happened while storing block', severity: "error" })
            );
        })
    }

    React.useEffect(() => {
        methods.getValues('image');
    }, [methods]);
    return (
        <Box>
            <Breadcrumbs>
                <Link href={`/admin/get-block/` + category}>Back to {commonService.toTitleCase(category)}</Link>
                <Typography>Add New {commonService.toTitleCase(category)}</Typography>
            </Breadcrumbs>
            <Box className="p-[16px]">
                <Typography variant="h5">Add New {commonService.toTitleCase(category)}</Typography>
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
                    />

                    <ValidatedCheckbox
                        name="isActive"
                        id="isActive"
                        color="secondary"
                        control={methods.control}
                        label="Is Active"
                    />

                    <Typography>
                        Project Name
                    </Typography>

                    <BasicTranslation
                        methods={methods}
                        category={commonService.toTitleCase(category)}
                        withDetails={false}
                        withBrief={false}
                    />

                    <Typography>
                        More Details
                    </Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        spacing={2}
                        className="m-[8px]"
                    >
                        {communities.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='communityId'
                            id="communityId"
                            label="Choose Community"
                            placeholder="Community"
                            withNone={false}
                            // items={blockService.getAllTranslations(selectedCategories)}
                            items={communities.map(comm => ({
                                id: comm.id,
                                name: blockService.getBlockName(comm),
                            }))}

                        />}

                        {developers.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='developerId'
                            id="developerId"
                            label="Choose Developer"
                            placeholder="Developer"
                            withNone={false}
                            // items={blockService.getAllTranslations(selectedCategories)}
                            items={developers.map(dev => ({
                                id: dev.id,
                                name: blockService.getBlockName(dev),
                            }))}

                        />}

                        {cities.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='cityId'
                            id="cityId"
                            label="Choose City"
                            placeholder="City"
                            withNone={false}
                            // items={blockService.getAllTranslations(selectedCategories)}
                            items={cities.map(cit => ({
                                id: cit.id,
                                name: blockService.getBlockName(cit),
                            }))}

                        />}
                    </Stack>

                    <Typography>
                        Type & Status
                    </Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        spacing={2}
                        className="m-[8px]"
                    >
                        {types.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='type'
                            id="type"
                            label="Choose Type"
                            placeholder={ProjectTypeEnum.Apartment}
                            items={
                                types.map(type => ({id: type.id, name: type.name}))
                            }

                        />}

                        {statuses.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='status'
                            id="status"
                            label="Choose Status"
                            placeholder={ProjectStatusEnum.READY}
                            items={
                                statuses.map(status => ({id: status.id, name: status.name}))
                            }

                        />}
                    </Stack>

                    <Typography>
                        Launch Info
                    </Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        spacing={2}
                        className="m-[8px]"
                    >
                        <ValidatedInput
                            controlName="lunchPrice"
                            name="lunchPrice"
                            id="lunchPrice"
                            label="Launch Price"
                            placeholder="1000000"
                            control={methods.control}
                            adornment="AED"
                        />

                        <ValidatedDatePicker
                            controlName="lunchDate"
                            methods={methods}
                            label="Launch Date"

                        />
                    </Stack>

                    <Typography>Payment Plan</Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        spacing={2}
                        className="m-[8px] flex-wrap lg:flex-nowrap"
                    >
                        <ValidatedInput
                            controlName="downPayment"
                            name="downPayment"
                            id="downPayment"
                            label="Down Payment"
                            placeholder="20"
                            control={methods.control}
                            adornment="%"
                        />

                        <ValidatedInput
                            className={'basis-[100%]'}
                            controlName="constructionPaymentRate"
                            name="constructionPaymentRate"
                            id="constructionPaymentRate"
                            label="Construction Payment Rate"
                            placeholder="50"
                            control={methods.control}
                            adornment="%"
                        />

                        <ValidatedInput
                            sx={{flexBasis: "100%"}}
                            controlName="handoverPaymentRate"
                            name="handoverPaymentRate"
                            id="handoverPaymentRate"
                            label="Handover Payment Rate"
                            placeholder="50"
                            control={methods.control}
                            adornment="%"
                        />

                        {paymentPlanTypes.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='paymentPlanType'
                            id="paymentPlanType"
                            label="Payment Plan Type"
                            placeholder={PaymentPlanEnum.ON_HANDOVER}
                            withNone={false}
                            items={
                                paymentPlanTypes.map(plan => ({id: plan.id, name: plan.name}))
                            }

                        />}
                    </Stack>

                    <Typography>Handover</Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        spacing={2}
                        className="m-[8px]"
                    >
                        <ValidatedDatePicker
                            controlName="handoverDate"
                            methods={methods}
                            label="Handover Date"

                        />

                        {quarters.length > 0 && <ValidatedSelect
                            control={methods.control}
                            controlName='quarter'
                            id="quarter"
                            label="Quarter"
                            placeholder={HandoverEnum.Q1}
                            items={
                                quarters.map(plan => ({id: plan.id, name: plan.name}))
                            }

                        />}

                    </Stack>

                    <Typography>Links and Attachments</Typography>

                    <Stack
                        direction="row"
                        justifyContent="space-evenly"
                        alignItems="center"
                        spacing={5}
                        className="m-[8px]"
                    >

                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={5}
                        className="m-[8px]"
                    >
                        <Stack
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                            spacing={2}
                            className="m-[8px]"
                        >
                            <Box className="m-[8px]">
                                <AddFileButton
                                    fileChanged={qrCodeChanged}
                                    text="QR Code"
                                    type="button"
                                ></AddFileButton>
                            </Box>
                            {qrCode && <Typography variant="subtitle2">{qrCode?.name}</Typography>}
                        </Stack>

                        <Stack
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                            spacing={2}
                            className="m-[8px]"
                        >
                            <Box className="m-[8px]">
                                <AddFileButton
                                    fileChanged={brochureChanged}
                                    text="Brochure"
                                    type="button"
                                ></AddFileButton>
                            </Box>
                            {brochure && <Typography variant="subtitle2">{brochure?.name}</Typography>}
                        </Stack>
                    </Stack>

                    <ValidatedInput
                        controlName="youtubeUrl"
                        name="youtubeUrl"
                        id="youtubeUrl"
                        label="Youtube URL"
                        placeholder="https://youtube.com"
                        control={methods.control}
                        // adornment="%"
                    />


                    <Stack
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={2}
                        className="mx-[8px] my-[32px]"
                    >
                        <CustomButton task="add" text={commonService.toTitleCase(category)}></CustomButton>
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
    );
}

export default ProjectAdd;
