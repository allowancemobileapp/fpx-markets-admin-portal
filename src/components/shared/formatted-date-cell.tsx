
// src/components/shared/formatted-date-cell.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface FormattedDateCellProps {
  dateString: string;
  dateFormat?: string;
}

export function FormattedDateCell({ dateString, dateFormat = 'PPpp' }: FormattedDateCellProps) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dateString) {
      try {
        // Ensure the date string is valid before attempting to format
        const dateObject = new Date(dateString);
        if (!isNaN(dateObject.getTime())) {
          setFormattedDate(format(dateObject, dateFormat));
        } else {
          console.warn("Invalid date string received:", dateString);
          setFormattedDate("Invalid Date"); // Fallback for invalid date
        }
      } catch (error) {
        console.error("Error formatting date:", dateString, error);
        setFormattedDate(dateString); // Fallback to original string on error
      }
    } else {
      setFormattedDate('N/A');
    }
  }, [dateString, dateFormat]);

  // Render a placeholder or the raw date string during server render / before client effect runs
  if (typeof window === 'undefined' || formattedDate === null) {
    // Attempt a basic server-side formatting or show placeholder
    // This helps reduce the visual flash, but client will still take over.
    try {
      if (!dateString) return 'N/A';
      const serverDate = new Date(dateString);
      if (isNaN(serverDate.getTime())) return "Invalid Date";
      // A very simple, non-locale specific format for SSR
      // return `${serverDate.getFullYear()}-${String(serverDate.getMonth() + 1).padStart(2, '0')}-${String(serverDate.getDate()).padStart(2, '0')}`;
      return 'Loading date...'; // Or a more generic placeholder
    } catch {
      return 'Error...';
    }
  }

  return <>{formattedDate}</>;
}
