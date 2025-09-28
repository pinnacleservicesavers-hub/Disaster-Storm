import { distanceMatrix } from '@/lib/google';
import { Contractor, Lead, RankedLead } from '@/types/geo';

export async function rankLeadsByDriveTime(contractors: Contractor[], leads: Lead[]): Promise<RankedLead[]> {
  if (!contractors.length || !leads.length) return [];

  // Build batched Distance Matrix calls (Google caps size; this keeps it simple)
  const batchSize = 20; // tune if needed
  const results: RankedLead[] = [];

  for (let i = 0; i < leads.length; i += batchSize) {
    const chunk = leads.slice(i, i + batchSize);
    const mat = await distanceMatrix(
      contractors.map(c => c.location),
      chunk.map(l => l.location)
    );

    // mat returns a stream; but in REST we shaped JSON list in lib/google.ts
    // Expect array of rows with originIndex/destinationIndex
    const best: Record<number, { contractorIdx: number; duration: number; distance: number }> = {};

    for (const row of mat) {
      const oi = row.originIndex, di = row.destinationIndex;
      if (oi == null || di == null) continue;
      const durSec = parseIsoDurationSeconds(row.duration || '0s');
      const dist = row.distanceMeters || 0;
      const prev = best[di];
      if (!prev || durSec < prev.duration) {
        best[di] = { contractorIdx: oi, duration: durSec, distance: dist };
      }
    }

    chunk.forEach((lead, idx) => {
      const b = best[idx];
      if (!b) return;
      const c = contractors[b.contractorIdx];
      results.push({ ...lead, bestContractorId: c.id, etaSec: b.duration, distanceMeters: b.distance });
    });
  }

  // Sort by custom priority first, then by ETA
  const weight = (p: Lead['priority']) => (
    p === 'TREE_ON_HOME' ? 0 :
    p === 'TREE_ON_BUILDING' ? 1 :
    p === 'TREE_ON_STRUCTURE' ? 2 :
    p === 'CAR_ON_HOUSE' ? 3 : 4
  );

  return results.sort((a,b) => weight(a.priority) - weight(b.priority) || a.etaSec - b.etaSec);
}

function parseIsoDurationSeconds(iso: string){
  // Google returns e.g. "1234s"; minimal parser
  if (iso.endsWith('s')) return parseInt(iso.slice(0,-1),10) || 0;
  return 0;
}