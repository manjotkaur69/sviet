// console.log("🚀 SVIET Chatbot Server Starting...");

// const express = require("express");
// const fs = require("fs");
// const cors = require("cors");
// const path = require("path");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Load data
// let students = [];
// let timetable = {};

// try {
//   students = JSON.parse(fs.readFileSync("students.json", "utf8"));
//   timetable = JSON.parse(fs.readFileSync("timetable.json", "utf8"));
//   console.log(`✅ Loaded ${students.length} students`);
//   console.log(`✅ Loaded timetable for ${Object.keys(timetable).length} sections`);
// } catch (error) {
//   console.error("❌ Error loading data:", error.message);
//   console.log("💡 Run: npm run setup");
// }

// // Get current day
// function getCurrentDay() {
//   const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//   return days[new Date().getDay()];
// }

// // Helper: ordinal numbers
// function getOrdinal(n) {
//   const s = ["th", "st", "nd", "rd"];
//   const v = n % 100;
//   return n + (s[(v - 20) % 10] || s[v] || s[0]);
// }

// // Parse question
// function parseQuestion(question) {
//   question = question.toLowerCase().trim();
  
//   // Extract day
//   let day = null;
//   const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
//   for (const d of days) {
//     if (question.includes(d)) {
//       day = d.charAt(0).toUpperCase() + d.slice(1);
//       break;
//     }
//   }
//   if (!day) day = getCurrentDay();
  
//   // Extract period
//   let period = null;
  
//   // Try patterns
//   const patterns = [
//     { regex: /(\d+)(?:st|nd|rd|th)? period/, group: 1 },
//     { regex: /period (\d+)/, group: 1 },
//     { regex: /(\d+) period/, group: 1 },
//     { regex: /(\d+)/, group: 1 } // Just a number
//   ];
  
//   for (const pattern of patterns) {
//     const match = question.match(pattern.regex);
//     if (match) {
//       period = parseInt(match[pattern.group]);
//       if (period >= 1 && period <= 8) break;
//     }
//   }
  
//   // Word patterns
//   if (!period) {
//     const wordMap = {
//       "first": 1, "second": 2, "third": 3, "fourth": 4,
//       "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8,
//       "one": 1, "two": 2, "three": 3, "four": 4,
//       "five": 5, "six": 6, "seven": 7, "eight": 8
//     };
    
//     for (const [word, num] of Object.entries(wordMap)) {
//       if (question.includes(word + " period") || question.includes("period " + word)) {
//         period = num;
//         break;
//       }
//     }
//   }
  
//   return { day, period };
// }

// // CHAT ENDPOINT - Main functionality
// app.post("/chat", (req, res) => {
//   const { roll, question } = req.body;
  
//   console.log(`📩 Chat request: ${roll} asked: "${question}"`);
  
//   if (!roll || !question) {
//     return res.json({ 
//       success: false,
//       reply: "Please provide both roll number and question." 
//     });
//   }
  
//   // Find student
//   const student = students.find(s => s.roll === roll);
  
//   if (!student) {
//     return res.json({ 
//       success: false,
//       reply: `❌ Student with roll number "${roll}" not found. Please check your admission number.`
//     });
//   }
  
//   console.log(`👤 Found student: ${student.name} (${student.section}, ${student.group})`);
  
//   // Check section in timetable
//   if (!timetable[student.section]) {
//     return res.json({ 
//       success: false,
//       reply: `⚠️ Timetable not available for section ${student.section}.`,
//       student: {
//         name: student.name,
//         roll: student.roll,
//         section: student.section,
//         group: student.group
//       }
//     });
//   }
  
//   // Parse question
//   const { day, period } = parseQuestion(question);
  
//   // If asking for full day timetable
//   if (!period) {
//     const dayTimetable = timetable[student.section][day];
    
//     if (!dayTimetable) {
//       return res.json({
//         success: true,
//         reply: `Hello ${student.name}! No timetable available for ${day}.`,
//         student: {
//           name: student.name,
//           roll: student.roll,
//           section: student.section,
//           group: student.group
//         }
//       });
//     }
    
//     let reply = `📅 Hello ${student.name}! Here's your timetable for ${day}:\n`;
//     reply += `Section: ${student.section}, Group: ${student.group}\n\n`;
    
//     for (let p = 1; p <= 8; p++) {
//       const subject = dayTimetable[p] || "FREE";
//       if (subject && subject !== "FREE" && !subject.toLowerCase().includes("break")) {
//         reply += `${getOrdinal(p)} Period: ${subject}\n`;
//       }
//     }
    
//     return res.json({
//       success: true,
//       reply: reply,
//       student: {
//         name: student.name,
//         roll: student.roll,
//         section: student.section,
//         group: student.group
//       },
//       day: day,
//       timetable: dayTimetable
//     });
//   }
  
//   // Specific period requested
//   const dayTimetable = timetable[student.section][day];
  
//   if (!dayTimetable) {
//     return res.json({
//       success: true,
//       reply: `Hello ${student.name}! No timetable available for ${day}.`,
//       student: {
//         name: student.name,
//         roll: student.roll,
//         section: student.section,
//         group: student.group
//       }
//     });
//   }
  
//   const subject = dayTimetable[period] || "FREE";
  
//   let reply = `Hello ${student.name}! Your ${getOrdinal(period)} period on ${day} `;
//   reply += `is: **${subject}**\n`;
//   reply += `(Section: ${student.section}, Group: ${student.group})`;
  
