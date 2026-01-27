import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth, requireContractor } from "../middleware/auth";
import {
  insertTrueCostSheetSchema,
  insertTrueCostLaborItemSchema,
  insertTrueCostEquipmentItemSchema,
  insertTrueCostMaterialItemSchema,
  insertTrueCostOverheadItemSchema,
} from "@shared/schema";

const router = Router();

// ============================================================================
// TrueCost™ Profit Sheet Routes - Private Job Costing Calculator
// ============================================================================

// Get all TrueCost sheets for a contractor
router.get("/sheets", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const sheets = await storage.getTrueCostSheets(contractorId);
    res.json(sheets);
  } catch (error) {
    console.error("Error fetching TrueCost sheets:", error);
    res.status(500).json({ error: "Failed to fetch sheets" });
  }
});

// Get single TrueCost sheet with all line items
router.get("/sheets/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const sheet = await storage.getTrueCostSheet(Number(req.params.id));
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }
    
    // Verify ownership
    if (sheet.contractorId !== contractorId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [laborItems, equipmentItems, materialItems, overheadItems] = await Promise.all([
      storage.getTrueCostLaborItems(sheet.id),
      storage.getTrueCostEquipmentItems(sheet.id),
      storage.getTrueCostMaterialItems(sheet.id),
      storage.getTrueCostOverheadItems(sheet.id),
    ]);

    res.json({
      sheet,
      laborItems,
      equipmentItems,
      materialItems,
      overheadItems,
    });
  } catch (error) {
    console.error("Error fetching TrueCost sheet:", error);
    res.status(500).json({ error: "Failed to fetch sheet" });
  }
});

// Create new TrueCost sheet
router.post("/sheets", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const validatedData = insertTrueCostSheetSchema.parse({ ...req.body, contractorId });
    const sheet = await storage.createTrueCostSheet(validatedData);
    res.status(201).json(sheet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating TrueCost sheet:", error);
    res.status(500).json({ error: "Failed to create sheet" });
  }
});

// Update TrueCost sheet
router.patch("/sheets/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const existing = await storage.getTrueCostSheet(Number(req.params.id));
    if (!existing) {
      return res.status(404).json({ error: "Sheet not found" });
    }
    if (existing.contractorId !== contractorId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const partialSchema = insertTrueCostSheetSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const sheet = await storage.updateTrueCostSheet(Number(req.params.id), validatedData);
    res.json(sheet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating TrueCost sheet:", error);
    res.status(500).json({ error: "Failed to update sheet" });
  }
});

