import React from 'react';
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import Location from "@/models/location/Location";
import LocationContainer from "@/Services/LocationService/State/LocationContainer";
import { Box, Button, Stack } from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useTranslation } from "react-i18next";

const LocationList: React.FC<{ locations: Location[] }> = ({ locations }) => {
    const { t } = useTranslation();
    return (
        <AdminLayout>
            <Head title={t('nav.locations') || 'Locations'}></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/locations/add`}>
                        <CustomButton task='add' text={t('common.location') || 'Location'}></CustomButton>
                    </Link>
                    <Link href={`/location-inspectors`}>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<AssignmentIndIcon />}
                            sx={{ textTransform: 'none', height: 40, borderRadius: 2 }}
                        >
                            {t('nav.inspectorAssignments') || 'Inspector Assignments'}
                        </Button>
                    </Link>
                </Stack>
            </Box>
            <LocationContainer locations={locations} count={locations.length}></LocationContainer>
        </AdminLayout>
    );
};

export default LocationList;
