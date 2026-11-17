import React from "react";
import SeoFields from "../SeoFields";
import { buildPropertySeo } from "../../../utils/seo";

export default function PropertySeoFields(props) {
    return (
        <SeoFields
            {...props}
            seo={buildPropertySeo(props.values)}
            urlPath="/web/propertyDetail/"
            titlePlaceholder="3 BHK Luxury Apartment for Sale in Gurugram"
            keywordsPlaceholder="3 bhk flat, apartment in gurugram"
        />
    );
}
