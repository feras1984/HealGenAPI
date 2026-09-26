import React from 'react';
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/Admin/AdminLayout";
import Location from "@/models/location/Location";
import LocationContainer from "@/Services/LocationService/State/LocationContainer";
import { Box, Stack } from "@mui/material";
import CustomButton from "@/Components/Button/CustomButton";

const LocationList: React.FC<{ locations: Location[] }> = ({ locations }) => {
    return (
        <AdminLayout>
            <Head title="Locations"></Head>
            <Box className="py-[16px]">
                <Stack
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={2}
                >
                    <Link href={`/locations/add`}>
                        <CustomButton task='add' text={'Location'}></CustomButton>
                    </Link>
                </Stack>
            </Box>
            <LocationContainer locations={locations} count={locations.length}></LocationContainer>
        </AdminLayout>
    );
};

export default LocationList;
