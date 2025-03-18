import fs from 'fs/promises';
import path from 'path';
import { parseCSV } from './data-utils';

export async function loadCsvDataServer() {
  try {
    const filePath = path.join(process.cwd(), 'public/data/school-directory-data.csv');
    const csvData = await fs.readFile(filePath, 'utf8');
    return parseCSV(csvData);
  } catch (error) {
    console.error('Error loading CSV data from server:', error);
    throw error;
  }
}
