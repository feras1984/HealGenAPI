import React from 'react';
import BlockProps from "@/Interfaces/Site/BlockProps";

const NewsDescription: React.FC<{block: BlockProps}> = ({block}) => {
    return (
        <div className="m-[16px]">
            <h1 className="text-3xl font-bold text-foreground mb-6">
                {block.title}
            </h1>

            <p className="text-sm text-muted-foreground mb-6 font-bold">
                {block.startDate}
            </p>

            <p
                className="text-muted-foreground leading-relaxed whitespace-pre-line"
                dangerouslySetInnerHTML={{__html: block.description}}
            >
                {/*{blog.description}*/}
            </p>
        </div>
    );
};

export default NewsDescription;
