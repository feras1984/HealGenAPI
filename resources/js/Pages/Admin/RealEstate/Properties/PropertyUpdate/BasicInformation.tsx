import React from 'react';
import {zodResolver} from "@hookform/resolvers/zod";
import {Box, Stack, Typography, Breadcrumbs} from "@mui/material";
import ValidatedImage from "@/Components/ValidatedComponents/ValidatedImage";
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
import {Link, router, usePage} from "@inertiajs/react";
import useSnackbarHook from "@/Hooks/SnackbarHook";
import {z} from "zod";
import {FormProvider, useForm} from "react-hook-form";
import PropertyStatusEnum from "@/Enums/PropertyStatusEnum";
import Property from "@/models/block/Property";
import ValidatedSwitch from "@/Components/ValidatedComponents/ValidatedSwitch";
import DeleteModal from "@/Components/DeleteModal/DeleteModal";
import Project from "@/models/block/Project";

const BasicInformation: React.FC<{category: string, block: Property, handleBlockChange: (block: Property) => void}> = ({category, block, handleBlockChange}) => {
    const blockService = Container.get(BlockService);
    const commonService = Container.get(CommonService);
    const [selectedBlock, setSelectedBlock] = React.useState<Property>({...block});
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
    // Handle Modal for Delete:
    const [openModal, setOpenModal] = React.useState<boolean>(false);
    const handleCloseModal = () => {
        setOpenModal(false);
    }

    const handleOpenModal = () => {
        setOpenModal(true);
    }

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
            isActive: selectedBlock.isActive,
            image: (selectedBlock.images[0].url as (File | string)),
            translations: blockService.getTranslationsDetails(selectedBlock.translations),
            communityId: selectedBlock.communityId || -1,
            developerId: selectedBlock.developerId || -1,
            cityId: selectedBlock.cityId || -1,
            // features: selectedBlock.features,
            status: selectedBlock.status,
            price: selectedBlock.price,
            area: selectedBlock.area,
            numberOfBeds: selectedBlock.numberOfBeds,
        }
    });

    // =========================================================================================
    // Handle image upload:

    const onUpload = () => {
        const imageId = selectedBlock.images.find(img => img.isCover)?.id || -1;
        const formData = new FormData();
        formData.append('image', (methods.getValues('image') as Blob));
        formData.append('imageId', String(imageId));
        blockService.uploadImage(formData, block.id).then(response => {
            setSelectedBlock(project => ({...selectedBlock, images: response.data.images}));
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Image has been updated!', severity: "success" })
            );
        }).catch(error => {
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Error Happened while uploading image!', severity: "error" })
            );
        })
    }

    // =========================================================================================
    // Handle delete block

    const deleteBlock = () => {
        setOpenModal(false);
        blockService.deleteBlock(block.id)
            .then(response => {
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Block has been deleted!', severity: "success" })
                );
                router.get('/admin/get-block/' + block.category);
            })
            .catch(error => {
                setSnackbar(snackbarState =>
                    ({ ...snackbarState, open: true, message: 'Error Happened while deleting block!', severity: "error" })
                );
            })
    }

    // =========================================================================================
    // Handle Switch button:

    const receiveSwitchState = (value: boolean) => {
        const formData = new FormData();
        formData.append('isActive', String(value));

        blockService.blockActivation(formData, block.id).then(response => {
            setSelectedBlock(response.data as Property);
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Block status has been successfully updated!', severity: "success" })
            );
        }).catch(error => {
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Error Happened while updating block status!', severity: "error" })
            );
        })
    }

    const onSubmit =  () => {
        const formData = new FormData();
        formData.append('isActive', String(methods.getValues('isActive')));
        formData.append('translations', JSON.stringify(methods.getValues('translations')));
        formData.append('blockId', String(block.id));
        formData.append('communityId', methods.getValues('communityId').toString());
        formData.append('developerId', methods.getValues('developerId').toString());
        formData.append('cityId', methods.getValues('cityId').toString());
        // formData.append('features', methods.getValues('features').toString());
        formData.append('status', methods.getValues('status'));
        formData.append('price', methods.getValues('price').toString());
        formData.append('area', methods.getValues('area').toString())
        formData.append('numberOfBeds', methods.getValues('numberOfBeds').toString());

        blockService.updateBlock(formData, block.id).then(response => {
            setSelectedBlock(response.data as Property);
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'The block has been updated', severity: "success" })
            );
        }).catch(error => {
            setSnackbar(snackbarState =>
                ({ ...snackbarState, open: true, message: 'Error Happened while updating block', severity: "error" })
            );
        })
    }

    React.useEffect(() => {
        methods.getValues('image');
    }, [methods]);
    return (
        <Box>
            <Breadcrumbs>
                <Link href={`/admin/get-block/` + block.category}>Back to {commonService.toTitleCase(block.category)}</Link>
                <Typography>Update {blockService.getBlockName(selectedBlock)}</Typography>
            </Breadcrumbs>
            <Box className="p-[16px]">
                <Typography variant="h5">Update {blockService.getBlockName(selectedBlock)}</Typography>
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
                        image={blockService.getBlockImage(block)}
                        onUpload={onUpload}
                    />

                    <ValidatedSwitch
                        controlName="isActive"
                        name="isActive"
                        id="isActive"
                        color="secondary"
                        methods={methods}
                        label="Is Active"
                        sendSwitchState={(value) => receiveSwitchState(value)}
                    />

                    <BasicTranslation
                        methods={methods}
                        category={commonService.toTitleCase(category)}
                        withDetails={true}
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
                        <CustomButton task="update" text={commonService.toTitleCase(category)}></CustomButton>
                        <CustomButton task="delete" text={commonService.toTitleCase(category)} onClick={handleOpenModal}></CustomButton>
                    </Stack>
                </Box>
            </FormProvider>
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleClose}
                severity={snackbar.severity}
            />

            <DeleteModal
                open={openModal}
                onClose={handleCloseModal}
                message={`Are you sure that you want to delete ${blockService.getBlockName(selectedBlock)}`}
                confirmDelete={deleteBlock}
            ></DeleteModal>
        </Box>
    );
};

export default BasicInformation;
