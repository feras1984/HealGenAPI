import React from 'react';
import BlockProps from "@/Interfaces/Site/BlockProps";
import {Head, Link, usePage} from "@inertiajs/react";
import HeaderLayout from "@/Layouts/Site/HeaderLayout";
import {Container} from "typedi";
import BlockService from "@/Services/BlockService/BlockService";
import "reflect-metadata";
import {Button} from "@/Pages/Site/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {useTranslation} from "react-i18next";
import NewsGallery from "@/Pages/Site/News/NewsDetails/NewsGallery";
import NewsDescription from "@/Pages/Site/News/NewsDetails/NewsDescription";

const NewsDetails: React.FC<{news: BlockProps}> = ({news}) => {
    const blockService = Container.get(BlockService);
    const {t} = useTranslation();
    const {lang} = usePage().props;
    return (
        <HeaderLayout>
            <Head title={news.title} />

            <div className="container mx-auto px-4 py-12">
                <Button variant="ghost" asChild className="mb-6">
                    <Link href={`/${lang}/news`} className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t('back-to-news')}
                    </Link>
                </Button>

                <article className="max-w-3xl mx-auto">

                    <NewsGallery block={news}></NewsGallery>

                    <NewsDescription block={news}></NewsDescription>
                </article>
            </div>
        </HeaderLayout>
    );
};

export default NewsDetails;