// Calculate and update totals for a sheet
router.post("/sheets/:id/calculate", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const sheetId = Number(req.params.id);
    const sheet = await storage.getTrueCostSheet(sheetId);
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }
    if (sheet.contractorId !== contractorId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [laborItems, equipmentItems, materialItems, overheadItems] = await Promise.all([
      storage.getTrueCostLaborItems(sheetId),
      storage.getTrueCostEquipmentItems(sheetId),
      storage.getTrueCostMaterialItems(sheetId),
      storage.getTrueCostOverheadItems(sheetId),
    ]);

    // Calculate totals
    const directLaborCost = laborItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    const equipmentCost = equipmentItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    const materialsCost = materialItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    const overheadCost = overheadItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

    const directCosts = directLaborCost + equipmentCost + materialsCost;
    const contingencyPercent = Number(sheet.contingencyPercent || 0);
    const contingencyCost = directCosts * (contingencyPercent / 100);
    const totalJobCost = directCosts + overheadCost + contingencyCost;

    const bidRevenue = Number(sheet.bidRevenue || 0);
    const grossProfit = bidRevenue - directCosts;
    const netProfit = bidRevenue - totalJobCost;
    const netMarginPercent = bidRevenue > 0 ? (netProfit / bidRevenue) * 100 : 0;
    const plannedDays = sheet.plannedDays || 1;
    const profitPerDay = netProfit / plannedDays;
    const breakEvenBid = totalJobCost;

    // Estimate cash needed upfront (materials + first week payroll + equipment deposits)
    const weeklyLabor = directLaborCost / Math.max(plannedDays / 5, 1);
    const materialDeposit = materialsCost * 0.5;
    const equipmentDeposit = equipmentCost * 0.25;
    const cashNeededUpfront = weeklyLabor + materialDeposit + equipmentDeposit;

    const updatedSheet = await storage.updateTrueCostSheet(sheetId, {
      directLaborCost: directLaborCost.toFixed(2),
      equipmentCost: equipmentCost.toFixed(2),
      materialsCost: materialsCost.toFixed(2),
      overheadCost: overheadCost.toFixed(2),
      contingencyCost: contingencyCost.toFixed(2),
      totalJobCost: totalJobCost.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      netProfit: netProfit.toFixed(2),
      netMarginPercent: netMarginPercent.toFixed(2),
      breakEvenBid: breakEvenBid.toFixed(2),
      profitPerDay: profitPerDay.toFixed(2),
      cashNeededUpfront: cashNeededUpfront.toFixed(2),
    });

    // Generate warnings
    const warnings: string[] = [];
    if (netProfit < 0) warnings.push("You are below break-even.");
    if (directLaborCost === 0) warnings.push("No labor costs added.");
    if (equipmentCost === 0 && materialsCost === 0) warnings.push("No equipment or materials added.");
    if (laborItems.some(item => Number(item.burdenPercent || 0) === 0)) {
      warnings.push("Labor burden is 0% on some items — add burden to avoid underpricing.");
    }
    if (equipmentItems.some(item => item.ownership === "owned" && Number(item.maintenanceReservePerHr || 0) === 0)) {
      warnings.push("Owned equipment has no maintenance reserve — confirm true cost.");
    }
    if (Number(sheet.contingencyPercent || 0) === 0) {
      warnings.push("No contingency added — consider adding 5-10% for unknowns.");
    }

    res.json({
      sheet: updatedSheet,
      warnings,
      summary: {
        bidRevenue,
        directLaborCost,
        equipmentCost,
        materialsCost,
        overheadCost,
        contingencyCost,
        totalJobCost,
        grossProfit,
        netProfit,
        netMarginPercent,
        breakEvenBid,
        profitPerDay,
        cashNeededUpfront,
        isProfitable: netProfit > 0,
        profitStatus: netProfit > 0 ? "profitable" : netProfit === 0 ? "break_even" : "loss",
      },
    });
  } catch (error) {
    console.error("Error calculating TrueCost sheet:", error);
    res.status(500).json({ error: "Failed to calculate sheet" });
  }
});

// Lock/unlock sheet version
router.post("/sheets/:id/lock", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const { lock } = req.body;
    const sheet = await storage.updateTrueCostSheet(Number(req.params.id), {
      status: lock ? "locked" : "draft",
    });
    res.json(sheet);
  } catch (error) {
    console.error("Error locking TrueCost sheet:", error);
    res.status(500).json({ error: "Failed to lock sheet" });
  }
});

// Duplicate sheet as new scenario
router.post("/sheets/:id/duplicate", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const original = await storage.getTrueCostSheet(Number(req.params.id));
    if (!original) {
      return res.status(404).json({ error: "Sheet not found" });
    }

    const { scenarioName } = req.body;
    const newSheet = await storage.createTrueCostSheet({
      ...original,
      id: undefined,
      contractorId,
      versionNumber: (original.versionNumber || 1) + 1,
      status: "draft",
      notes: scenarioName || `Copy of version ${original.versionNumber}`,
    });

    // Copy all line items
    const [laborItems, equipmentItems, materialItems, overheadItems] = await Promise.all([
      storage.getTrueCostLaborItems(original.id),
      storage.getTrueCostEquipmentItems(original.id),
      storage.getTrueCostMaterialItems(original.id),
      storage.getTrueCostOverheadItems(original.id),
    ]);

    await Promise.all([
      ...laborItems.map(item => storage.createTrueCostLaborItem({ ...item, id: undefined, sheetId: newSheet.id })),
      ...equipmentItems.map(item => storage.createTrueCostEquipmentItem({ ...item, id: undefined, sheetId: newSheet.id })),
      ...materialItems.map(item => storage.createTrueCostMaterialItem({ ...item, id: undefined, sheetId: newSheet.id })),
      ...overheadItems.map(item => storage.createTrueCostOverheadItem({ ...item, id: undefined, sheetId: newSheet.id })),
    ]);

    res.status(201).json(newSheet);
  } catch (error) {
    console.error("Error duplicating TrueCost sheet:", error);
    res.status(500).json({ error: "Failed to duplicate sheet" });
  }
});

