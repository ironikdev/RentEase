import fs from 'fs';

const filePath = 'c:/Users/devan/OneDrive/Documents/RentEase/dist/assets/index-CayiuQtZ.js';
const content = fs.readFileSync(filePath, 'utf-8');

const target = 'https://ztkwcalxylmgpejxacek.supabase.co';
const index = content.indexOf(target);

if (index !== -1) {
  console.log('Found URL at index:', index);
  const start = Math.max(0, index - 200);
  const end = Math.min(content.length, index + target.length + 500);
  console.log('Surrounding content:');
  console.log(content.substring(start, end));
} else {
  console.log('URL not found in compiled bundle.');
}
