import React, { useCallback, useEffect, useState } from "react";
import { Link } from "@heroui/react";
import classNames from "classnames";
import { FaAngleLeft,FaAngleRight  } from "react-icons/fa";

const Pagination = ({
  tableProps,
  sizePerPageList
}) => {
  /**
   * pagination count , index
   */
  const [pageCount, setPageCount] = useState(tableProps.pageCount);
  const [pageIndex, setPageIndex] = useState(tableProps.state.pageIndex);
  useEffect(() => {
    setPageCount(tableProps.pageCount);
    setPageIndex(tableProps.state.pageIndex);
  }, [tableProps.pageCount, tableProps.state.pageIndex]);

  /**
   * get filter pages
   */
  const filterPages = useCallback((visiblePages, totalPages) => {
    return visiblePages.filter(page => page <= pageCount);
  }, [pageCount]);

  /**
   * handle visible pages
   */
  const getVisiblePages = useCallback((page, total) => {
    if (total < 7) {
      return filterPages([1, 2, 3, 4, 5, 6], total);
    } else {
      if (page % 5 >= 0 && page > 4 && page + 2 < total) {
        return [1, page - 1, page, page + 1, total];
      } else if (page % 5 >= 0 && page > 4 && page + 2 >= total) {
        return [1, total - 3, total - 2, total - 1, total];
      } else {
        return [1, 2, 3, 4, 5, total];
      }
    }
  }, [filterPages]);

  /**
   * handle page change
   * @param page - current page
   * @returns
   */
  const changePage = page => {
    const activePage = pageIndex + 1;
    if (page === activePage) {
      return;
    }
    const visiblePages = getVisiblePages(page, pageCount);
    setVisiblePages(filterPages(visiblePages, pageCount));
    tableProps.gotoPage(page - 1);
  };
  useEffect(() => {
    const visiblePages = getVisiblePages(null, pageCount);
    setVisiblePages(visiblePages);
  }, [pageCount, getVisiblePages]);
  const [visiblePages, setVisiblePages] = useState(getVisiblePages(null, pageCount));
  const activePage = pageIndex + 1;
  return <>
      <div className="d-lg-flex align-items-center text-center pb-1">
        {sizePerPageList?.length > 0 && <div className="d-inline-block me-3">
            <label className="me-1">Display :</label>
            <select value={tableProps.state.pageSize} onChange={e => {
          tableProps.setPageSize(Number(e.target.value));
        }} className="form-select d-inline-block w-auto">
              {(sizePerPageList || []).map((pageSize, index) => {
            return <option key={index} value={pageSize.value}>
                    {pageSize.text}
                  </option>;
          })}
            </select>
          </div>}

        <span className="me-3">
          Page{" "}
          <strong>
            {pageIndex + 1} of {tableProps.pageOptions.length}
          </strong>{" "}
        </span>

        <span className="d-inline-block align-items-center text-sm-start text-center my-sm-0 my-2">
          <label className="form-label">Go to page : </label>
          <input type="number" value={pageIndex + 1} min="1" onChange={e => {
          const page = e.target.value ? Number(e.target.value) - 1 : 0;
          tableProps.gotoPage(page);
          setPageIndex(tableProps.state.pageIndex);
        }} className="form-control w-25 ms-1 d-inline-block" />
        </span>

    <ul className="pagination pagination-rounded d-inline-flex ms-auto align-item-center mb-0">
  {/* Previous Button */}
  <li
    key="prevpage"
    className={classNames("page-item", "paginate_button", "previous", {
      disabled: activePage === 1,
    })}
  >
    <button
      type="button"
      className="page-link"
      style={{
        padding: "0.375rem 0.75rem",
        height: "38px",
        width: "38px",
        color: "#0057b7",
        borderColor: "#0057b7",
        backgroundColor: activePage === 1 ? "rgb(229,242,255)" : "white",
      }}
      onClick={() => activePage > 1 && changePage(activePage - 1)}
    >
      <FaAngleLeft size={14} />
    </button>
  </li>

  {/* Page Numbers */}
  {(visiblePages || []).map((page, index, array) => {
    const showEllipsis = index > 0 && array[index - 1] + 1 < page;
    return (
      <React.Fragment key={page}>
        {showEllipsis && (
          <li className="page-item disabled d-none d-xl-inline-block">
            <span className="page-link">...</span>
          </li>
        )}
        <li
          className={classNames("page-item", "d-none", "d-xl-inline-block", {
            active: activePage === page,
          })}
        >
          <button
            type="button"
            className="page-link"
            style={{
              padding: "0.375rem 0.75rem",
              height: "38px",
              width: "38px",
              color: activePage === page ? "#fff" : "#0057b7",
              backgroundColor: activePage === page ? "#0057b7" : "white",
              borderColor: "#0057b7",
              fontWeight: "500",
            }}
            onClick={() => changePage(page)}
          >
            {page}
          </button>
        </li>
      </React.Fragment>
    );
  })}

  {/* Next Button */}
  <li
    key="nextpage"
    className={classNames("page-item", "paginate_button", "next", {
      disabled: activePage === tableProps.pageCount,
    })}
  >
    <button
      type="button"
      className="page-link"
      style={{
        padding: "0.375rem 0.75rem",
        height: "38px",
        width: "38px",
        color: "#0057B7",
        borderColor: "#0057b7",
        backgroundColor: activePage === tableProps.pageCount ? "rgb(229,242,255)" : "white",
      }}
      onClick={() =>
        activePage < tableProps.pageCount && changePage(activePage + 1)
      }
    >
      <FaAngleRight />
    </button>
  </li>
</ul>


      </div>
    </>;
};
export default Pagination;