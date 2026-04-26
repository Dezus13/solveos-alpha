import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('Key starts with:', apiKey?.substring(0, 7));
  
  const openai = new OpenAI({ apiKey });
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Faster/cheaper for test
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });
    console.log('Success! Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Failure!', error);
  }
}

verify();
