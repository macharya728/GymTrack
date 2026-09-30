import type { AppState } from '../types';
import { isAppState } from './logic';
import { allPhotos, blobToDataUrl, dataUrlToBlob, putPhoto } from './photos';

interface Backup {
  app: 'gymtrack';
  exportedAt: string;
  state: AppState;
  photos: Record<string, string>;
}

export async function exportBackup(state: AppState): Promise<Blob> {
  const photos: Record<string, string> = {};
  try {
    for (const [id, b] of Object.entries(await allPhotos())) photos[id] = await blobToDataUrl(b);
  } catch {
    /* photos optional */
  }
  const backup: Backup = { app: 'gymtrack', exportedAt: new Date().toISOString(), state, photos };
  return new Blob([JSON.stringify(backup)], { type: 'application/json' });
}

export interface ParsedBackup {
  state: AppState;
  photos: Record<string, string>;
  exportedAt?: string;
}

/** Parse and validate only. Nothing is written until the person confirms (see applyBackupPhotos). */
export async function importBackup(file: Blob): Promise<ParsedBackup> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t a GymTrack backup (not valid JSON).');
  }
  const b = parsed as Partial<Backup>;
  if (b?.app !== 'gymtrack' || !isAppState(b.state)) throw new Error('That file isn’t a GymTrack backup.');
  return { state: b.state, photos: b.photos ?? {}, exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : undefined };
}

export async function applyBackupPhotos(photos: Record<string, string>) {
  for (const [id, url] of Object.entries(photos)) {
    try {
      await putPhoto(id, await dataUrlToBlob(url));
    } catch {
      /* skip broken photo */
    }
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