// ============================================================================
// Labor Items
// ============================================================================

router.post("/labor", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const validatedData = insertTrueCostLaborItemSchema.parse(req.body) as any;
    
    // Calculate total cost
    const qty = validatedData.quantity || 1;
    const baseRate = Number(validatedData.baseRate || 0);
    const burdenPercent = Number(validatedData.burdenPercent || 0);
    const regHours = Number(validatedData.regHours || 0);
    const otHours = Number(validatedData.otHours || 0);
    const otMultiplier = Number(validatedData.otMultiplier || 1.5);
    const perDiem = Number(validatedData.perDiemPerDay || 0);
    const lodging = Number(validatedData.lodgingPerNight || 0);
    const travel = Number(validatedData.travelAllowance || 0);

    const baseCost = (regHours * baseRate) + (otHours * baseRate * otMultiplier);
    const burdenCost = baseCost * (burdenPercent / 100);
    const totalCost = ((baseCost + burdenCost) * qty) + perDiem + lodging + travel;

    const item = await storage.createTrueCostLaborItem({
      ...validatedData,
      totalCost: totalCost.toFixed(2),
    });
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating labor item:", error);
    res.status(500).json({ error: "Failed to create labor item" });
  }
});

router.patch("/labor/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const partialSchema = insertTrueCostLaborItemSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const item = await storage.updateTrueCostLaborItem(Number(req.params.id), validatedData);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating labor item:", error);
    res.status(500).json({ error: "Failed to update labor item" });
  }
});

router.delete("/labor/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    await storage.deleteTrueCostLaborItem(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting labor item:", error);
    res.status(500).json({ error: "Failed to delete labor item" });
  }
});

// ============================================================================
// Equipment Items
// ============================================================================

router.post("/equipment", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const validatedData = insertTrueCostEquipmentItemSchema.parse(req.body) as any;
    
    // Calculate total cost
    const rate = Number(validatedData.rate || 0);
    const hoursPerDay = Number(validatedData.hoursPerDay || 8);
    const daysUsed = Number(validatedData.daysUsed || 1);
    const fuelCost = Number(validatedData.fuelCost || 0);
    const maintenancePerHr = Number(validatedData.maintenanceReservePerHr || 0);
    const insurancePerDay = Number(validatedData.insuranceAllocPerDay || 0);
    const mobilization = Number(validatedData.mobilizationOneTime || 0);

    let baseCost = 0;
    switch (validatedData.rateType) {
      case "hourly":
        baseCost = rate * hoursPerDay * daysUsed;
        break;
      case "daily":
        baseCost = rate * daysUsed;
        break;
      case "weekly":
        baseCost = rate * Math.ceil(daysUsed / 5);
        break;
      case "per_job":
        baseCost = rate;
        break;
    }

    const maintenanceCost = maintenancePerHr * hoursPerDay * daysUsed;
    const insuranceCost = insurancePerDay * daysUsed;
    const totalCost = baseCost + fuelCost + maintenanceCost + insuranceCost + mobilization;

    const item = await storage.createTrueCostEquipmentItem({
      ...validatedData,
      totalCost: totalCost.toFixed(2),
    });
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating equipment item:", error);
    res.status(500).json({ error: "Failed to create equipment item" });
  }
});

