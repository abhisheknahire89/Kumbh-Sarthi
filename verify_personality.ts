
import fs from 'fs';
import path from 'path';
import { askQuestion } from './services/ragService';

// 1. Load .env manually
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('Loading .env file...');
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.warn('.env file not found!');
}

// 2. Mock Global objects if needed (though ragService handles most)
// Supabase client should now work with process.env

// 3. Test Cases
const testCases = [
    {
        name: "Greeting",
        query: "Hello"
    },
    {
        name: "Elderly Persona",
        query: "Beta, main bahut dar gayi hoon, bheed bahut hai"
        // "Son, I am very scared, there is a lot of crowd"
    },
    {
        name: "Medical Emergency",
        query: "Help! My father just collapsed! He is not breathing!"
    },
    {
        name: "Religious/Cultural",
        query: "Shahi Snan kab hai?"
    },
    {
        name: "General Query",
        query: "Where is the nearest toilet?"
    }
];

async function runTests() {
    console.log('\nStarting AI Personality Verification...\n');

    for (const test of testCases) {
        console.log(`--- Testing: ${test.name} ---`);
        console.log(`Query: "${test.query}"`);

        try {
            const start = Date.now();
            const result = await askQuestion(test.query);
            const duration = Date.now() - start;

            console.log(`Response Time: ${duration}ms`);
            console.log(`AI Response: ${result.response.summary}`);

            if (result.response.emergencyInfo) {
                console.log('Emergency Info:', JSON.stringify(result.response.emergencyInfo, null, 2));
            }
            if (result.response.facilities) {
                console.log('Facilities:', JSON.stringify(result.response.facilities, null, 2));
            }

        } catch (error) {
            console.error('Error:', error);
        }
        console.log('\n');
    }
}

runTests().catch(console.error);
