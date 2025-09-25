import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';


export async function tmpPath(ext: string){
  const p = path.join(os.tmpdir(), `${randomUUID()}${ext.startsWith('.')?ext:`.${ext}`}`);
  return p;
}
export async function writeTmp(buf: Buffer, ext: string){
  const p = await tmpPath(ext);
  await fs.writeFile(p, buf);
  return p;
}