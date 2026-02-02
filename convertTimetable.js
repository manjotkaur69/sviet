console.log("📅 Creating timetable.json from Excel data...");

const fs = require("fs");
const path = require("path");

// Path to Excel file
const EXCEL_PATH = path.join(__dirname, "..", "timetable", "CLASS WISE TIME TABLE.xlsx");

// Check if file exists
if (!fs.existsSync(EXCEL_PATH)) {
  console.error(`❌ ERROR: Excel file not found at: ${EXCEL_PATH}`);
  console.log("💡 Please make sure 'CLASS WISE TIME TABLE.xlsx' is in the 'timetable' folder");
  process.exit(1);
}

// Since we don't have xlsx module installed, let's install it
console.log("📦 Installing xlsx module if not present...");
try {
  require.resolve("xlsx");
} catch (e) {
  console.log("Installing xlsx module...");
  const { execSync } = require("child_process");
  execSync("npm install xlsx", { stdio: "inherit" });
}

const XLSX = require("xlsx");

console.log("📖 Reading Excel file...");
const workbook = XLSX.readFile(EXCEL_PATH);
const timetable = {};

// Map sheet names to our section codes
const sheetMapping = {
  'CSE-A': 'CSE-A',
  'CSE-B': 'CSE-B', 
  'CSE-C': 'CSE-C',
  'CSE-D': 'CSE-D',
  'CSD': 'CSD',
  'CIVIL,EE,ME': 'CIVIL/ME/EE',
  'B.TECH AI': 'B.TECH AI',
  'DIPLOMA EE,CSE': 'DIPLOMA' // Optional
};

// Process each sheet
workbook.SheetNames.forEach(sheetName => {
  if (sheetMapping[sheetName]) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const sectionTimetable = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // Find start of timetable (row with "Monday")
    let startRow = -1;
    for (let i = 0; i < data.length; i++) {
      if (data[i] && data[i][0] && 
          data[i][0].toString().toLowerCase().includes('monday')) {
        startRow = i;
        break;
      }
    }
    
    if (startRow === -1) {
      console.log(`⚠️  Could not find timetable data in sheet: ${sheetName}`);
      return;
    }
    
    // Extract each day's schedule (5 rows for 5 days)
    days.forEach((day, dayIndex) => {
      const rowIdx = startRow + dayIndex * 2; // Each day has 2 rows in Excel
      if (data[rowIdx]) {
        sectionTimetable[day] = {};
        
        // Periods 1-8 (columns 1-8, with 0 being the day name)
        for (let period = 1; period <= 8; period++) {
          let subject = "";
          
          // Check first row for this day
          if (data[rowIdx][period]) {
            subject = data[rowIdx][period].toString().trim();
          }
          
          // If empty, check second row (for labs split)
          if ((!subject || subject === "") && data[rowIdx + 1] && data[rowIdx + 1][period]) {
            subject = data[rowIdx + 1][period].toString().trim();
          }
          
          // Clean up
          if (subject && !subject.toLowerCase().includes('break')) {
            // Remove room numbers in parentheses
            subject = subject.replace(/\([^)]*\)/g, '').trim();
            // Remove group names
            subject = subject.replace(/\((PHY|CHEM)[0-9-]+\)/gi, '').trim();
          }
          
          sectionTimetable[day][period.toString()] = subject || "FREE";
        }
      }
    });
    
    timetable[sheetMapping[sheetName]] = sectionTimetable;
    console.log(`✅ Extracted timetable for: ${sheetName}`);
  }
});

// Save to file
fs.writeFileSync("timetable.json", JSON.stringify(timetable, null, 2));
console.log(`\n✅ SUCCESS: timetable.json created with ${Object.keys(timetable).length} sections!`);
console.log("\n📋 Available sections:", Object.keys(timetable).join(", "));