export interface StateLienLaw {
  state: string;
  stateCode: string;
  preliminaryNotice: {
    required: boolean;
    deadline: string;
    recipientTypes: string[];
    description: string;
  };
  lienDeadline: {
    fromCompletionDays: number;
    fromLastWorkDays: number;
    description: string;
  };
  foreClosureDeadline: {
    fromFilingDays: number;
    description: string;
  };
  noticeOfIntent: {
    required: boolean;
    daysBeforeFiling: number;
    description: string;
  };
  requiredInfo: string[];
  specialRequirements: string[];
  filingFee: { min: number; max: number };
  contractorLicenseRequired: boolean;
}

export const stateLienLaws: Record<string, StateLienLaw> = {
  AL: {
    state: "Alabama",
    stateCode: "AL",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required in Alabama"
    },
    lienDeadline: {
      fromCompletionDays: 180,
      fromLastWorkDays: 180,
      description: "Must file within 6 months from last furnishing of labor/materials"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must enforce within 6 months of filing the lien"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property legal description", "Owner name", "Contractor name", "Amount claimed", "Work description"],
    specialRequirements: ["Must be sworn/notarized"],
    filingFee: { min: 15, max: 50 },
    contractorLicenseRequired: true
  },
  AK: {
    state: "Alaska",
    stateCode: "AK",
    preliminaryNotice: {
      required: true,
      deadline: "15 days after first work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Notice to owner required within 15 days of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from completion of project"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must enforce within 6 months of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner info", "Claimant info", "Amount", "Completion date"],
    specialRequirements: ["Must include preliminary notice copy if required"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  AZ: {
    state: "Arizona",
    stateCode: "AZ",
    preliminaryNotice: {
      required: true,
      deadline: "20 days after first work",
      recipientTypes: ["Owner", "General Contractor", "Construction Lender"],
      description: "20-Day Preliminary Notice required for lien rights"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must record within 120 days from completion or cessation of work"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Amount claimed", "Work performed", "First/last work dates"],
    specialRequirements: ["Must serve copy on owner within 5 days of recording"],
    filingFee: { min: 30, max: 75 },
    contractorLicenseRequired: true
  },
  CA: {
    state: "California",
    stateCode: "CA",
    preliminaryNotice: {
      required: true,
      deadline: "20 days after first work",
      recipientTypes: ["Owner", "General Contractor", "Construction Lender"],
      description: "20-Day Preliminary Notice required to preserve lien rights"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must record within 90 days from completion (direct) or 60 days from Notice of Completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 90,
      description: "Must foreclose within 90 days of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required but recommended"
    },
    requiredInfo: ["Property description", "Owner name", "Direct contractor name", "Amount", "Work description", "Labor/material dates"],
    specialRequirements: ["Must serve copy on owner within 10 days", "Different rules for owner-occupied residences"],
    filingFee: { min: 50, max: 125 },
    contractorLicenseRequired: true
  },
  CO: {
    state: "Colorado",
    stateCode: "CO",
    preliminaryNotice: {
      required: true,
      deadline: "10 days before filing lien",
      recipientTypes: ["Owner"],
      description: "Notice of Intent to File required 10 business days before recording"
    },
    lienDeadline: {
      fromCompletionDays: 60,
      fromLastWorkDays: 60,
      description: "Must file within 4 months from last furnishing (2 months for subcontractors after Notice of Completion)"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of filing"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 10,
      description: "Notice of Intent required 10 business days before filing"
    },
    requiredInfo: ["Property description", "Owner name", "Amount", "Work dates", "Statement of account"],
    specialRequirements: ["Notice of Intent must be served before lien can be filed"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  FL: {
    state: "Florida",
    stateCode: "FL",
    preliminaryNotice: {
      required: true,
      deadline: "45 days after first work",
      recipientTypes: ["Owner", "General Contractor", "Lender"],
      description: "Notice to Owner required within 45 days of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must record within 90 days from final furnishing of labor/materials"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property legal description", "Owner name and address", "Lienor name", "General contractor name", "Amount", "Description of services"],
    specialRequirements: ["Must serve Notice to Owner to preserve rights", "Contractor's Final Payment Affidavit common"],
    filingFee: { min: 10, max: 35 },
    contractorLicenseRequired: true
  },
  GA: {
    state: "Georgia",
    stateCode: "GA",
    preliminaryNotice: {
      required: true,
      deadline: "30 days after visible work begins",
      recipientTypes: ["Owner"],
      description: "Notice of Commencement must be filed before visible work begins"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion or abandonment"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 12 months of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Amount", "Labor/material dates", "Work description"],
    specialRequirements: ["Must serve on owner within 2 business days of filing"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: true
  },
  TX: {
    state: "Texas",
    stateCode: "TX",
    preliminaryNotice: {
      required: true,
      deadline: "15 days after each month's work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Monthly notices required by 15th of following month"
    },
    lienDeadline: {
      fromCompletionDays: 40,
      fromLastWorkDays: 40,
      description: "Must file affidavit within 30 days (GC) or 40 days (subs) after project completion or abandonment"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years for residential, 4 years commercial"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Dates of work"],
    specialRequirements: ["Complex notice requirements", "Different rules for residential vs commercial", "Retainage notices important"],
    filingFee: { min: 30, max: 100 },
    contractorLicenseRequired: false
  },
  NY: {
    state: "New York",
    stateCode: "NY",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required in New York"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 8 months (private) from last work, 30 days (public improvements)"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Amount", "Labor/material furnished", "Work dates"],
    specialRequirements: ["Must serve on owner within 30 days of filing", "Affidavit of service required"],
    filingFee: { min: 40, max: 125 },
    contractorLicenseRequired: true
  },
  NC: {
    state: "North Carolina",
    stateCode: "NC",
    preliminaryNotice: {
      required: true,
      deadline: "Upon first furnishing",
      recipientTypes: ["Owner"],
      description: "Subcontractors must give Notice to Lien Agent within 15 days"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must enforce within 180 days of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner info", "Contractor info", "Amount", "Description of work"],
    specialRequirements: ["Lien Agent system for residential construction", "Must identify Lien Agent on Notice of Commencement"],
    filingFee: { min: 26, max: 64 },
    contractorLicenseRequired: true
  },
  LA: {
    state: "Louisiana",
    stateCode: "LA",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required (called Privileges in LA)"
    },
    lienDeadline: {
      fromCompletionDays: 60,
      fromLastWorkDays: 60,
      description: "Must file statement within 60 days from substantial completion or abandonment"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must enforce within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work description"],
    specialRequirements: ["Called 'Privileges' not liens", "Notice of Contract recommended for subs"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: true
  },
  OH: {
    state: "Ohio",
    stateCode: "OH",
    preliminaryNotice: {
      required: true,
      deadline: "21 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice of Furnishing required within 21 days for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 60,
      fromLastWorkDays: 75,
      description: "Must file within 60 days from completion (GC) or 75 days (subs)"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 years from last work"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant name", "Amount", "Work/material dates"],
    specialRequirements: ["Must serve copy on owner by certified mail or personal service"],
    filingFee: { min: 28, max: 75 },
    contractorLicenseRequired: false
  },
  PA: {
    state: "Pennsylvania",
    stateCode: "PA",
    preliminaryNotice: {
      required: true,
      deadline: "Before starting work",
      recipientTypes: ["Owner"],
      description: "Notice of Furnishing and Notice of Commencement may be required"
    },
    lienDeadline: {
      fromCompletionDays: 180,
      fromLastWorkDays: 180,
      description: "Must file within 6 months from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Contractor info", "Amount", "Work description"],
    specialRequirements: ["Different requirements for residential vs commercial", "Waivers common"],
    filingFee: { min: 40, max: 150 },
    contractorLicenseRequired: false
  },
  IL: {
    state: "Illinois",
    stateCode: "IL",
    preliminaryNotice: {
      required: true,
      deadline: "60 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice required for subcontractors within 60 days"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must record within 4 months from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of last work"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Subcontract info"],
    specialRequirements: ["Must serve on owner within 30 days of recording"],
    filingFee: { min: 30, max: 100 },
    contractorLicenseRequired: false
  },
  MI: {
    state: "Michigan",
    stateCode: "MI",
    preliminaryNotice: {
      required: true,
      deadline: "20 days after first work",
      recipientTypes: ["Owner", "General Contractor", "Designee"],
      description: "Notice of Furnishing required within 20 days"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must record within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Lien claimant info", "Amount", "Work description"],
    specialRequirements: ["Sworn statement from subcontractors may be required by owner"],
    filingFee: { min: 25, max: 50 },
    contractorLicenseRequired: true
  },
  NJ: {
    state: "New Jersey",
    stateCode: "NJ",
    preliminaryNotice: {
      required: true,
      deadline: "60 days after last work",
      recipientTypes: ["Owner"],
      description: "Notice of Unpaid Balance/Right to File Lien required within 60 days after last work"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from the date the Notice of Unpaid Balance is served"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 10,
      description: "Notice of Unpaid Balance must be served before filing"
    },
    requiredInfo: ["Property description", "Owner name", "Contractor info", "Amount", "Work dates"],
    specialRequirements: ["Must file in 90 days after serving Notice of Unpaid Balance"],
    filingFee: { min: 30, max: 75 },
    contractorLicenseRequired: true
  },
  VA: {
    state: "Virginia",
    stateCode: "VA",
    preliminaryNotice: {
      required: true,
      deadline: "30 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice to Owner required within 30 days for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must enforce within 6 months of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Description of work"],
    specialRequirements: ["Must serve copy on owner within 30 days of recording"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: true
  },
  WA: {
    state: "Washington",
    stateCode: "WA",
    preliminaryNotice: {
      required: true,
      deadline: "60 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice to Owner required within 60 days for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from cessation of work"
    },
    foreClosureDeadline: {
      fromFilingDays: 240,
      description: "Must foreclose within 8 months of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Lien claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must serve on owner within 14 days of recording"],
    filingFee: { min: 85, max: 150 },
    contractorLicenseRequired: true
  },
  MA: {
    state: "Massachusetts",
    stateCode: "MA",
    preliminaryNotice: {
      required: true,
      deadline: "60 days after contract or 30 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice of Contract or Notice of Subcontract required"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from dissolution of statement of account"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Labor/material dates"],
    specialRequirements: ["Must dissolve within 90 days or file Statement of Account"],
    filingFee: { min: 75, max: 125 },
    contractorLicenseRequired: true
  },
  SC: {
    state: "South Carolina",
    stateCode: "SC",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from cessation of work"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work description"],
    specialRequirements: ["Must serve on owner within 10 days of filing"],
    filingFee: { min: 25, max: 60 },
    contractorLicenseRequired: true
  },
  TN: {
    state: "Tennessee",
    stateCode: "TN",
    preliminaryNotice: {
      required: true,
      deadline: "90 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice to Owner required within 90 days for remote contractors"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 10,
      description: "Notice of Non-Payment required 10 days before filing for commercial"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Different rules for commercial vs residential"],
    filingFee: { min: 25, max: 50 },
    contractorLicenseRequired: true
  },
  MD: {
    state: "Maryland",
    stateCode: "MD",
    preliminaryNotice: {
      required: true,
      deadline: "120 days after completion",
      recipientTypes: ["Owner"],
      description: "Notice of Intent to Claim Lien required 45+ days before filing"
    },
    lienDeadline: {
      fromCompletionDays: 180,
      fromLastWorkDays: 180,
      description: "Must file within 180 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 45,
      description: "Notice of Intent required 45+ days before filing"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work description"],
    specialRequirements: ["Must send Notice of Intent before filing"],
    filingFee: { min: 40, max: 100 },
    contractorLicenseRequired: true
  },
  MO: {
    state: "Missouri",
    stateCode: "MO",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 180,
      fromLastWorkDays: 180,
      description: "Must file within 6 months from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Different requirements for residential projects"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  IN: {
    state: "Indiana",
    stateCode: "IN",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 10,
      description: "Copy of lien must be sent to owner within 10 days of recording"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must send copy to owner after recording"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  WI: {
    state: "Wisconsin",
    stateCode: "WI",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 180,
      fromLastWorkDays: 180,
      description: "Must file within 6 months from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of last work performed"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Specific language required in lien claim"],
    filingFee: { min: 30, max: 75 },
    contractorLicenseRequired: false
  },
  MN: {
    state: "Minnesota",
    stateCode: "MN",
    preliminaryNotice: {
      required: true,
      deadline: "45 days after first work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Pre-lien notice required within 45 days of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Pre-lien notice essential for subcontractors"],
    filingFee: { min: 46, max: 100 },
    contractorLicenseRequired: true
  },
  NV: {
    state: "Nevada",
    stateCode: "NV",
    preliminaryNotice: {
      required: true,
      deadline: "31 days after first work",
      recipientTypes: ["Owner", "General Contractor", "Lender"],
      description: "Notice of Right to Lien required within 31 days"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from cessation of work"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of recording"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 15,
      description: "Stop Notice required 15 days before filing"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Stop Notice required before filing"],
    filingFee: { min: 30, max: 75 },
    contractorLicenseRequired: true
  },
  OR: {
    state: "Oregon",
    stateCode: "OR",
    preliminaryNotice: {
      required: true,
      deadline: "8 days after first work",
      recipientTypes: ["Owner", "Mortgagee"],
      description: "Notice of Right to Lien required within 8 business days"
    },
    lienDeadline: {
      fromCompletionDays: 75,
      fromLastWorkDays: 75,
      description: "Must file within 75 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 120,
      description: "Must foreclose within 120 days of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Notice of Right to Lien very strict deadline"],
    filingFee: { min: 50, max: 125 },
    contractorLicenseRequired: true
  },
  UT: {
    state: "Utah",
    stateCode: "UT",
    preliminaryNotice: {
      required: true,
      deadline: "20 days after first work",
      recipientTypes: ["Owner"],
      description: "Preliminary Notice required within 20 days using state registry"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 180 days of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must use State Construction Registry for preliminary notice"],
    filingFee: { min: 35, max: 100 },
    contractorLicenseRequired: true
  },
  OK: {
    state: "Oklahoma",
    stateCode: "OK",
    preliminaryNotice: {
      required: true,
      deadline: "75 days after first work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Pre-lien notice required within 75 days of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Pre-lien notice important for subcontractors"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  CT: {
    state: "Connecticut",
    stateCode: "CT",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must serve on owner within 30 days of recording"],
    filingFee: { min: 30, max: 75 },
    contractorLicenseRequired: true
  },
  AR: {
    state: "Arkansas",
    stateCode: "AR",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 455,
      description: "Must foreclose within 15 months of last work"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified/notarized"],
    filingFee: { min: 15, max: 50 },
    contractorLicenseRequired: true
  },
  KS: {
    state: "Kansas",
    stateCode: "KS",
    preliminaryNotice: {
      required: true,
      deadline: "3 months after first work",
      recipientTypes: ["Owner"],
      description: "Notice required within 3 months of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Notice timeline important for subcontractors"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  MS: {
    state: "Mississippi",
    stateCode: "MS",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Called 'materialman's liens'"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  IA: {
    state: "Iowa",
    stateCode: "IA",
    preliminaryNotice: {
      required: true,
      deadline: "90 days after first work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Preliminary Notice required within 90 days for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of last work"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Preliminary notice critical for residential construction"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  KY: {
    state: "Kentucky",
    stateCode: "KY",
    preliminaryNotice: {
      required: true,
      deadline: "75 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice to Owner required within 75 days of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 60,
      fromLastWorkDays: 60,
      description: "Must file within 60 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Short lien deadline - 60 days"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  NE: {
    state: "Nebraska",
    stateCode: "NE",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified/sworn"],
    filingFee: { min: 15, max: 50 },
    contractorLicenseRequired: false
  },
  NM: {
    state: "New Mexico",
    stateCode: "NM",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified/sworn"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: true
  },
  WV: {
    state: "West Virginia",
    stateCode: "WV",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 100,
      fromLastWorkDays: 100,
      description: "Must file within 100 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: true
  },
  ID: {
    state: "Idaho",
    stateCode: "ID",
    preliminaryNotice: {
      required: true,
      deadline: "20 days after first work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Notice of Furnishing required within 20 days"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Notice of Furnishing essential for subcontractors"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  HI: {
    state: "Hawaii",
    stateCode: "HI",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 45,
      fromLastWorkDays: 45,
      description: "Must file within 45 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 90,
      description: "Must foreclose within 3 months of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Very short deadlines - 45 days to file"],
    filingFee: { min: 30, max: 100 },
    contractorLicenseRequired: true
  },
  NH: {
    state: "New Hampshire",
    stateCode: "NH",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  ME: {
    state: "Maine",
    stateCode: "ME",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified/sworn"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  RI: {
    state: "Rhode Island",
    stateCode: "RI",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 200,
      fromLastWorkDays: 200,
      description: "Must file within 200 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be recorded in town where property located"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: true
  },
  MT: {
    state: "Montana",
    stateCode: "MT",
    preliminaryNotice: {
      required: true,
      deadline: "20 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice required within 20 days for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from cessation of work"
    },
    foreClosureDeadline: {
      fromFilingDays: 730,
      description: "Must foreclose within 2 years of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Notice of Right to Claim Lien required for subs"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  DE: {
    state: "Delaware",
    stateCode: "DE",
    preliminaryNotice: {
      required: true,
      deadline: "60 days after contract",
      recipientTypes: ["Owner"],
      description: "Statement of Claim Notice required within 60 days"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must record in proper prothonotary office"],
    filingFee: { min: 30, max: 75 },
    contractorLicenseRequired: false
  },
  SD: {
    state: "South Dakota",
    stateCode: "SD",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 6 months of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be verified"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  ND: {
    state: "North Dakota",
    stateCode: "ND",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 1095,
      description: "Must foreclose within 3 years of last work"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Long foreclosure period - 3 years"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  AK_FULL: {
    state: "Alaska",
    stateCode: "AK",
    preliminaryNotice: {
      required: true,
      deadline: "15 days after first work",
      recipientTypes: ["Owner", "General Contractor"],
      description: "Notice to owner required within 15 days of first furnishing"
    },
    lienDeadline: {
      fromCompletionDays: 120,
      fromLastWorkDays: 120,
      description: "Must file within 120 days from completion of project"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must enforce within 6 months of recording"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner info", "Claimant info", "Amount", "Completion date"],
    specialRequirements: ["Must include preliminary notice copy if required"],
    filingFee: { min: 25, max: 75 },
    contractorLicenseRequired: false
  },
  VT: {
    state: "Vermont",
    stateCode: "VT",
    preliminaryNotice: {
      required: false,
      deadline: "N/A",
      recipientTypes: [],
      description: "No preliminary notice required"
    },
    lienDeadline: {
      fromCompletionDays: 180,
      fromLastWorkDays: 180,
      description: "Must file within 180 days from last furnishing"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Must be recorded in town clerk's office"],
    filingFee: { min: 15, max: 50 },
    contractorLicenseRequired: false
  },
  WY: {
    state: "Wyoming",
    stateCode: "WY",
    preliminaryNotice: {
      required: true,
      deadline: "Before filing lien",
      recipientTypes: ["Owner"],
      description: "Notice required before filing for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 150,
      fromLastWorkDays: 150,
      description: "Must file within 150 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 180,
      description: "Must foreclose within 180 days of filing"
    },
    noticeOfIntent: {
      required: false,
      daysBeforeFiling: 0,
      description: "No notice of intent required"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Notice important for subcontractors"],
    filingFee: { min: 20, max: 50 },
    contractorLicenseRequired: false
  },
  DC: {
    state: "District of Columbia",
    stateCode: "DC",
    preliminaryNotice: {
      required: true,
      deadline: "90 days after first work",
      recipientTypes: ["Owner"],
      description: "Notice of Intent required 90 days after start for subcontractors"
    },
    lienDeadline: {
      fromCompletionDays: 90,
      fromLastWorkDays: 90,
      description: "Must file within 90 days from completion"
    },
    foreClosureDeadline: {
      fromFilingDays: 365,
      description: "Must foreclose within 1 year of filing"
    },
    noticeOfIntent: {
      required: true,
      daysBeforeFiling: 45,
      description: "Notice of Intent required 45 days before filing"
    },
    requiredInfo: ["Property description", "Owner name", "Claimant info", "Amount", "Work dates"],
    specialRequirements: ["Notice of Intent timeline specific to DC"],
    filingFee: { min: 40, max: 100 },
    contractorLicenseRequired: true
  }
};

export function getLienLaw(stateCode: string): StateLienLaw | null {
  return stateLienLaws[stateCode.toUpperCase()] || null;
}

export function calculateLienDeadline(stateCode: string, lastWorkDate: Date): { deadline: Date; daysRemaining: number } {
  const law = getLienLaw(stateCode);
  if (!law) {
    return { deadline: new Date(), daysRemaining: 0 };
  }
  
  const deadline = new Date(lastWorkDate);
  deadline.setDate(deadline.getDate() + law.lienDeadline.fromLastWorkDays);
  
  const today = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return { deadline, daysRemaining };
}

export function getStatesList(): { code: string; name: string }[] {
  return Object.values(stateLienLaws).map(law => ({
    code: law.stateCode,
    name: law.state
  }));
}
