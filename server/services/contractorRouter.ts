import { db } from '../db';
import { aiContractors, aiAssignments, aiLeadServices } from '@shared/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

export interface ContractorScore {
  contractorId: string;
  score: number;
  tier: 1 | 2;
  matchedFactors: {
    trade: boolean;
    areaCode: boolean;
    equipment: boolean;
    capacity: boolean;
    performance: boolean;
  };
}

const TIER_1_THRESHOLD = 70;
const TIER_2_THRESHOLD = 40;
const ASSIGNMENT_EXPIRY_HOURS_TIER_1 = 4;
const ASSIGNMENT_EXPIRY_HOURS_TIER_2 = 6;

export async function findBestContractors(
  serviceCategory: string,
  phoneAreaCode: string,
  requiredEquipment?: string[]
): Promise<{ tier1: ContractorScore[]; tier2: ContractorScore[] }> {
  
  const allContractors = await db
    .select()
    .from(aiContractors)
    .where(eq(aiContractors.active, true));

  const scoredContractors: ContractorScore[] = allContractors
    .map((contractor) => {
      let score = contractor.performanceScore || 50;
      const matchedFactors = {
        trade: false,
        areaCode: false,
        equipment: false,
        capacity: false,
        performance: false,
      };

      // Trade match (40 points)
      if (contractor.trades?.includes(serviceCategory)) {
        score += 40;
        matchedFactors.trade = true;
      }

      // Area code match (20 points)
      if (contractor.areaCodesSupported?.includes(phoneAreaCode)) {
        score += 20;
        matchedFactors.areaCode = true;
      }

      // Equipment match (15 points if required)
      if (requiredEquipment && requiredEquipment.length > 0) {
        const hasEquipment = requiredEquipment.every((eq) =>
          contractor.equipment?.includes(eq)
        );
        if (hasEquipment) {
          score += 15;
          matchedFactors.equipment = true;
        }
      } else {
        matchedFactors.equipment = true; // No equipment required
      }

      // Capacity check (10 points)
      if (contractor.currentCapacity && contractor.currentCapacity > 0) {
        score += 10;
        matchedFactors.capacity = true;
      }

      // License & insurance verification (10 points)
      if (contractor.licenseVerified && contractor.insuranceVerified) {
        score += 10;
      }

      // Performance bonus (already in base score, just flag it)
      matchedFactors.performance = contractor.performanceScore >= 60;

      // Response time bonus (5 points if fast)
      if (contractor.responseTimeMs && contractor.responseTimeMs < 3600000) {
        // < 1 hour
        score += 5;
      }

      // Acceptance/completion rate bonus (5 points)
      const acceptRate = contractor.acceptanceRate ? parseFloat(contractor.acceptanceRate) : 0;
      const completeRate = contractor.completionRate ? parseFloat(contractor.completionRate) : 0;
      const avgRate = (acceptRate + completeRate) / 2;
      if (avgRate > 0.8) {
        score += 5;
      }

      return {
        contractorId: contractor.id,
        score,
        tier: (score >= TIER_1_THRESHOLD ? 1 : 2) as 1 | 2,
        matchedFactors,
      };
    })
    .filter((c) => c.score >= TIER_2_THRESHOLD) // Filter out low scorers
    .sort((a, b) => b.score - a.score); // Highest score first

  const tier1 = scoredContractors.filter((c) => c.tier === 1);
  const tier2 = scoredContractors.filter((c) => c.tier === 2);

  return { tier1, tier2 };
}

export async function createAssignment(
  leadServiceId: string,
  contractorId: string,
  round: 1 | 2
): Promise<string> {
  const expiryHours =
    round === 1 ? ASSIGNMENT_EXPIRY_HOURS_TIER_1 : ASSIGNMENT_EXPIRY_HOURS_TIER_2;

  const [assignment] = await db
    .insert(aiAssignments)
    .values({
      aiLeadServiceId: leadServiceId,
      aiContractorId: contractorId,
      round,
      state: 'offered',
      expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
    })
    .returning();

  return assignment.id;
}