//   res.json({
//     success: true,
//     reply: reply,
//     student: {
//       name: student.name,
//       roll: student.roll,
//       section: student.section,
//       group: student.group
//     },
//     classInfo: {
//       day: day,
//       period: period,
//       subject: subject
//     }
//   });
// });

// // API to check student
// app.get("/student/:roll", (req, res) => {
//   const { roll } = req.params;
//   const student = students.find(s => s.roll === roll);
  
//   if (student) {
//     res.json({
//       success: true,
//       student: student
//     });
//   } else {
//     res.json({
//       success: false,
//       message: "Student not found"
//     });
//   }
// });

// // API to get sections
// app.get("/sections", (req, res) => {
//   res.json({
//     sections: Object.keys(timetable)
//   });
// });

// // API to get all students (for testing)
// app.get("/students", (req, res) => {
//   res.json({
//     count: students.length,
//     students: students.slice(0, 50) // First 50 only
//   });
// });

// // Start server
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
//   console.log(`📅 Today is: ${getCurrentDay()}`);
//   console.log(`👥 Students loaded: ${students.length}`);
//   console.log(`📋 Available sections: ${Object.keys(timetable).join(", ")}`);
// });
// second
console.log("🚀 SVIET Chatbot Server Starting...");

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Load data
let students = [];
let timetable = {};

try {
  students = JSON.parse(fs.readFileSync("students.json", "utf8"));
  timetable = JSON.parse(fs.readFileSync("timetable.json", "utf8"));
  console.log(`✅ Loaded ${students.length} students`);
  console.log(`✅ Loaded timetable for ${Object.keys(timetable).length} sections`);
} catch (error) {
  console.error("❌ Error loading data:", error.message);
  console.log("💡 Run: npm run setup");
}

// Get current day
function getCurrentDay() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

// Helper: ordinal numbers
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Parse question
function parseQuestion(question) {
  question = question.toLowerCase().trim();

  let day = null;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  for (const d of days) {
    if (question.includes(d)) {
      day = d.charAt(0).toUpperCase() + d.slice(1);
      break;
    }
  }
  if (!day) day = getCurrentDay();

  let period = null;

  const patterns = [
    { regex: /(\d+)(?:st|nd|rd|th)? period/, group: 1 },
    { regex: /period (\d+)/, group: 1 },
    { regex: /(\d+) period/, group: 1 },
    { regex: /(\d+)/, group: 1 }
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern.regex);
    if (match) {
      period = parseInt(match[pattern.group]);
      if (period >= 1 && period <= 8) break;
    }
  }

  if (!period) {
    const wordMap = {
      first: 1, second: 2, third: 3, fourth: 4,
      fifth: 5, sixth: 6, seventh: 7, eighth: 8,
      one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8
    };

    for (const [word, num] of Object.entries(wordMap)) {
      if (question.includes(word + " period") || question.includes("period " + word)) {
        period = num;
        break;
      }
    }
  }

  return { day, period };
}

// CHAT ENDPOINT
app.post("/chat", (req, res) => {
  let { roll, question } = req.body;

  console.log(`📩 Chat request: ${roll} asked: "${question}"`);

  if (!roll || !question) {
    return res.json({
      success: false,
      reply: "Please provide both roll number and question."
    });
  }

  // ✅ FIX: Safe, case-insensitive normalization
  const rollUpper = String(roll).toUpperCase().trim();

  const student = students.find(
    s => s.roll.toUpperCase() === rollUpper
  );

  if (!student) {
    return res.json({
      success: false,
      reply: `❌ Student with roll number "${roll}" not found. Please check your admission number.`
    });
  }

  console.log(`👤 Found student: ${student.name} (${student.section}, ${student.group})`);

  if (!timetable[student.section]) {
    return res.json({
      success: false,
      reply: `⚠️ Timetable not available for section ${student.section}.`,
      student
    });
  }

  const { day, period } = parseQuestion(question);

  if (!period) {
    const dayTimetable = timetable[student.section][day];

    if (!dayTimetable) {
      return res.json({
        success: true,
        reply: `Hello ${student.name}! No timetable available for ${day}.`,
        student
      });
    }

    let reply = `📅 Hello ${student.name}! Here's your timetable for ${day}:\n`;
    reply += `Section: ${student.section}, Group: ${student.group}\n\n`;

    for (let p = 1; p <= 8; p++) {
      const subject = dayTimetable[p] || "FREE";
      if (subject && subject !== "FREE" && !subject.toLowerCase().includes("break")) {
        reply += `${getOrdinal(p)} Period: ${subject}\n`;
      }
    }

    return res.json({ success: true, reply, student });
  }

  const dayTimetable = timetable[student.section][day];
  const subject = dayTimetable?.[period] || "FREE";

  let reply = `Hello ${student.name}! Your ${getOrdinal(period)} period on ${day} `;
  reply += `is: **${subject}**\n`;
  reply += `(Section: ${student.section}, Group: ${student.group})`;

  res.json({
    success: true,
    reply,
    student,
    classInfo: { day, period, subject }
  });
});

// CASE-INSENSITIVE STUDENT CHECK
app.get("/student/:roll", (req, res) => {
  const rollUpper = String(req.params.roll).toUpperCase().trim();
  const student = students.find(s => s.roll.toUpperCase() === rollUpper);

  res.json(student ? { success: true, student } : { success: false });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
