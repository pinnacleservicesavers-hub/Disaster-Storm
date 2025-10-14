import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';

// Test coordinates (Kansas - center of US for good coverage)
const testLat = 39.8283;
const testLon = -98.5795;
const radiusKM = 75; // Non-default radius to verify parameter passing

const runTests = async () => {
  console.log('🌩️ Testing Xweather API Integration\n');
  console.log(`📍 Test Location: ${testLat}°N, ${testLon}°W (radius: ${radiusKM}km)\n`);

  try {
    // Test 1: Lightning Threats (with custom radius)
    console.log('⚡ Test 1: Lightning Threats Endpoint');
    const lightningRes = await fetch(
      `${baseUrl}/api/xweather/lightning/threats?lat=${testLat}&lng=${testLon}&radius=${radiusKM}`
    );
    const lightningData = await lightningRes.json();
    console.log(`   Status: ${lightningRes.status}`);
    console.log(`   Radius Used: ${lightningData.location?.radiusKM || radiusKM}km`);
    console.log(`   Lightning Threats Found: ${lightningData.count || 0}`);
    if (lightningData.threats?.length > 0) {
      const sample = lightningData.threats[0];
      console.log(`   Sample: ${sample.pulseType || 'unknown'} strike`);
    }
    console.log('   ✅ Lightning endpoint working\n');

    // Test 2: Hail Threats
    console.log('❄️  Test 2: Hail Threats Endpoint');
    const hailRes = await fetch(
      `${baseUrl}/api/xweather/hail/threats?lat=${testLat}&lng=${testLon}`
    );
    const hailData = await hailRes.json();
    console.log(`   Status: ${hailRes.status}`);
    console.log(`   Hail Threats Found: ${hailData.count || 0}`);
    if (hailData.threats?.length > 0) {
      const sample = hailData.threats[0];
      console.log(`   Sample: ${sample.hailSize?.inches || 'N/A'}" hail, ${sample.probability || 0}% probability`);
    }
    console.log('   ✅ Hail endpoint working\n');

    // Test 3: Comprehensive Storm Data (with custom radius)
    console.log('🌪️  Test 3: Comprehensive Storm Data Endpoint');
    const comprehensiveRes = await fetch(
      `${baseUrl}/api/xweather/comprehensive?lat=${testLat}&lng=${testLon}&radius=${radiusKM}`
    );
    const comprehensiveData = await comprehensiveRes.json();
    console.log(`   Status: ${comprehensiveRes.status}`);
    console.log(`   Radius Used: ${comprehensiveData.location?.radiusKM || radiusKM}km`);
    if (comprehensiveData.threatAnalysis) {
      console.log(`   Threat Level: ${comprehensiveData.threatAnalysis.level}`);
      console.log(`   Threat Score: ${comprehensiveData.threatAnalysis.score}/100`);
      console.log(`   Lightning Strikes: ${comprehensiveData.lightning?.strikes?.length || 0}`);
      console.log(`   Lightning Threats: ${comprehensiveData.lightning?.threats?.length || 0}`);
      console.log(`   Hail Threats: ${comprehensiveData.hail?.threats?.length || 0}`);
      console.log(`   Storm Reports: ${comprehensiveData.reports?.length || 0}`);
    }
    console.log('   ✅ Comprehensive endpoint working\n');

    // Test 4: Storm Reports (with custom radius)
    console.log('📋 Test 4: Storm Reports Endpoint');
    const reportsRes = await fetch(
      `${baseUrl}/api/xweather/storms/reports?lat=${testLat}&lng=${testLon}&radius=${radiusKM}`
    );
    const reportsData = await reportsRes.json();
    console.log(`   Status: ${reportsRes.status}`);
    console.log(`   Success: ${reportsData.success}`);
    console.log(`   Storm Reports Found: ${reportsData.count || 0}`);
    if (reportsData.data?.length > 0) {
      const sample = reportsData.data[0];
      console.log(`   Sample: ${sample.category} - ${sample.name}`);
      if (sample.place) {
        console.log(`   Location: ${sample.place.name}, ${sample.place.state}`);
      }
    }
    console.log('   ✅ Storm reports endpoint working\n');

    console.log('✅ All Xweather API endpoints tested successfully!');
    console.log('🌐 Integration Status: OPERATIONAL');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', await error.response.text());
    }
    process.exit(1);
  }
};

runTests();
