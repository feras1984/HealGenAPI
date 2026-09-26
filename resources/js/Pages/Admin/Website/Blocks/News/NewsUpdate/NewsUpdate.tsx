import React, {useState} from 'react';
import {Block} from "@/models/block/Block";
import {Container} from "typedi";
import BlockService from "@/Services/BlockService/BlockService";
import CommonService from "@/Services/CommonService/CommonService";
import {Link, router, usePage} from "@inertiajs/react";
import {Box, Breadcrumbs, Stack, Typography, Tab} from "@mui/material";
import {TabList, TabContext, TabPanel} from "@mui/lab";
import BasicInfo from "@/Pages/Admin/Website/Blocks/News/NewsUpdate/BasicInfo";
import NewsGallery from "@/Pages/Admin/Website/Blocks/News/NewsUpdate/NewsGallery";
import NewsSocialMedia from "@/Pages/Admin/Website/Blocks/News/NewsUpdate/NewsSocialMedia";

const NewsUpdate: React.FC<{category: string, block: Block}> = ({category, block}) => {
    const blockService = Container.get(BlockService);
    const commonService = Container.get(CommonService);
    const [selectedBlock, setSelectedBlock] = useState<Block>({...block});

    const [value, setValue] = React.useState('1');

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };
    const handleBlockChange = (block: Block) => {
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
                            <Tab label="Social Media" value="3"></Tab>
                        </TabList>
                    </Box>
                    <TabPanel value="1">
                        <BasicInfo category={category} block={selectedBlock} handleBlockChange={handleBlockChange}></BasicInfo>
                    </TabPanel>
                    <TabPanel value="2"><NewsGallery block={selectedBlock}></NewsGallery></TabPanel>
                    <TabPanel value="3"><NewsSocialMedia></NewsSocialMedia></TabPanel>
                    {/*<TabPanel value="3"><ProjectAttachments project={selectedBlock} handleBlockChange={handleBlockChange} ></ProjectAttachments></TabPanel>*/}
                    {/*<TabPanel value="4"><ProjectsLead block={selectedBlock} category={category}></ProjectsLead></TabPanel>*/}
                </TabContext>
            </Box>

            {/*<BasicInfo category={category} block={block} handleBlockChange={handleBlockChange}></BasicInfo>*/}
        </Box>

    );
};

export default NewsUpdate;
