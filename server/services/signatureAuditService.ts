import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { SignatureAuditLog, InsertSignatureAuditLog } from '@shared/schema';

export interface SignatureContext {
  ipAddress: string;
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  sessionId?: string;
}

export interface SignatureRequest {
  documentType: string;
  documentName?: string;
  documentVersion?: string;
  documentContent?: string;
  
  signerType: 'customer' | 'contractor' | 'homeowner' | 'business';
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  signerUserId?: string;
  
  signatureMethod: 'typed' | 'drawn' | 'uploaded' | 'docusign' | 'click_to_sign';
  signatureData?: string;
  
  termsAccepted?: boolean;
  termsVersion?: string;
  privacyAccepted?: boolean;
  privacyVersion?: string;
  
  contractorId?: number;
  customerId?: number;
  jobId?: number;
  contractId?: number;
  leadId?: number;
  
  contractorNotificationEmail?: string;
}

export interface ParsedDeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceOS: string;
  browserName: string;
  browserVersion: string;
}

export interface AuditReport {
  signatureId: string;
  pdfBuffer: Buffer;
  filename: string;
}

class SignatureAuditService {
  private signatureCounter = 0;

  generateSignatureId(): string {
    this.signatureCounter++;
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `SIG-${timestamp}-${random}`.toUpperCase();
  }

  parseUserAgent(userAgent: string): ParsedDeviceInfo {
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    let deviceOS = 'Unknown';
    let browserName = 'Unknown';
    let browserVersion = '';

    const ua = userAgent.toLowerCase();

    if (/ipad|tablet|playbook|silk/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
      deviceType = 'mobile';
    }

    if (/windows nt 10/i.test(ua)) {
      deviceOS = 'Windows 10/11';
    } else if (/windows nt 6.3/i.test(ua)) {
      deviceOS = 'Windows 8.1';
    } else if (/windows nt 6.2/i.test(ua)) {
      deviceOS = 'Windows 8';
    } else if (/windows nt 6.1/i.test(ua)) {
      deviceOS = 'Windows 7';
    } else if (/mac os x/i.test(ua)) {
      const versionMatch = ua.match(/mac os x ([\d_]+)/i);
      deviceOS = versionMatch ? `macOS ${versionMatch[1].replace(/_/g, '.')}` : 'macOS';
    } else if (/iphone os|ipad.*os/i.test(ua)) {
      const versionMatch = ua.match(/os ([\d_]+)/i);
      deviceOS = versionMatch ? `iOS ${versionMatch[1].replace(/_/g, '.')}` : 'iOS';
    } else if (/android/i.test(ua)) {
      const versionMatch = ua.match(/android ([\d.]+)/i);
      deviceOS = versionMatch ? `Android ${versionMatch[1]}` : 'Android';
    } else if (/linux/i.test(ua)) {
      deviceOS = 'Linux';
    }

    if (/edg/i.test(ua)) {
      const match = ua.match(/edg\/([\d.]+)/i);
      browserName = 'Microsoft Edge';
      browserVersion = match ? match[1] : '';
    } else if (/chrome/i.test(ua) && !/chromium|edg/i.test(ua)) {
      const match = ua.match(/chrome\/([\d.]+)/i);
      browserName = 'Google Chrome';
      browserVersion = match ? match[1] : '';
    } else if (/safari/i.test(ua) && !/chrome|chromium/i.test(ua)) {
      const match = ua.match(/version\/([\d.]+)/i);
      browserName = 'Safari';
      browserVersion = match ? match[1] : '';
    } else if (/firefox/i.test(ua)) {
      const match = ua.match(/firefox\/([\d.]+)/i);
      browserName = 'Firefox';
      browserVersion = match ? match[1] : '';
    } else if (/opera|opr/i.test(ua)) {
      const match = ua.match(/(?:opera|opr)\/([\d.]+)/i);
      browserName = 'Opera';
      browserVersion = match ? match[1] : '';
    }

    return { deviceType, deviceOS, browserName, browserVersion };
  }

  createSignatureHash(signatureData: string): string {
    return crypto.createHash('sha256').update(signatureData).digest('hex');
  }

  createDocumentHash(documentContent: string): string {
    return crypto.createHash('sha256').update(documentContent).digest('hex');
  }

