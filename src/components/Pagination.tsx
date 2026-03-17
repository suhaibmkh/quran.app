'use client';

import { useTheme } from '@/context/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const { isDark } = useTheme();

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const buttonClass = (isDisabled: boolean, isActive: boolean) => {
    if (isActive) return 'bg-quran-green text-white';
    if (isDisabled) {
      return isDark
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
        : 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    return isDark
      ? 'bg-gray-700 text-white hover:bg-gray-600'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6 flex-wrap">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg transition-colors ${buttonClass(
          currentPage === 1,
          false
        )}`}
      >
        <ChevronRight size={20} />
      </button>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-2.5 py-1.5 rounded-lg transition-colors font-semibold text-xs ${
              page === currentPage
                ? 'bg-quran-green text-white'
                : page === '...'
                ? 'cursor-default'
                : isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg transition-colors ${buttonClass(
          currentPage === totalPages,
          false
        )}`}
      >
        <ChevronLeft size={20} />
      </button>

      <span
        className={`ml-4 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
      >
        الصفحة {currentPage} من {totalPages}
      </span>
    </div>
  );
};
