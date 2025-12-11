import crypto from 'crypto';

export interface DocuSignConfig {
  integrationKey: string;
  clientSecret?: string;
  userId?: string;
  accountId?: string;
  basePath?: string;
  privateKey?: string;
}

export interface SignerInfo {
  email: string;
  name: string;
  recipientId: string;
  routingOrder?: string;
  role?: 'homeowner' | 'contractor' | 'witness';
}

export interface DocumentInfo {
  documentId: string;
  name: string;
  content: Buffer | string;
  fileExtension?: string;
}

export interface EnvelopeRequest {
  emailSubject: string;
  documents: DocumentInfo[];
  signers: SignerInfo[];
  status?: 'created' | 'sent';
  expirationDays?: number;
}

export interface EnvelopeResponse {
  envelopeId: string;
  status: string;
  statusDateTime: string;
  uri?: string;
}

export interface EnvelopeStatus {
  envelopeId: string;
  status: 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';
  emailSubject: string;
  sentDateTime?: string;
  completedDateTime?: string;
  recipients: {
    signers: Array<{
      email: string;
      name: string;
      status: string;
      signedDateTime?: string;
    }>;
  };
}

export interface SignedDocument {
  documentId: string;
  name: string;
  content: Buffer;
  mimeType: string;
}

export class DocuSignService {
  private config: DocuSignConfig;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
      clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || '',
      userId: process.env.DOCUSIGN_USER_ID || '',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
      basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
      privateKey: process.env.DOCUSIGN_PRIVATE_KEY || ''
    };

    this.isConfigured = Boolean(this.config.integrationKey && this.config.clientSecret);
    
    if (this.isConfigured) {
      console.log('📝 DocuSign service initialized with integration key and client secret');
      if (!this.config.accountId || !this.config.userId) {
        console.log('⚠️ DocuSign: Account ID or User ID not set - some features may be limited');
      }
    } else {
      console.log('⚠️ DocuSign service running in simulation mode (missing credentials)');
    }
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.isConfigured) {
      return 'SIMULATION_TOKEN';
    }

    try {
      const response = await fetch('https://account-d.docusign.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: this.createJwtAssertion()
        })
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
      
      return this.accessToken!;
    } catch (error) {
      console.error('DocuSign token error:', error);
      throw error;
    }
  }

  private createJwtAssertion(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      typ: 'JWT',
      alg: 'RS256'
    };
    const payload = {
      iss: this.config.integrationKey,
      sub: this.config.userId,
      aud: 'account-d.docusign.com',
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation'
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signatureInput = `${headerB64}.${payloadB64}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(this.config.privateKey || '', 'base64url');

    return `${signatureInput}.${signature}`;
  }

  async createEnvelope(request: EnvelopeRequest): Promise<EnvelopeResponse> {
    if (!this.isConfigured) {
      return this.simulateCreateEnvelope(request);
    }

    try {
      const token = await this.getAccessToken();
      
      const envelopeDefinition = {
        emailSubject: request.emailSubject,
        documents: request.documents.map(doc => ({
          documentId: doc.documentId,
          name: doc.name,
          documentBase64: Buffer.isBuffer(doc.content) 
            ? doc.content.toString('base64') 
            : Buffer.from(doc.content).toString('base64'),
          fileExtension: doc.fileExtension || 'pdf'
        })),
        recipients: {
          signers: request.signers.map(signer => ({
            email: signer.email,
            name: signer.name,
            recipientId: signer.recipientId,
            routingOrder: signer.routingOrder || '1',
            tabs: {
              signHereTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '700'
              }],
              dateSignedTabs: [{
                documentId: '1',
                pageNumber: '1',
                xPosition: '300',
                yPosition: '700'
              }]
            }
          }))
        },
        status: request.status || 'sent'
      };

      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(envelopeDefinition)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Envelope creation failed: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DocuSign envelope error:', error);
      throw error;
    }
  }

  private simulateCreateEnvelope(request: EnvelopeRequest): EnvelopeResponse {
    const envelopeId = `SIM-${crypto.randomUUID()}`;
    console.log(`📝 [SIMULATION] Created DocuSign envelope: ${envelopeId}`);
    console.log(`   Subject: ${request.emailSubject}`);
    console.log(`   Documents: ${request.documents.map(d => d.name).join(', ')}`);
    console.log(`   Signers: ${request.signers.map(s => s.email).join(', ')}`);
    
    return {
      envelopeId,
      status: request.status || 'sent',
      statusDateTime: new Date().toISOString(),
      uri: `/envelopes/${envelopeId}`
    };
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatus> {
    if (!this.isConfigured || envelopeId.startsWith('SIM-')) {
      return this.simulateGetStatus(envelopeId);
    }

    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DocuSign status error:', error);
      throw error;
    }
  }

  private simulateGetStatus(envelopeId: string): EnvelopeStatus {
    return {
      envelopeId,
      status: 'sent',
      emailSubject: 'Simulated Document for Signature',
      sentDateTime: new Date().toISOString(),
      recipients: {
        signers: [{
          email: 'signer@example.com',
          name: 'Test Signer',
          status: 'sent'
        }]
      }
    };
  }

  async downloadSignedDocument(envelopeId: string, documentId: string = 'combined'): Promise<SignedDocument> {
    if (!this.isConfigured || envelopeId.startsWith('SIM-')) {
      return this.simulateDownload(envelopeId, documentId);
    }

    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/documents/${documentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Document download failed: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
      return {
        documentId,
        name: `signed_document_${envelopeId}.pdf`,
        content: buffer,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      console.error('DocuSign download error:', error);
      throw error;
    }
  }

  private simulateDownload(envelopeId: string, documentId: string): SignedDocument {
    const simulatedPdf = Buffer.from('%PDF-1.4 Simulated signed document content');
    
    return {
      documentId,
      name: `signed_document_${envelopeId}.pdf`,
      content: simulatedPdf,
      mimeType: 'application/pdf'
    };
  }

  async getSigningUrl(envelopeId: string, signer: SignerInfo, returnUrl: string): Promise<string> {
    if (!this.isConfigured || envelopeId.startsWith('SIM-')) {
      return `${returnUrl}?event=signing_complete&envelope_id=${envelopeId}`;
    }

    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}/views/recipient`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            authenticationMethod: 'none',
            email: signer.email,
            userName: signer.name,
            recipientId: signer.recipientId,
            returnUrl
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Signing URL request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('DocuSign signing URL error:', error);
      throw error;
    }
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    if (!this.isConfigured || envelopeId.startsWith('SIM-')) {
      console.log(`📝 [SIMULATION] Voided envelope: ${envelopeId} - ${reason}`);
      return;
    }

    try {
      const token = await this.getAccessToken();
      
      await fetch(
        `${this.config.basePath}/v2.1/accounts/${this.config.accountId}/envelopes/${envelopeId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'voided',
            voidedReason: reason
          })
        }
      );
    } catch (error) {
      console.error('DocuSign void error:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; mode: string } {
    return {
      configured: this.isConfigured,
      mode: this.isConfigured ? 'live' : 'simulation'
    };
  }
}

export const docuSignService = new DocuSignService();
