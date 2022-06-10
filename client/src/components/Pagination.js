import React, { useEffect, useState, useMemo } from 'react';
import Pagination from 'react-bootstrap/Pagination';
import './Pagination.css';

const PaginationComponent = ({
  total = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange
}) => {
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (total > 0 && itemsPerPage > 0)
      setTotalPages(Math.ceil(total / itemsPerPage));
  }, [total, itemsPerPage]);

  if (totalPages === 0) return null;

  return (
    <Pagination className="d-flex justify-content-center" size="lg">
      <Pagination.Prev
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </Pagination.Prev>
      <Pagination.Next
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </Pagination.Next>
    </Pagination>
  );
};

export default PaginationComponent;
