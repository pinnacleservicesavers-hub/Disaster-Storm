import { contractorDeploymentAlertService } from '../server/services/contractorDeploymentAlert.js';

const northernGAAlert = {
  location: 'Northern Georgia Metro Atlanta',
  counties: [
    'Rockdale', 'Union', 'Pike', 'South Fulton', 'Walker', 'White', 
    'Henry', 'Cobb', 'Towns', 'Heard', 'Hall', 'Bartow', 'Meriwether',
    'Gilmer', 'Douglas', 'Forsyth', 'Troup', 'Dade', 'Pickens', 'Carroll',
    'Whitfield', 'Gordon', 'Spalding', 'North Fulton', 'Fannin', 'Chattooga',
    'Cherokee', 'Fayette', 'Clayton', 'Lumpkin', 'Dawson', 'Polk', 'DeKalb',
    'Floyd', 'Catoosa', 'Coweta', 'Haralson', 'Murray', 'Paulding', 'Gwinnett'
  ],
  severity: 'MARGINAL RISK - Damaging Winds Primary Threat',
  hazardType: 'Severe Thunderstorms with Damaging Winds & Isolated Tornadoes',
  deploymentStatus: 'GET_READY' as const,
  estimatedDamage: {
    description: 'Expect fallen trees, power lines down, roof damage, and debris. High-value metro Atlanta market with strong insurance claim potential.',
    potentialJobs: 150,
    revenueMin: 500000,
    revenueMax: 2000000
  },
  timeframe: 'TONIGHT (Nov 10) - Storms developing afternoon/evening',
  actionItems: [
    'Pre-position crews in Atlanta metro area by 6 PM',
    'Prepare equipment: chainsaws, tarps, generators, tree removal gear',
    'Monitor for fallen trees on power lines (high-value jobs)',
    'Focus on Cobb, Fulton, DeKalb, Gwinnett counties (highest population)',
    'Set up emergency response hotline for incoming calls',
    'Prepare insurance claim documentation templates'
  ]
};

const contractorPhones = [
  '+17066044820', // John Culpepper
  '+17068408949'  // Shannon Wise
];

async function sendAlert() {
  console.log('🚨 Sending Northern Georgia severe weather deployment alert...\n');
  console.log('📍 Target Area: Atlanta Metro & Northern GA');
  console.log(`📱 Recipients: ${contractorPhones.length} contractors`);
  console.log(`💰 Revenue Potential: $${northernGAAlert.estimatedDamage.revenueMin.toLocaleString()}-$${northernGAAlert.estimatedDamage.revenueMax.toLocaleString()}\n`);
  
  try {
    await contractorDeploymentAlertService.sendDeploymentAlert(northernGAAlert, contractorPhones);
    console.log('\n✅ Deployment alerts sent successfully!');
  } catch (error) {
    console.error('\n❌ Error sending alerts:', error);
    throw error;
  }
}

sendAlert();
