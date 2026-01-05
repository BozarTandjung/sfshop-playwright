import fs from 'fs';
import path from 'path';

export function readCSV(filePath: string) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines.shift()!.split(',');

  return lines.map(line => {
    const values = line.split(',');
    const record: any = {};
    headers.forEach((h, i) => {
      record[h] = values[i] || '';
    });
    return record;
  });
}