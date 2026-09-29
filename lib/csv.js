export function parseCSV(text) {
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"') {cell+='"';i++;} else quoted=!quoted; }
    else if(c===',' && !quoted) {row.push(cell);cell='';}
    else if(c==='\n' && !quoted) {row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted) throw new Error('Niet afgesloten CSV-tekst');
  if(cell || row.length) {row.push(cell.replace(/\r$/,''));rows.push(row);}
  const headers=rows.shift();
  return rows.filter(r=>r.some(v=>v!=='')).map(r=>{
    if(r.length!==headers.length) throw new Error('CSV-kolomaantal klopt niet');
    return Object.fromEntries(headers.map((h,i)=>[h.replace(/^﻿/,''),r[i]]));
  });
}
