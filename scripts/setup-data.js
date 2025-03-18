const fs = require('fs');
const path = require('path');
const https = require('https');

// URL of the current data source
const REMOTE_CSV_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PTO%20Directory%20Updated%202.10.2025%20-%20Base-HiBXMHBax9pSnzR964nBHbxijBVjDi.csv";

// Local path to save the data
const DATA_DIR = path.join(__dirname, '../public/data');
const CSV_FILE_PATH = path.join(DATA_DIR, 'school-directory-data.csv');

// Function to download the file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    // Ensure the data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created directory: ${DATA_DIR}`);
    }

    // Check if we already have the file
    if (fs.existsSync(dest)) {
      console.log(`Data file already exists at ${dest}`);
      return resolve();
    }

    console.log(`Downloading data from ${url}...`);
    
    // Make the request
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Download completed: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Execute
downloadFile(REMOTE_CSV_URL, CSV_FILE_PATH)
  .catch(err => {
    console.error('Error downloading data file:', err);
    process.exit(1);
  });