export async function assignContractorsToService(
  leadServiceId: string,
  serviceCategory: string,
  phoneAreaCode: string,
  requiredEquipment?: string[]
): Promise<{
  tier1Assignments: string[];
  tier2Assignments: string[];
}> {
  const { tier1, tier2 } = await findBestContractors(
    serviceCategory,
    phoneAreaCode,
    requiredEquipment
  );

  const tier1Assignments: string[] = [];
  const tier2Assignments: string[] = [];

  // Create Tier 1 assignments (top 3)
  for (const contractor of tier1.slice(0, 3)) {
    const assignmentId = await createAssignment(leadServiceId, contractor.contractorId, 1);
    tier1Assignments.push(assignmentId);
  }

  // Create Tier 2 assignments (top 5 backups)
  for (const contractor of tier2.slice(0, 5)) {
    const assignmentId = await createAssignment(leadServiceId, contractor.contractorId, 2);
    tier2Assignments.push(assignmentId);
  }

  console.log(
    `Assigned ${tier1Assignments.length} Tier 1 + ${tier2Assignments.length} Tier 2 contractors to service ${leadServiceId}`
  );

  return { tier1Assignments, tier2Assignments };
}

export async function handleAssignmentResponse(
  assignmentId: string,
  state: 'accepted' | 'declined',
  responseNotes?: string,
  estimatedStartDate?: Date,
  estimatedCost?: number
): Promise<void> {
  const [assignment] = await db
    .update(aiAssignments)
    .set({
      state,
      respondedAt: new Date(),
      responseNotes,
      estimatedStartDate,
      estimatedCost,
    })
    .where(eq(aiAssignments.id, assignmentId))
    .returning();

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  // If accepted, mark the lead service as assigned
  if (state === 'accepted') {
    await db
      .update(aiLeadServices)
      .set({
        assignedContractorId: assignment.aiContractorId,
        assignedAt: new Date(),
      })
      .where(eq(aiLeadServices.id, assignment.aiLeadServiceId));

    // Expire other assignments for this service
    await db
      .update(aiAssignments)
      .set({ state: 'expired' })
      .where(
        and(
          eq(aiAssignments.aiLeadServiceId, assignment.aiLeadServiceId),
          sql`${aiAssignments.id} != ${assignmentId}`,
          eq(aiAssignments.state, 'offered')
        )
      );

    console.log(`Assignment ${assignmentId} accepted by contractor ${assignment.aiContractorId}`);
  } else {
    console.log(`Assignment ${assignmentId} declined by contractor ${assignment.aiContractorId}`);
  }
}

export async function checkExpiredAssignments(): Promise<number> {
  const expired = await db
    .update(aiAssignments)
    .set({ state: 'expired' })
    .where(
      and(
        eq(aiAssignments.state, 'offered'),
        sql`${aiAssignments.expiresAt} < NOW()`
      )
    )
    .returning();

  console.log(`Expired ${expired.length} assignments`);
  return expired.length;
}

export async function promoteToTier2(leadServiceId: string): Promise<void> {
  // Check if Tier 1 has all expired/declined
  const tier1Assignments = await db
    .select()
    .from(aiAssignments)
    .where(
      and(
        eq(aiAssignments.aiLeadServiceId, leadServiceId),
        eq(aiAssignments.round, 1)
      )
    );

  const tier1Active = tier1Assignments.some((a) => a.state === 'offered' || a.state === 'accepted');

  if (!tier1Active) {
    // Activate Tier 2 assignments
    const tier2Assignments = await db
      .select()
      .from(aiAssignments)
      .where(
        and(
          eq(aiAssignments.aiLeadServiceId, leadServiceId),
          eq(aiAssignments.round, 2),
          eq(aiAssignments.state, 'offered')
        )
      );

    console.log(`Promoting ${tier2Assignments.length} Tier 2 contractors for service ${leadServiceId}`);
    
    // Tier 2 contractors are already created, just need to notify them
    // (Outreach service will handle notifications)
  }
}
