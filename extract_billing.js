const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\smitp\\Desktop\\Groovy\\PRODUCT\\data\\upload\\1781698242187_billing and charges.xlsx';
const outDir = 'C:\\Users\\smitp\\Desktop\\Groovy\\PRODUCT\\data\\billing';

// Read workbook
const workbook = XLSX.readFile(filePath);

// Get first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON (header: 1 => array of arrays)
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

// Find header row and columns
let headerRowIdx = -1;
let activityColIdx = -1;
let amountColIdx = -1;
let planColIdx = -1;

// Keywords for detection
const activityKeywords = ['activity', 'activity name', 'program', 'service', 'course', 'name'];
const amountKeywords = ['amount', 'billing amount', 'amount inr', 'total', 'fee', 'price', 'cost', 'charges'];
const planKeywords = ['plan', 'billing plan', 'plan code', 'plan name', 'billing', 'package', 'scheme', 'charges plan'];

function normalize(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchKeywords(s, keywords) {
  const n = normalize(s);
  return keywords.some(kw => n.includes(normalize(kw)));
}

// Scan rows to find header
for (let i = 0; i < Math.min(20, rows.length); i++) {
  const row = rows[i];
  if (!Array.isArray(row) || row.length === 0) continue;
  
  let foundActivity = false, foundAmount = false, foundPlan = false;
  
  for (let j = 0; j < row.length; j++) {
    const val = String(row[j]).trim();
    if (!val) continue;
    
    if (matchKeywords(val, activityKeywords)) {
      foundActivity = true;
      activityColIdx = j;
    }
    if (matchKeywords(val, amountKeywords)) {
      foundAmount = true;
      amountColIdx = j;
    }
    if (matchKeywords(val, planKeywords)) {
      foundPlan = true;
      planColIdx = j;
    }
  }
  
  if (foundActivity && foundAmount && foundPlan) {
    headerRowIdx = i;
    break;
  }
}

if (headerRowIdx === -1) {
  console.error('Could not detect header row with Activity, Amount, and Billing Plan columns');
  process.exit(1);
}

console.log(`Header found at row ${headerRowIdx}: activityCol=${activityColIdx}, amountCol=${amountColIdx}, planCol=${planColIdx}`);

// Extract records from data rows
const records = [];
const seen = new Set();
const errors = [];
let validCount = 0;

const source = path.basename(filePath);
const now = Date.now();
const extractedAt = new Date().toISOString();

for (let i = headerRowIdx + 1; i < rows.length; i++) {
  const row = rows[i];
  if (!Array.isArray(row)) continue;
  
  const rowNum = i + 1; // 1-indexed for user messages
  
  const activityName = row[activityColIdx] !== undefined ? String(row[activityColIdx]).trim() : '';
  let amountRaw = row[amountColIdx] !== undefined ? String(row[amountColIdx]).trim() : '';
  const planName = row[planColIdx] !== undefined ? String(row[planColIdx]).trim() : '';
  
  // Validate activity name
  if (!activityName) {
    errors.push(`Row ${rowNum}: Activity name missing — skipped`);
    continue;
  }
  
  // Validate billing plan
  if (!planName) {
    errors.push(`Row ${rowNum}: Billing plan missing — skipped`);
    continue;
  }
  
  // Parse amount: remove currency symbols and commas
  const cleanedAmount = amountRaw.replace(/[$₹€¥,]/g, '').trim();
  const billingAmount = parseFloat(cleanedAmount);
  
  if (isNaN(billingAmount) || billingAmount <= 0) {
    errors.push(`Row ${rowNum}: Amount '${amountRaw}' invalid — skipped`);
    continue;
  }
  
  // Dedup key
  const key = `${activityName}|${planName}`;
  if (seen.has(key)) {
    console.log(`Row ${rowNum}: Duplicate ${key} — skipped`);
    continue;
  }
  seen.add(key);
  
  records.push({
    recordType: 'billing',
    id: `bill-${now}-${validCount}`,
    source: source,
    extractedAt: extractedAt,
    name: activityName,
    billingAmount: billingAmount,
    billingPlan: planName,
    currency: 'INR'
  });
  
  validCount++;
}

// Print errors
if (errors.length > 0) {
  console.log('\nValidation errors:');
  errors.forEach(e => console.log(`  ${e}`));
}

if (records.length === 0) {
  console.log('\nNo valid billing records could be extracted.');
  process.exit(1);
}

// Write output
const outFile = path.join(outDir, `extracted-${now}.json`);
fs.writeFileSync(outFile, JSON.stringify(records, null, 2), 'utf8');

console.log(`\nSuccessfully extracted ${records.length} billing records to ${outFile}`);