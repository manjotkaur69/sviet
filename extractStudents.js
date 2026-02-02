//second
console.log("📋 Starting student extraction from PDFs...");

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const PDF_FOLDER = path.join(__dirname, "..", "sectionpdf");
const OUTPUT_FILE = path.join(__dirname, "students.json");

let students = [];

function detectSection(fileName) {
  const name = fileName.toLowerCase();
  if (name.includes("sec-a")) return "CSE-A";
  if (name.includes("sec-b")) return "CSE-B";
  if (name.includes("sec-c")) return "CSE-C";
  if (name.includes("sec-d")) return "CSE-D";
  if (name.includes("ai")) return "B.TECH AI";
  if (name.includes("csd")) return "CSD";
  if (name.includes("civil")) return "CIVIL/ME/EE";
  return "UNKNOWN";
}

function parseCSDTable(text) {
  console.log("🔄 Parsing CSD table structure...");
  const students = [];
  
  // Remove header and split by lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Parse table rows - looking for pattern: number + Group + Roll + Name
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern for CSD table: "1Phy-512025BTCED001Divya Raj"
    // Match: serial number, group, roll, name
    const pattern = /(\d+)(Phy-\d+|Chem-\d+)(2025[A-Z]+\d+)([A-Za-z\s]+)/;
    const match = line.match(pattern);
    
    if (match) {
      const [, serial, group, roll, name] = match;
      
      // Clean up the name - remove any trailing numbers or special characters
      const cleanName = name.replace(/\d+/g, '').replace(/[^A-Za-z\s]/g, '').trim();
      
      // Determine program from roll
      let program = "UNKNOWN";
      if (roll.includes("BTCS")) program = "BTCS";
      else if (roll.includes("BTAI")) program = "BTAI";
      else if (roll.includes("BTCI")) program = "BTCI";
      else if (roll.includes("BTME")) program = "BTME";
      else if (roll.includes("BTEE")) program = "BTEE";
      else if (roll.includes("BTCED")) program = "BTCED";
      else if (roll.includes("BHAI")) program = "BHAI";
      
      students.push({
        roll: roll.toUpperCase(),
        name: cleanName,
        program,
        section: "CSD",
        group: group.toUpperCase()
      });
      
      console.log(`✓ ${roll} - ${cleanName} - ${group}`);
    } else {
      // Try alternative pattern if the first one doesn't match
      const rollMatch = line.match(/(2025[A-Z]+\d+)/);
      if (rollMatch) {
        const roll = rollMatch[0];
        const groupMatch = line.match(/(Phy-\d+|Chem-\d+)/);
        const group = groupMatch ? groupMatch[0] : "UNKNOWN";
        
        // Try to extract name - look for text after roll number
        const namePart = line.split(roll)[1];
        let name = "Unknown";
        if (namePart) {
          // Remove group if present and clean up
          name = namePart.replace(group, '').replace(/\d+/g, '').trim();
          if (name === "") name = "Unknown";
        }
        
        // Add to students array
        if (!students.some(s => s.roll === roll)) {
          students.push({
            roll: roll.toUpperCase(),
            name: name,
            program: roll.includes("BTCED") ? "BTCED" : "UNKNOWN",
            section: "CSD",
            group: group.toUpperCase()
          });
        }
      }
    }
  }
  
  return students;
}

function extractStudentsFromText(text, section, fileName) {
  console.log(`Processing ${section} from ${fileName}...`);
  
  // For CSD PDFs, use special table parsing
  if (section === "CSD") {
    const csdStudents = parseCSDTable(text);
    csdStudents.forEach(student => {
      if (!students.some(s => s.roll === student.roll)) {
        students.push(student);
      }
    });
    return;
  }
  
  // For other sections, use the original logic
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const rollMatch = lines[i].match(/2025[a-z]{3,6}\d{3,4}/i);
    if (!rollMatch) continue;

    const roll = rollMatch[0].toUpperCase();
    const name = lines[i + 1] ? lines[i + 1].replace(/\s+/g, " ").trim() : "Unknown";
    const groupLine = lines[i + 2] || "";

    let group = "UNKNOWN";
    const groupMatch = groupLine.match(/(PHY|CHEM)[\-\s]?\d+/i);
    if (groupMatch) group = groupMatch[0].toUpperCase();

    let program = "UNKNOWN";
    if (roll.includes("BTCS")) program = "BTCS";
    else if (roll.includes("BTAI")) program = "BTAI";
    else if (roll.includes("BTCI")) program = "BTCI";
    else if (roll.includes("BTME")) program = "BTME";
    else if (roll.includes("BTEE")) program = "BTEE";
    else if (roll.includes("BTCED") || roll.includes("BTCE")) program = "BTCED";
    else if (roll.includes("BHAI")) program = "BHAI";

    if (!students.some(s => s.roll === roll)) {
      students.push({
        roll,
        name,
        program,
        section,
        group
      });

      console.log(`✓ ${roll} - ${name} - ${group}`);
    }
  }
}

async function main() {
  students = []; // Clear existing data
  
  if (!fs.existsSync(PDF_FOLDER)) {
    console.error("❌ sectionpdf folder not found!");
    return;
  }

  const files = fs.readdirSync(PDF_FOLDER).filter(f => f.endsWith(".pdf"));
  console.log(`Found ${files.length} PDF files`);

  for (const file of files) {
    console.log(`\n📄 Processing: ${file}`);
    try {
      const buffer = fs.readFileSync(path.join(PDF_FOLDER, file));
      const data = await pdfParse(buffer);
      const section = detectSection(file);
      extractStudentsFromText(data.text, section, file);
    } catch (err) {
      console.error(`Error with ${file}:`, err.message);
    }
  }

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(students, null, 2));
  console.log(`\n✅ SUCCESS! Extracted ${students.length} students`);
  console.log("📊 Sample of first 5 students:");
  students.slice(0, 5).forEach(s => {
    console.log(`  ${s.roll} - ${s.name} - ${s.group}`);
  });
}

main();

