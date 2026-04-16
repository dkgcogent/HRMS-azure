/**
 * Shared utility functions for data conversion
 * Used across multiple controllers for consistent data transformation
 */

/**
 * Convert snake_case string to camelCase
 * @param str - The snake_case string to convert
 * @returns The camelCase version of the string
 * @example toCamelCase('employee_id') // returns 'employeeId'
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert database row (snake_case) to camelCase object
 * Also converts MySQL boolean values (1/0) to JavaScript boolean (true/false) for isActive field
 * @param row - The database row object with snake_case keys
 * @returns The converted object with camelCase keys
 */
export const convertRowToCamelCase = (row: any): any => {
  if (!row) return row;
  const camelCaseRow: any = {};
  for (const key in row) {
    if (row.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      // Convert MySQL boolean (1/0) to JavaScript boolean for isActive field
      if (camelKey === 'isActive' || key === 'is_active') {
        camelCaseRow[camelKey] = row[key] === 1;
      } else {
        camelCaseRow[camelKey] = row[key];
      }
    }
  }
  return camelCaseRow;
};

/**
 * Convert array of database rows to camelCase objects
 * @param rows - Array of database rows with snake_case keys
 * @returns Array of converted objects with camelCase keys
 */
export const convertRowsToCamelCase = (rows: any[]): any[] => {
  return rows.map(row => convertRowToCamelCase(row));
};

/**
 * Convert ISO date string to MySQL date format (YYYY-MM-DD)
 * @param dateString - The ISO date string to convert
 * @returns MySQL formatted date string or null if invalid
 * @example formatDateForMySQL('2025-11-06T10:30:00.000Z') // returns '2025-11-06'
 */
export const formatDateForMySQL = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
};

/**
 * Format Date object to YYYY-MM-DD string for frontend display
 * @param date - The Date object or date string to format
 * @returns Formatted date string or null if invalid
 * @example formatDateForDisplay(new Date('2025-11-06')) // returns '2025-11-06'
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return null;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
};

