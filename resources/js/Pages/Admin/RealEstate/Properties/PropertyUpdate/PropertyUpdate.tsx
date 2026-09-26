import React, {useState} from 'react';
import {Container} from "typedi";
import BlockService from "@/Services/BlockService/BlockService";
import CommonService from "@/Services/CommonService/CommonService";
import {Link} from "@inertiajs/react";
import {Box, Typography, Breadcrumbs, Tab} from "@mui/material";
import {TabList, TabContext, TabPanel} from "@mui/lab";
import Property from "@/models/block/Property";
import BasicInformation from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/BasicInformation";
import PropertyGallery from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/PropertyGallery";
import PropertyLead from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/PropertyLead";
import PropertyAttachments from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/PropertyAttachments";

const PropertyUpdate: React.FC<{category: string, block: Property}> = ({category, block}) => {
    const blockService = Container.get(BlockService);
    const commonService = Container.get(CommonService);
    const [selectedBlock, setSelectedBlock] = useState<Property>({...block});

    const [value, setValue] = React.useState('1');

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };
    const handleBlockChange = (block: Property) => {
        setSelectedBlock({...block});
    }
    return (
        <Box>
            <Breadcrumbs>
                <Link href={`/admin/get-block/` + block.category}>Back to {commonService.toTitleCase(block.category)}</Link>
                <Typography>Update {blockService.getBlockName(selectedBlock)}</Typography>
            </Breadcrumbs>

            <Box sx={{ width: '100%', typography: 'body1' }}>
                <TabContext value={value}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={handleChange} aria-label="lab API tabs example" textColor={'secondary'} indicatorColor={'secondary'}>
                            <Tab label="Basic Information" value="1" />
                            <Tab label="Gallery" value="2" />
                            <Tab label="Attachments" value="3"></Tab>
                            <Tab label={`Leads(${block.leadsCount})`} value="4" />
                        </TabList>
                    </Box>
                    <TabPanel value="1">
                        <BasicInformation category={category} block={block} handleBlockChange={handleBlockChange}></BasicInformation>
                    </TabPanel>
                    <TabPanel value="2"><PropertyGallery block={block}></PropertyGallery></TabPanel>
                    <TabPanel value="3"><PropertyAttachments property={block} handleBlockChange={handleBlockChange} ></PropertyAttachments></TabPanel>
                    <TabPanel value="4"><PropertyLead block={block} category={category}></PropertyLead></TabPanel>
                </TabContext>
            </Box>
        </Box>

    );
};

export default PropertyUpdate;
