import OpenAI from 'openai';

const FIELD_SYNONYMS: Record<string, string> = {
  "federal tax identification number": "ein",
  "federal tax id": "ein",
  "fein": "ein",
  "tax id": "ein",
  "tax identification number": "ein",
  "employer id": "ein",
  "employer identification number": "ein",
  "tin": "ein",
  "ssn/ein": "ein",

  "legal business name": "legalName",
  "legal name": "legalName",
  "company name": "businessName",
  "business name": "businessName",
  "firm name": "businessName",
  "dba": "businessName",
  "doing business as": "businessName",
  "entity name": "legalName",
  "organization name": "businessName",
  "vendor name": "businessName",
  "contractor name": "businessName",
  "applicant name": "businessName",

  "owner name": "ownerName",
  "principal": "ownerName",
  "primary point of contact": "ownerName",
  "authorized representative": "ownerName",
  "authorized signer": "ownerName",
  "contact name": "ownerName",
  "primary contact": "ownerName",
  "poc": "ownerName",
  "signatory": "ownerName",
  "responsible party": "ownerName",

  "title": "ownerTitle",
  "owner title": "ownerTitle",
  "position": "ownerTitle",
  "job title": "ownerTitle",

  "email": "ownerEmail",
  "email address": "ownerEmail",
  "contact email": "ownerEmail",
  "e-mail": "ownerEmail",

  "phone": "ownerPhone",
  "phone number": "ownerPhone",
  "telephone": "ownerPhone",
  "contact phone": "ownerPhone",
  "business phone": "ownerPhone",
  "mobile": "ownerPhone",
  "cell phone": "ownerPhone",

  "street address": "address",
  "mailing address": "address",
  "physical address": "address",
  "business address": "address",
  "address line 1": "address",
  "address": "address",
  "principal place of business": "address",

  "city": "city",
  "city/town": "city",

  "state": "state",
  "state/province": "state",

  "zip": "zip",
  "zip code": "zip",
  "postal code": "zip",
  "zip/postal code": "zip",

  "uei": "uei",
  "unique entity id": "uei",
  "unique entity identifier": "uei",
  "duns": "uei",
  "duns number": "uei",
  "sam uei": "uei",

  "cage code": "cageCode",
  "cage": "cageCode",
  "commercial and government entity": "cageCode",

  "naics": "naicsCodes",
  "naics code": "naicsCodes",
  "naics codes": "naicsCodes",
  "sic code": "naicsCodes",
  "industry code": "naicsCodes",
  "primary naics": "naicsCodes",

  "business type": "businessType",
  "entity type": "businessType",
  "type of organization": "businessType",
  "organizational structure": "businessType",
  "business structure": "businessType",

  "insurance company": "insuranceProvider",
  "insurance provider": "insuranceProvider",
  "insurer": "insuranceProvider",
  "underwriter": "insuranceProvider",

  "policy number": "insurancePolicyNumber",
  "insurance policy": "insurancePolicyNumber",
  "policy #": "insurancePolicyNumber",

  "certificate holder": "businessName",
  "gl limits": "insuranceLimits",
  "general liability limits": "insuranceLimits",
  "workers comp": "insuranceLimits",
  "workers compensation": "insuranceLimits",
  "umbrella limit": "insuranceLimits",

  "insurance expiry": "insuranceExpiry",
  "insurance expiration": "insuranceExpiry",
  "policy expiration date": "insuranceExpiry",
  "coverage end date": "insuranceExpiry",

  "bank name": "bankName",
  "financial institution": "bankName",
  "depository name": "bankName",

  "routing number": "bankRoutingNumber",
  "aba routing": "bankRoutingNumber",
  "aba routing number": "bankRoutingNumber",
  "aba number": "bankRoutingNumber",
  "transit number": "bankRoutingNumber",

  "account number": "bankAccountNumber",
  "bank account number": "bankAccountNumber",
  "checking account": "bankAccountNumber",
  "deposit account": "bankAccountNumber",
};

