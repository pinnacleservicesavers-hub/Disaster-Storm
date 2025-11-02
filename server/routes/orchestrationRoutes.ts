import { Router } from 'express';
import { orchestrationService } from '../agents/OrchestrationService';
import { AgentTask } from '../agents/BaseAgent';
import { z } from 'zod';

const router = Router();

const taskSchema = z.object({
  type: z.string(),
  data: z.any(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  metadata: z.record(z.any()).optional()
});

router.post('/orchestrate', async (req, res) => {
  try {
    const taskData = taskSchema.parse(req.body);
    
    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: taskData.type,
      data: taskData.data,
      priority: taskData.priority,
      metadata: taskData.metadata
    };
    
    const result = await orchestrationService.executeTask(task);
    
    res.json({
      taskId: task.id,
      ...result
    });
  } catch (error: any) {
    console.error('Orchestration error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/specialists', (req, res) => {
  try {
    const specialists = orchestrationService.getSpecialists();
    res.json({ specialists, count: specialists.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/events', (req, res) => {
  try {
    const events = orchestrationService.getEventLog();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    res.json({
      events: events.slice(-limit),
      total: events.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/events', (req, res) => {
  try {
    orchestrationService.clearEventLog();
    res.json({ success: true, message: 'Event log cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflow', async (req, res) => {
  try {
    const workflowSchema = z.object({
      scenario: z.enum([
        'storm_response',
        'insurance_claim',
        'emergency_dispatch',
        'damage_assessment'
      ]),
      data: z.any()
    });
    
    const { scenario, data } = workflowSchema.parse(req.body);
    const results = [];
    
    if (scenario === 'storm_response') {
      const weatherTask = await orchestrationService.executeTask({
        id: `weather-${Date.now()}`,
        type: 'weather_analysis',
        data: { state: data.state },
        priority: 'high'
      });
      results.push({ step: 'weather_analysis', result: weatherTask });
      
      if (weatherTask.success && weatherTask.result?.recommendation?.includes('DEPLOY')) {
        const dispatchTask = await orchestrationService.executeTask({
          id: `dispatch-${Date.now()}`,
          type: 'dispatch_contractor',
          data: {
            contractorPhone: data.contractorPhone,
            contractorId: data.contractorId,
            jobId: data.jobId || `job-${Date.now()}`,
            jobDescription: 'Emergency storm response',
            address: data.address,
            priority: 'urgent'
          },
          priority: 'urgent'
        });
        results.push({ step: 'dispatch_contractor', result: dispatchTask });
      }
    } else if (scenario === 'insurance_claim') {
      const claimTask = await orchestrationService.executeTask({
        id: `claim-${Date.now()}`,
        type: 'create_claim',
        data: {
          address: data.address,
          damageType: data.damageType,
          estimatedCost: data.estimatedCost
        },
        priority: 'medium'
      });
      results.push({ step: 'create_claim', result: claimTask });
      
      if (claimTask.success && data.insurerOffer) {
        const negotiateTask = await orchestrationService.executeTask({
          id: `negotiate-${Date.now()}`,
          type: 'negotiate_claim',
          data: {
            requestedAmount: data.estimatedCost,
            offeredAmount: data.insurerOffer
          },
          priority: 'medium'
        });
        results.push({ step: 'negotiate_claim', result: negotiateTask });
      }
    } else if (scenario === 'emergency_dispatch') {
      const visionTask = await orchestrationService.executeTask({
        id: `vision-${Date.now()}`,
        type: 'analyze_image',
        data: { imageUrl: data.imageUrl },
        priority: 'urgent'
      });
      results.push({ step: 'analyze_image', result: visionTask });
      
      const dispatchTask = await orchestrationService.executeTask({
        id: `dispatch-${Date.now()}`,
        type: 'dispatch_contractor',
        data: {
          contractorPhone: data.contractorPhone,
          contractorId: data.contractorId,
          jobId: data.jobId || `job-${Date.now()}`,
          jobDescription: `Emergency: ${visionTask.result?.damageTypes?.join(', ') || 'damage assessment'}`,
          address: data.address,
          priority: 'urgent'
        },
        priority: 'urgent'
      });
      results.push({ step: 'dispatch_contractor', result: dispatchTask });
    } else if (scenario === 'damage_assessment') {
      const visionTask = await orchestrationService.executeTask({
        id: `vision-${Date.now()}`,
        type: 'analyze_image',
        data: { imageUrl: data.imageUrl },
        priority: 'high'
      });
      results.push({ step: 'analyze_image', result: visionTask });
      
      const claimTask = await orchestrationService.executeTask({
        id: `claim-${Date.now()}`,
        type: 'create_claim',
        data: {
          address: data.address,
          damageType: visionTask.result?.damageTypes?.[0] || 'general',
          estimatedCost: visionTask.result?.estimatedCost || 10000
        },
        priority: 'medium'
      });
      results.push({ step: 'create_claim', result: claimTask });
    }
    
    res.json({
      scenario,
      results,
      success: results.every(r => r.result.success),
      timestamp: new Date()
    });
  } catch (error: any) {
    console.error('Workflow error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
