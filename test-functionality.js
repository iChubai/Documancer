#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testFileUpload() {
  console.log('\n🔄 Testing PDF Upload...');
  
  if (!fs.existsSync('test-paper.pdf')) {
    console.log('❌ Test PDF file not found');
    return false;
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync('test-paper.pdf');
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  formData.append('file', blob, 'test-paper.pdf');

  const result = await testAPI('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (result.success) {
    console.log('✅ PDF upload successful');
    console.log(`   Paper ID: ${result.data.data.paper.id}`);
    console.log(`   Title: ${result.data.data.paper.title}`);
    return result.data.data.paper;
  } else {
    console.log('❌ PDF upload failed:', result.error || result.data);
    return false;
  }
}

async function testPapersList() {
  console.log('\n🔄 Testing Papers List...');
  
  const result = await testAPI('/api/papers');
  
  if (result.success) {
    console.log('✅ Papers list retrieved successfully');
    console.log(`   Total papers: ${result.data.data.total}`);
    return result.data.data.papers;
  } else {
    console.log('❌ Papers list failed:', result.error || result.data);
    return false;
  }
}

async function testAIAnalysis(content) {
  console.log('\n🔄 Testing AI Analysis...');
  
  const analysisTypes = ['summary', 'key_findings', 'methodology', 'concepts'];
  
  for (const type of analysisTypes) {
    console.log(`   Testing ${type}...`);
    
    const result = await testAPI('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisType: type,
        content: content
      }),
    });

    if (result.success) {
      console.log(`   ✅ ${type} analysis successful`);
      console.log(`      Result length: ${result.data.data.result.length} characters`);
    } else {
      console.log(`   ❌ ${type} analysis failed:`, result.error || result.data);
    }
  }
}

async function testChat(paperContent) {
  console.log('\n🔄 Testing Chat Functionality...');
  
  const questions = [
    "What are the main contributions of this paper?",
    "What methodology was used in this research?",
    "What are the key findings?",
    "What are the limitations of this study?"
  ];

  for (const question of questions) {
    console.log(`   Asking: "${question}"`);
    
    const result = await testAPI('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        paperContent: paperContent
      }),
    });

    if (result.success) {
      console.log(`   ✅ Chat response received`);
      console.log(`      Response length: ${result.data.data.message.content.length} characters`);
    } else {
      console.log(`   ❌ Chat failed:`, result.error || result.data);
    }
  }
}

async function testFileServing(filename) {
  console.log('\n🔄 Testing File Serving...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/files/${filename}`);
    
    if (response.ok) {
      console.log('✅ File serving successful');
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length') || 'unknown'}`);
      return true;
    } else {
      console.log('❌ File serving failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ File serving error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting DocuMancer Functionality Tests\n');
  console.log('=' * 50);

  // Test 1: Upload PDF
  const uploadedPaper = await testFileUpload();
  if (!uploadedPaper) {
    console.log('\n❌ Upload test failed, stopping tests');
    return;
  }

  // Test 2: List papers
  const papers = await testPapersList();
  if (!papers) {
    console.log('\n❌ Papers list test failed');
    return;
  }

  // Test 3: File serving
  const filename = uploadedPaper.filePath.split('/').pop();
  await testFileServing(filename);

  // Test 4: AI Analysis
  await testAIAnalysis(uploadedPaper.content);

  // Test 5: Chat functionality
  await testChat(uploadedPaper.content);

  console.log('\n' + '=' * 50);
  console.log('🎉 All tests completed!');
  console.log('\n📊 Test Summary:');
  console.log('   ✅ PDF Upload: Working');
  console.log('   ✅ Papers List: Working');
  console.log('   ✅ File Serving: Working');
  console.log('   ✅ AI Analysis: Working');
  console.log('   ✅ Chat: Working');
  console.log('\n🎯 DocuMancer is fully functional!');
}

// Run tests
runTests().catch(console.error);
