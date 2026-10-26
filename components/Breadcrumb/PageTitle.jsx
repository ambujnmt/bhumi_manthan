'use client';

import { Row, Col, Breadcrumb } from "react-bootstrap";
import NextLink from "next/link";

const PageTitle = ({ breadCrumbItems = [], title }) => {
  return (
    <Row>
      <Col>
        <div className="page-title-box flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          {/* Title */}
          <h5 className="page-title text-base sm:text-lg font-semibold">
            {title}
          </h5>

          {/* Breadcrumb */}
          <div className="page-title-right">
            <Breadcrumb className="m-0 text-xs sm:text-sm flex flex-wrap">
              {breadCrumbItems.map((item, index) =>
                item.active ? (
                  <Breadcrumb.Item
                    active
                    key={index}
                    className="text-gray-500"
                  >
                    {item.label}
                  </Breadcrumb.Item>
                ) : (
                  <Breadcrumb.Item key={index}>
                    <NextLink
                      href={item.path}
                      className="text-[rgb(232,119,34)] hover:underline"
                    >
                      {item.label}
                    </NextLink>
                  </Breadcrumb.Item>
                )
              )}
            </Breadcrumb>
          </div>

        </div>
      </Col>
    </Row>
  );
};

export default PageTitle;