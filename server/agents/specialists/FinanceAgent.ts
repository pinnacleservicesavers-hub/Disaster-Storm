import { BaseAgent, AgentTask, AgentResponse } from '../BaseAgent';
import { StripePaymentTool } from '../../tools/StripeTool';

export class FinanceAgent extends BaseAgent {
  name = 'FinanceAgent';
  description = 'Handles payments, invoicing, and financial operations';
  capabilities = ['process_payment', 'generate_invoice', 'calculate_financing'];
  
  constructor() {
    super();
    this.registerTool(new StripePaymentTool());
  }
  
  async execute(task: AgentTask): Promise<AgentResponse> {
    try {
      if (task.type === 'process_payment') {
        const payment = await this.processPayment(task.data);
        return this.success(payment, {
          toolsUsed: ['stripe_payment'],
          reasoning: 'Processed payment via Stripe'
        });
      }
      
      if (task.type === 'generate_invoice') {
        const invoice = this.generateInvoice(task.data);
        return this.success(invoice);
      }
      
      if (task.type === 'calculate_financing') {
        const financing = this.calculateFinancing(task.data);
        return this.success(financing);
      }
      
      return this.failure('Unknown task type for FinanceAgent');
    } catch (error: any) {
      return this.failure(`FinanceAgent error: ${error.message}`);
    }
  }
  
  private async processPayment(data: any): Promise<any> {
    const result = await this.useTool('stripe_payment', {
      action: 'create_checkout',
      amount: data.amount,
      userId: data.userId
    });
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return {
      paymentId: result.data.sessionId,
      amount: data.amount,
      status: 'pending',
      checkoutUrl: result.data.url,
      createdAt: new Date()
    };
  }
  
  private generateInvoice(data: any): any {
    const subtotal = data.lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const tax = Math.floor(subtotal * 0.07);
    const total = subtotal + tax;
    
    return {
      invoiceId: `INV-${Date.now()}`,
      invoiceNumber: `${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      contractor: data.contractorName,
      customer: data.customerName,
      propertyAddress: data.propertyAddress,
      lineItems: data.lineItems,
      subtotal,
      tax,
      total,
      dueDate: this.calculateDueDate(30),
      terms: 'Net 30',
      status: 'draft',
      createdAt: new Date()
    };
  }
  
  private calculateFinancing(data: any): any {
    const principal = data.amount;
    const annualRate = data.interestRate || 8.5;
    const months = data.termMonths || 12;
    
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);
    
    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - principal;
    
    return {
      principal,
      annualRate,
      termMonths: months,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      effectiveAPR: annualRate,
      paymentSchedule: this.generatePaymentSchedule(principal, monthlyPayment, monthlyRate, months)
    };
  }
  
  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
  
  private generatePaymentSchedule(principal: number, payment: number, rate: number, months: number): any[] {
    const schedule = [];
    let balance = principal;
    
    for (let i = 1; i <= Math.min(months, 12); i++) {
      const interest = balance * rate;
      const principalPayment = payment - interest;
      balance -= principalPayment;
      
      schedule.push({
        month: i,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(0, balance) * 100) / 100
      });
    }
    
    return schedule;
  }
}
