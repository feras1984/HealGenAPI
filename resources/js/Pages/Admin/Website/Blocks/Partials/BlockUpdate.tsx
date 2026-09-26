import React from 'react';
import CommonService from "@/Services/CommonService/CommonService";
import {Container} from "typedi";
import "reflect-metadata";
import {PageProps} from "@/types";
import {Head, Link} from "@inertiajs/react";

import AdminLayout from "@/Layouts/Admin/AdminLayout";
import {Block} from "@/models/block/Block";
import BlockCategories from "@/Enums/BlockCategories";
import AboutUpdate from "@/Pages/Admin/Website/Blocks/About/AboutUpdate";
import ProjectUpdate from "@/Pages/Admin/RealEstate/Projects/projectsUpdate/ProjectUpdate";
import Project from "@/models/block/Project";
import DeveloperUpdate from "@/Pages/Admin/RealEstate/Developers/DeveloperUpdate";
import CommunityUpdate from "@/Pages/Admin/RealEstate/Communities/CommunityUpdate";
import TurnUpdate from "@/Pages/Admin/Website/Blocks/About/TurnOurVisionIntoValue/TurnUpdate";
import StoryAdd from "@/Pages/Admin/Website/Blocks/About/OurStory/StoryAdd";
import MissionAdd from "@/Pages/Admin/Website/Blocks/About/OurMission/MissionAdd";
import VisionAdd from "@/Pages/Admin/Website/Blocks/About/OurVision/VisionAdd";
import StoryUpdate from "@/Pages/Admin/Website/Blocks/About/OurStory/StoryUpdate";
import MissionUpdate from "@/Pages/Admin/Website/Blocks/About/OurMission/MissionUpdate";
import VisionUpdate from "@/Pages/Admin/Website/Blocks/About/OurVision/VisionUpdate";
import TalentedUpdate from "@/Pages/Admin/Website/Blocks/About/Talented/TalentedUpdate";
import MainSectionUpdate from "@/Pages/Admin/Website/Blocks/MainSection/MainSectionUpdate";
import PropertyUpdate from "@/Pages/Admin/RealEstate/Properties/PropertyUpdate/PropertyUpdate";
import CityUpdate from "@/Pages/Admin/RealEstate/City/CityUpdate";
import AgentUpdate from "@/Pages/Admin/RealEstate/Agent/AgentUpdate";
import Agent from "@/models/block/Agent";
import Property from "@/models/block/Property";
import PrivacyPolicyUpdate from "@/Pages/Admin/Website/Blocks/PrivacyPolicy/PrivacyPolicyUpdate";
import ConditionsUpdate from "@/Pages/Admin/Website/Blocks/Conditions/ConditionsUpdate";
import CareersUpdate from "@/Pages/Admin/Website/Blocks/Careers/CareersUpdate";
import DirectorsUpdate from "@/Pages/Admin/Website/Blocks/About/Directors/DirectorsUpdate";
import BlogUpdate from "@/Pages/Admin/Website/Blocks/Blog/BlogUpdate";
import NewsUpdate from "@/Pages/Admin/Website/Blocks/News/NewsUpdate/NewsUpdate";


const BlockUpdate = ({category, block}: PageProps<{category: string, block: Block}>) => {
    const commonService = Container.get(CommonService);
    const categories = Object.values(BlockCategories);
    let UpdateComponent;

    switch (commonService.toTitleCase(category)) {

        // case BlockCategories.ABOUT: {
        //     UpdateComponent = () => <AboutUpdate block={block} category={category}></AboutUpdate>;
        //     break;
        // }
        case BlockCategories.MAIN_SECTION: {
            UpdateComponent = () => <MainSectionUpdate block={block} category={category}></MainSectionUpdate>;
            break;
        }
        case BlockCategories.TURN_OUR_VISION_INTO_VALUE: {
            UpdateComponent = () => <TurnUpdate block={block} category={category}></TurnUpdate>;
            break;
        }
        case BlockCategories.OUR_BOARD_OF_DIRECTORS: {
            UpdateComponent = () => <DirectorsUpdate block={block} category={category}></DirectorsUpdate>;
            break;
        }
        case BlockCategories.OUR_STORY: {
            UpdateComponent = () => <StoryUpdate block={block} category={category}></StoryUpdate>;
            break;
        }
        case BlockCategories.OUR_MISSION: {
            UpdateComponent = () => <MissionUpdate block={block} category={category}></MissionUpdate>;
            break;
        }
        case BlockCategories.OUR_VISION: {
            UpdateComponent = () => <VisionUpdate block={block} category={category}></VisionUpdate>;
            break;
        }
        case BlockCategories.OUR_CREATIVE_TALENTS: {
            UpdateComponent = () => <TalentedUpdate block={block} category={category}></TalentedUpdate>;
            break;
        }



        case BlockCategories.COMMUNITIES: {
            UpdateComponent = () => <CommunityUpdate block={block} category={category}></CommunityUpdate>;
            break;
        }

        case BlockCategories.DEVELOPERS: {
            UpdateComponent = () => <DeveloperUpdate block={block} category={category}></DeveloperUpdate>;
            break;
        }

        case BlockCategories.PROJECTS: {
            UpdateComponent = () => <ProjectUpdate block={block as Project} category={category}></ProjectUpdate>;
            break;
        }

        case BlockCategories.PROPERTY: {
            UpdateComponent = () => <PropertyUpdate block={block as Property} category={category}></PropertyUpdate>;
            break;
        }

        case BlockCategories.CITY: {
            UpdateComponent = () => <CityUpdate block={block} category={category}></CityUpdate>;
            break;
        }

        case BlockCategories.AGENT: {
            UpdateComponent = () => <AgentUpdate block={block as Agent} category={category}></AgentUpdate>;
            break;
        }

        case BlockCategories.PRIVACY: {
            UpdateComponent = () => <PrivacyPolicyUpdate block={block as Agent} category={category}></PrivacyPolicyUpdate>;
            break;
        }

        case BlockCategories.CONDITION: {
            UpdateComponent = () => <ConditionsUpdate block={block as Agent} category={category}></ConditionsUpdate>;
            break;
        }

        case BlockCategories.CAREER: {
            UpdateComponent = () => <CareersUpdate block={block as Agent} category={category}></CareersUpdate>;
            break;
        }

        case BlockCategories.BLOG: {
            UpdateComponent = () => <BlogUpdate block={block as Agent} category={category}></BlogUpdate>;
            break;
        }

        case BlockCategories.NEWS: {
            UpdateComponent = () => <NewsUpdate category={category} block={block}></NewsUpdate>
            break;
        }


        default: {
            UpdateComponent = () => <ProjectUpdate block={block as Project} category={category}></ProjectUpdate>
        }
    }

    const getTitle = () => {
        return commonService.toTitleCase(category);
    }
    return (
        <AdminLayout>
            <Head title={'Update ' + getTitle()}></Head>
            <UpdateComponent></UpdateComponent>
        </AdminLayout>
    );
}

export default BlockUpdate;
