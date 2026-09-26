import {Head} from "@inertiajs/react";
import React from "react";
import {Box} from "@mui/material";
import BlockProps from "@/Interfaces/Site/BlockProps";
import {useAppSelector, useAppDispatch} from "@/Redux/Store/hook";
import LinkListProps from "@/Interfaces/Site/LinkListProps";

import HeaderLayout from "@/Layouts/Site/HeaderLayout";
import HeroSlider from "@/Pages/Site/Home/Components/HeroSlider";
import AboutUs from "@/Pages/Site/Home/Components/AboutUs";
import {DevelopersSlider} from "@/Pages/Site/Home/Components/DevelopersSlider";
import CommunitiesCarousel from "@/Pages/Site/Home/Components/CommunitiesCarousel";
import ProjectProps from "@/Interfaces/Site/ProjectProps";
import PropertyProps from "@/Interfaces/Site/PropertyProps";
import {ProjectsSlider} from "@/Pages/Site/Home/Components/ProjectsSlider";
import {PropertiesSlider} from "@/Pages/Site/Home/Components/PropertiesSlider";
import SEO from "@/Pages/Site/components/SEO";
import CommunityProps from "@/Interfaces/Site/CommunityProps";
import DeveloperProps from "@/Interfaces/Site/DeveloperProps";
import HeroSlider1 from "@/Pages/Site/Home/Components/HeroSlider/HeroSlider1";

const Home:React.FC<{
    mainSliders: BlockProps [],
    aboutUs: BlockProps [],
    communities: CommunityProps [],
    developers: DeveloperProps [],
    projects: ProjectProps [],
    properties: PropertyProps [],
}> = ({mainSliders, aboutUs, communities, developers, projects, properties}) => {
    return(
        <HeaderLayout>
            <Head
                title={'Home'}
            >
                {/*<SEO*/}
                {/*    title="Home"*/}
                {/*    description="Discover luxury real estate in Dubai with top developers like Emaar, Damac, and Nakheel. Browse premium properties, off-plan projects, and investment opportunities."*/}
                {/*    canonical="https://prestigepropertydxb.com/"*/}
                {/*    structuredData={[...communities, ...projects, ...developers, ...properties, ...aboutUs]}*/}
                {/*/>*/}
            </Head>

            <Box>
                {/*<HeroSlider slides={mainSliders}></HeroSlider>*/}
                    <div className="bg-background">
                        <HeroSlider1 slides={mainSliders}></HeroSlider1>
                    </div>
                    <PropertiesSlider properties={properties}></PropertiesSlider>
                    <ProjectsSlider projects={projects}></ProjectsSlider>
                    <DevelopersSlider developers={developers}></DevelopersSlider>
                    <CommunitiesCarousel communities={communities}></CommunitiesCarousel>
                    <AboutUs aboutUs={aboutUs[0]}></AboutUs>
                    {/*    Services Goes Here */}
                    {/*    Blogs Goes Here*/}
                    {/*    Google Reviews Goes Here*/}
            </Box>
        </HeaderLayout>

);
}
export default Home;