router.patch("/equipment/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const partialSchema = insertTrueCostEquipmentItemSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const item = await storage.updateTrueCostEquipmentItem(Number(req.params.id), validatedData);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating equipment item:", error);
    res.status(500).json({ error: "Failed to update equipment item" });
  }
});

router.delete("/equipment/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    await storage.deleteTrueCostEquipmentItem(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment item:", error);
    res.status(500).json({ error: "Failed to delete equipment item" });
  }
});

// ============================================================================
// Material Items
// ============================================================================

router.post("/materials", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const validatedData = insertTrueCostMaterialItemSchema.parse(req.body) as any;
    
    const unitCost = Number(validatedData.unitCost || 0);
    const quantity = Number(validatedData.quantity || 1);
    const taxShipping = Number(validatedData.taxShipping || 0);
    const wasteFactor = Number(validatedData.wasteFactorPercent || 0);

    const baseCost = unitCost * quantity;
    const wasteCost = baseCost * (wasteFactor / 100);
    const totalCost = baseCost + wasteCost + taxShipping;

    const item = await storage.createTrueCostMaterialItem({
      ...validatedData,
      totalCost: totalCost.toFixed(2),
    });
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating material item:", error);
    res.status(500).json({ error: "Failed to create material item" });
  }
});

router.patch("/materials/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const partialSchema = insertTrueCostMaterialItemSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const item = await storage.updateTrueCostMaterialItem(Number(req.params.id), validatedData);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating material item:", error);
    res.status(500).json({ error: "Failed to update material item" });
  }
});

router.delete("/materials/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    await storage.deleteTrueCostMaterialItem(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting material item:", error);
    res.status(500).json({ error: "Failed to delete material item" });
  }
});

// ============================================================================
// Overhead Items
// ============================================================================

router.post("/overhead", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const validatedData = insertTrueCostOverheadItemSchema.parse(req.body) as any;
    
    // For now, totalCost equals amount (can be enhanced for percent_of_revenue later)
    const totalCost = Number(validatedData.amount || 0);

    const item = await storage.createTrueCostOverheadItem({
      ...validatedData,
      totalCost: totalCost.toFixed(2),
    });
    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error creating overhead item:", error);
    res.status(500).json({ error: "Failed to create overhead item" });
  }
});

router.patch("/overhead/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const partialSchema = insertTrueCostOverheadItemSchema.partial();
    const validatedData = partialSchema.parse(req.body);
    const item = await storage.updateTrueCostOverheadItem(Number(req.params.id), validatedData);
    res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    console.error("Error updating overhead item:", error);
    res.status(500).json({ error: "Failed to update overhead item" });
  }
});

router.delete("/overhead/:id", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    await storage.deleteTrueCostOverheadItem(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting overhead item:", error);
    res.status(500).json({ error: "Failed to delete overhead item" });
  }
});

// ============================================================================
// Storm Crew Templates
// ============================================================================

router.get("/templates", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const templates = await storage.getStormCrewTemplates(contractorId);
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.post("/templates", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const contractorId = (req as any).userId;
    const template = await storage.createStormCrewTemplate({ ...req.body, contractorId });
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Apply template to a sheet
router.post("/sheets/:sheetId/apply-template/:templateId", requireAuth, requireContractor, async (req: Request, res: Response) => {
  try {
    const sheetId = Number(req.params.sheetId);
    const template = await storage.getStormCrewTemplate(Number(req.params.templateId));
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const laborItems = (template.laborItems as any[]) || [];
    const equipmentItems = (template.equipmentItems as any[]) || [];

    await Promise.all([
      ...laborItems.map(item => storage.createTrueCostLaborItem({ ...item, sheetId })),
      ...equipmentItems.map(item => storage.createTrueCostEquipmentItem({ ...item, sheetId })),
    ]);

    res.json({ success: true, message: `Applied ${laborItems.length} labor items and ${equipmentItems.length} equipment items` });
  } catch (error) {
    console.error("Error applying template:", error);
    res.status(500).json({ error: "Failed to apply template" });
  }
});

export default router;
