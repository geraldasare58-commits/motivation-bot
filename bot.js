import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';

// Initialize the Google GenAI SDK (it automatically picks up GEMINI_API_KEY from environment variables)
const ai = new GoogleGenAI();

async function runBot() {
  console.log("Generating motivation quote...");

  try {
    // Generate content using the recommended Gemini 2.5 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Provide a short, inspiring Christian motivational quote with a Bible verse reference.',
    });

    const quoteText = response.text;
    console.log("Generated Quote:", quoteText);

    // Launch Puppeteer to generate an image card
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });

    const htmlContent = `
      <html>
        <body style="background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; padding: 40px; margin: 0;">
          <div style="background: rgba(0,0,0,0.4); padding: 60px; border-radius: 20px; max-width: 800px;">
            <h1 style="font-size: 42px; line-height: 1.4; margin-bottom: 30px;">"${quoteText}"</h1>
            <p style="font-size: 24px; font-style: italic; opacity: 0.8;">#DailyMotivation #Faith #ChristianQuotes</p>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.screenshot({ path: 'motivation.png' });
    await browser.close();
    
    console.log("Motivation image generated successfully!");
  } catch (error) {
    console.error("Error running bot:", error);
    process.exit(1);
  }
}

runBot();