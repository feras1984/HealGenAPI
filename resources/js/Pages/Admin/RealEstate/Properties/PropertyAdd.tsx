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
import ValidatedInput from "@/Components/ValidatedComponents/ValidatedInput";
import {Container} from "typedi";
import FormService from "@/Services/FormService/FormService";
import BlockService from "@/Services/BlockService/BlockService";
import CommonService from "@/Services/CommonService/CommonService";
import {Link, usePage} from "@inertiajs/react";
import React from "react";
import ProjectTypeEnum from "@/Enums/ProjectTypeEnum";
import ProjectStatusEnum from "@/Enums/ProjectStatusEnum";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import {z} from "zod";
import {FormProvider, useForm} from "react-hook-form";
import ValidatedDatePicker from "@/Components/ValidatedComponents/ValidatedDatePicker";
import PropertyStatusEnum from "@/Enums/PropertyStatusEnum";

const PropertyAdd: React.FC<{category: string}> = ({category}) => {
    const formService = Container.get(FormService);
    const blockService = Container.get(BlockService);
    const commonService = Container.get(CommonService);
    const languages = usePage().props.settings.languages;
    const [communities, setCommunities] = React.useState<Block []>([]);
    const [developers, setDevelopers] = React.useState<Block []>([]);
    const [cities, setCities] = React.useState<Block []>([]);

    const statuses =  Object.entries(PropertyStatusEnum).map(([key, value]) => ({
        id: key,
        name: value,
    }));
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
        communityId: z.number().min(1, {message: 'Community is Required'}),
        developerId: z.number().min(1, {message: 'Developer is Required'}),
        cityId: z.number().min(1, {message: 'City is Required'})
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
            // features: '',
            status: PropertyStatusEnum.RESALE,
            price: 0,
            area: 0,
            numberOfBeds: 0,
        }
    });

    const onSubmit =  () => {
        // console.log(methods.getValues('image'));
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
        // formData.append('features', methods.getValues('features').toString());
        formData.append('status', methods.getValues('status'));
        formData.append('price', methods.getValues('price').toString());
        formData.append('area', methods.getValues('area').toString())
        formData.append('numberOfBeds', methods.getValues('numberOfBeds').toString());


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

                    <BasicTranslation
                        methods={methods}
                        category={commonService.toTitleCase(category)}
                        withDetails={false}
                        withBrief={false}
                    />

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

                    {communities.length > 0 && <ValidatedSelect
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

                    {/*<ValidatedInput*/}
                    {/*    controlName="features"*/}
                    {/*    name="features"*/}
                    {/*    id="features"*/}
                    {/*    label="Features"*/}
                    {/*    placeholder="Features"*/}
                    {/*    control={methods.control}*/}
                    {/*/>*/}

                    {statuses.length > 0 && <ValidatedSelect
                        control={methods.control}
                        controlName='status'
                        id="status"
                        label="Choose Status"
                        placeholder="Status"
                        withNone={false}
                        items={
                            statuses.map(status => ({id: status.id, name: status.name}))
                        }

                    />}

                    <ValidatedInput
                        controlName="price"
                        name="price"
                        id="Price"
                        label="Price"
                        placeholder="1000000"
                        control={methods.control}
                        adornment="AED"
                    />

                    <ValidatedInput
                        controlName="area"
                        name="area"
                        id="area"
                        label="Area"
                        placeholder="1000"
                        control={methods.control}
                        adornment="sq ft"
                    />

                    <ValidatedInput
                        controlName="numberOfBeds"
                        name="numberOfBeds"
                        id="numberOfBeds"
                        label="Number Of Beds"
                        placeholder="4"
                        control={methods.control}
                    />

                    <Stack
                        direction="row"
                        justifyContent="flex-start"
                        alignItems="center"
                        spacing={2}
                        className="m-[8px]"
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
};

export default PropertyAdd;