export class AutoFormFillerService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async extractDocumentData(docType: string, textContent: string): Promise<any> {
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a document data extraction AI specialized in contractor/business documents. Extract all key-value pairs from the provided ${docType} document text. Return a JSON object with extracted fields. Common fields include: business name, EIN, address, owner name, insurance details, banking info, certifications, etc. Be thorough and extract every identifiable piece of data.`
            },
            {
              role: "user",
              content: `Extract structured data from this ${docType} document:\n\n${textContent}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      } catch (error) {
        console.error("OpenAI extraction error:", error);
      }
    }

    return this.simulateExtraction(docType, textContent);
  }

  async detectFormFields(formText: string): Promise<{ fields: { label: string; fieldType: string }[] }> {
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a form field detection AI. Analyze the provided form text and identify all fillable fields. Return a JSON object with a "fields" array, where each item has "label" (the field label/name) and "fieldType" (text, date, number, checkbox, select, signature, etc.).`
            },
            {
              role: "user",
              content: `Detect all fillable fields in this form:\n\n${formText}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      } catch (error) {
        console.error("OpenAI field detection error:", error);
      }
    }

    return this.simulateFieldDetection(formText);
  }

  mapFieldsToProfile(
    fields: { label: string; fieldType?: string }[],
    profile: any
  ): { mappings: { formLabel: string; mappedTo: string; value: any; confidence: number }[]; missing: string[] } {
    const mappings: { formLabel: string; mappedTo: string; value: any; confidence: number }[] = [];
    const missing: string[] = [];

    for (const field of fields) {
      const normalizedLabel = field.label.toLowerCase().trim();
      let bestMatch: string | null = null;
      let confidence = 0;

      if (FIELD_SYNONYMS[normalizedLabel]) {
        bestMatch = FIELD_SYNONYMS[normalizedLabel];
        confidence = 0.98;
      }

      if (!bestMatch) {
        for (const [synonym, profileKey] of Object.entries(FIELD_SYNONYMS)) {
          if (normalizedLabel.includes(synonym) || synonym.includes(normalizedLabel)) {
            bestMatch = profileKey;
            confidence = 0.85;
            break;
          }
        }
      }

      if (!bestMatch) {
        const words = normalizedLabel.split(/[\s_\-\/]+/);
        for (const [synonym, profileKey] of Object.entries(FIELD_SYNONYMS)) {
          const synWords = synonym.split(/[\s_\-\/]+/);
          const overlap = words.filter(w => synWords.includes(w)).length;
          if (overlap >= 1 && overlap / Math.max(words.length, synWords.length) > 0.4) {
            bestMatch = profileKey;
            confidence = 0.65;
            break;
          }
        }
      }

      if (bestMatch && profile) {
        const value = this.getProfileValue(profile, bestMatch);
        if (value !== undefined && value !== null && value !== "") {
          mappings.push({
            formLabel: field.label,
            mappedTo: bestMatch,
            value,
            confidence,
          });
        } else {
          missing.push(field.label);
        }
      } else {
        missing.push(field.label);
      }
    }

    return { mappings, missing };
  }

  async generateFillPreview(
    profile: any,
    formFields: { label: string; fieldType?: string }[]
  ): Promise<{
    mappings: { formLabel: string; mappedTo: string; value: any; confidence: number }[];
    missing: string[];
    fieldsDetected: number;
    fieldsFilled: number;
    fillPercentage: number;
  }> {
    const { mappings, missing } = this.mapFieldsToProfile(formFields, profile);
    const fieldsDetected = formFields.length;
    const fieldsFilled = mappings.length;
    const fillPercentage = fieldsDetected > 0 ? Math.round((fieldsFilled / fieldsDetected) * 10000) / 100 : 0;

    return {
      mappings,
      missing,
      fieldsDetected,
      fieldsFilled,
      fillPercentage,
    };
  }

  private getProfileValue(profile: any, key: string): any {
    if (profile[key] !== undefined) return profile[key];

    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (profile[camelKey] !== undefined) return profile[camelKey];

    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (profile[snakeKey] !== undefined) return profile[snakeKey];

    return undefined;
  }

  private simulateExtraction(docType: string, textContent: string): any {
    const baseResult: Record<string, any> = {
      extractionMethod: "simulated",
      docType,
      disclaimer: "OpenAI API key not configured. Returning simulated extraction results.",
    };

    switch (docType.toLowerCase()) {
      case "w9":
        return {
          ...baseResult,
          businessName: "Extracted Business Name",
          ein: "XX-XXXXXXX",
          businessType: "LLC",
          address: "123 Main Street",
          city: "Anytown",
          state: "FL",
          zip: "33101",
        };
      case "insurance_cert":
        return {
          ...baseResult,
          insuranceProvider: "Extracted Insurance Co.",
          policyNumber: "POL-XXXXXX",
          generalLiability: "$1,000,000",
          autoLiability: "$500,000",
          workersComp: "$1,000,000",
          umbrellaLimit: "$2,000,000",
          expirationDate: "12/31/2026",
        };
      case "rate_sheet":
        return {
          ...baseResult,
          laborRates: [
            { classification: "Foreman", stRate: 45, otRate: 67.5 },
            { classification: "Operator", stRate: 38, otRate: 57 },
            { classification: "Laborer", stRate: 28, otRate: 42 },
          ],
          equipmentRates: [
            { name: "Bobcat", hourlyRate: 85 },
            { name: "Excavator", hourlyRate: 125 },
          ],
        };
      default:
        return {
          ...baseResult,
          rawTextLength: textContent.length,
          detectedFields: ["name", "address", "date", "signature"],
        };
    }
  }

  private simulateFieldDetection(formText: string): { fields: { label: string; fieldType: string }[] } {
    const commonFields = [
      { label: "Company Name", fieldType: "text" },
      { label: "Legal Business Name", fieldType: "text" },
      { label: "Federal Tax ID (EIN)", fieldType: "text" },
      { label: "UEI Number", fieldType: "text" },
      { label: "CAGE Code", fieldType: "text" },
      { label: "Owner Name", fieldType: "text" },
      { label: "Title", fieldType: "text" },
      { label: "Email Address", fieldType: "text" },
      { label: "Phone Number", fieldType: "text" },
      { label: "Street Address", fieldType: "text" },
      { label: "City", fieldType: "text" },
      { label: "State", fieldType: "text" },
      { label: "Zip Code", fieldType: "text" },
      { label: "NAICS Code", fieldType: "text" },
      { label: "Business Type", fieldType: "select" },
      { label: "Date", fieldType: "date" },
      { label: "Signature", fieldType: "signature" },
    ];

    const textLower = formText.toLowerCase();
    if (textLower.includes("insurance") || textLower.includes("certificate")) {
      commonFields.push(
        { label: "Insurance Provider", fieldType: "text" },
        { label: "Policy Number", fieldType: "text" },
        { label: "GL Limits", fieldType: "text" },
        { label: "Workers Compensation", fieldType: "text" },
        { label: "Insurance Expiration", fieldType: "date" }
      );
    }
    if (textLower.includes("bank") || textLower.includes("ach") || textLower.includes("direct deposit")) {
      commonFields.push(
        { label: "Bank Name", fieldType: "text" },
        { label: "ABA Routing Number", fieldType: "text" },
        { label: "Account Number", fieldType: "text" }
      );
    }

    return { fields: commonFields };
  }
}

export const autoFormFillerService = new AutoFormFillerService();
