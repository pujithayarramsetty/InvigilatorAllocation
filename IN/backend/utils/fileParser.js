const XLSX = require('xlsx');
const Papa = require('papaparse');
const fs = require('fs');

// Parse Excel file
const parseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '', // Default value for empty cells
      raw: false // Convert all values to strings
    });
    
    // Filter out completely empty rows
    const filteredData = data.filter(row => {
      return Object.values(row).some(value => value !== '' && value !== null && value !== undefined);
    });
    
    return filteredData;
  } catch (error) {
    throw new Error(`Error parsing Excel file: ${error.message}`);
  }
};

// Parse CSV file
const parseCSV = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Trim header whitespace
      transform: (value) => value.trim() // Trim cell values
    });
    
    // Filter out completely empty rows
    const filteredData = result.data.filter(row => {
      return Object.values(row).some(value => value !== '' && value !== null && value !== undefined);
    });
    
    return filteredData;
  } catch (error) {
    throw new Error(`Error parsing CSV file: ${error.message}`);
  }
};

// Parse file based on extension
const parseFile = (filePath, originalName) => {
  const ext = originalName.split('.').pop().toLowerCase();
  
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(filePath);
  } else if (ext === 'csv') {
    return parseCSV(filePath);
  } else {
    throw new Error('Unsupported file format. Please upload CSV or Excel files.');
  }
};

module.exports = { parseExcel, parseCSV, parseFile };

