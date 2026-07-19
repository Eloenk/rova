import { callAI } from '../lib/ai-provider';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function verify() {
  const intent = "Swap 10 USDC for EURC and then bridge 20 USDC to 0x1234567890123456789012345678901234567890";
  console.log('Testing Intent:', intent);
  
  try {
    const result = await callAI(intent);
    console.log('AI Provider:', result.provider);
    console.log('AI Response:', JSON.stringify(JSON.parse(result.text), null, 2));
    
    const parsed = JSON.parse(result.text);
    if (parsed.splits && parsed.splits.length >= 2) {
      console.log('✅ SUCCESS: Detected multiple splits.');
    } else {
      console.log('❌ FAILURE: Only one split detected.');
      console.log('Raw text:', result.text);
    }
  } catch (e) {
    console.error('Error during verification:', e);
  }
}

verify();