  async captureSignature(
    request: SignatureRequest,
    context: SignatureContext
  ): Promise<InsertSignatureAuditLog> {
    const signatureId = this.generateSignatureId();
    const deviceInfo = this.parseUserAgent(context.userAgent);
    
    const signatureHash = request.signatureData 
      ? this.createSignatureHash(request.signatureData) 
      : undefined;
    
    const documentHash = request.documentContent 
      ? this.createDocumentHash(request.documentContent) 
      : undefined;

    const auditEntry: InsertSignatureAuditLog = {
      signatureId,
      documentType: request.documentType,
      documentName: request.documentName,
      documentVersion: request.documentVersion,
      
      signerType: request.signerType,
      signerName: request.signerName,
      signerEmail: request.signerEmail,
      signerPhone: request.signerPhone,
      signerUserId: request.signerUserId,
      
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceType: deviceInfo.deviceType,
      deviceOS: deviceInfo.deviceOS,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion,
      screenResolution: context.screenResolution,
      timezone: context.timezone,
      language: context.language,
      
      signatureMethod: request.signatureMethod,
      signatureData: request.signatureData,
      signatureHash,
      documentHash,
      
      termsAccepted: request.termsAccepted,
      termsVersion: request.termsVersion,
      privacyAccepted: request.privacyAccepted,
      privacyVersion: request.privacyVersion,
      
      contractorId: request.contractorId,
      customerId: request.customerId,
      jobId: request.jobId,
      contractId: request.contractId,
      leadId: request.leadId,
      
      contractorNotificationEmail: request.contractorNotificationEmail,
      sessionId: context.sessionId,
      
      auditReportGenerated: false,
      auditReportSentToContractor: false,
      verificationCompleted: false,
      legalStatus: 'valid',
    };

    console.log(`📝 Signature captured: ${signatureId} for ${request.signerName} (${request.signerEmail})`);
    console.log(`   IP: ${context.ipAddress}, Device: ${deviceInfo.deviceType}, Browser: ${deviceInfo.browserName}`);
    
    return auditEntry;
  }

  async generateAuditReportPDF(auditLog: SignatureAuditLog): Promise<AuditReport> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve({
            signatureId: auditLog.signatureId,
            pdfBuffer,
            filename: `signature_audit_${auditLog.signatureId}.pdf`
          });
        });

        doc.fontSize(20).font('Helvetica-Bold').text('SIGNATURE AUDIT REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text('Legal Documentation for Electronic Signature', { align: 'center' });
        doc.moveDown(2);

        doc.rect(50, doc.y, 500, 2).fill('#003366');
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#003366').text('SIGNATURE IDENTIFICATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`Signature ID: ${auditLog.signatureId}`);
        doc.text(`Signed At: ${auditLog.signedAt?.toISOString() || 'N/A'}`);
        doc.text(`Document Type: ${auditLog.documentType}`);
        doc.text(`Document Name: ${auditLog.documentName || 'N/A'}`);
        doc.text(`Document Version: ${auditLog.documentVersion || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#003366').text('SIGNER INFORMATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`Name: ${auditLog.signerName}`);
        doc.text(`Email: ${auditLog.signerEmail}`);
        doc.text(`Phone: ${auditLog.signerPhone || 'N/A'}`);
        doc.text(`Role: ${auditLog.signerType}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#003366').text('DEVICE & LOCATION INFORMATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`IP Address: ${auditLog.ipAddress}`);
        doc.text(`Device Type: ${auditLog.deviceType || 'N/A'}`);
        doc.text(`Operating System: ${auditLog.deviceOS || 'N/A'}`);
        doc.text(`Browser: ${auditLog.browserName || 'N/A'} ${auditLog.browserVersion || ''}`);
        doc.text(`Screen Resolution: ${auditLog.screenResolution || 'N/A'}`);
        doc.text(`Timezone: ${auditLog.timezone || 'N/A'}`);
        doc.text(`Language: ${auditLog.language || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#003366').text('USER AGENT STRING');
        doc.moveDown(0.5);
        doc.fontSize(8).font('Courier').fillColor('#333333');
        const wrappedUA = auditLog.userAgent.substring(0, 500);
        doc.text(wrappedUA, { width: 500 });
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#003366').text('SIGNATURE VERIFICATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`Signature Method: ${auditLog.signatureMethod}`);
        doc.text(`Signature Hash (SHA-256): ${auditLog.signatureHash || 'N/A'}`);
        doc.text(`Document Hash (SHA-256): ${auditLog.documentHash || 'N/A'}`);
        doc.text(`Terms Accepted: ${auditLog.termsAccepted ? 'Yes' : 'No'}`);
        doc.text(`Privacy Policy Accepted: ${auditLog.privacyAccepted ? 'Yes' : 'No'}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#003366').text('SESSION INFORMATION');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`Session ID: ${auditLog.sessionId || 'N/A'}`);
        doc.text(`Legal Status: ${auditLog.legalStatus}`);
        doc.moveDown(2);

        doc.rect(50, doc.y, 500, 2).fill('#003366');
        doc.moveDown();
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text('This document serves as a legal record of the electronic signature captured above.', { align: 'center' });
        doc.text('It contains IP address, device information, and cryptographic hashes that can be used', { align: 'center' });
        doc.text('to verify the authenticity and integrity of the signature in legal proceedings.', { align: 'center' });
        doc.moveDown();
        doc.text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
        doc.text('Strategic Service Savers - Signature Audit System', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  getClientIP(req: any): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
      return ips[0];
    }
    
    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return realIP;
    }
    
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  extractContextFromRequest(req: any): SignatureContext {
    return {
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timezone: req.headers['x-timezone'] || undefined,
      language: req.headers['accept-language']?.split(',')[0] || undefined,
      sessionId: req.sessionID || undefined,
    };
  }
}

export const signatureAuditService = new SignatureAuditService();
console.log('📝 Signature Audit Service initialized - Legal compliance tracking enabled');
