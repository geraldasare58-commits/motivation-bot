import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { Blob } from 'buffer';

// Initialize the Google GenAI SDK (picks up GEMINI_API_KEY from environment)
const ai = new GoogleGenAI();

async function runBot() {
  console.log("Generating motivation quote and targeted hashtags via Gemini...");

  try {
    // 1. Generate text and optimized audience-reaching hashtags
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Provide a short, inspiring Christian motivational quote with a Bible verse reference. At the very end, append 6-8 targeted hashtags optimized for Instagram, Facebook, Threads, and X to reach the right audience (such as #ChristianMotivation #FaithJourney #DailyDevotional #GodIsGood #Inspiration).',
    });

    const quoteText = response.text;
    console.log("Generated Content:\n", quoteText);

    // 2. Launch Puppeteer to render the 1080x1080 visual image card
    console.log("Rendering image card...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });

    const htmlContent = `
      <html>
        <body style="background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; padding: 60px; margin: 0;">
          <div style="background: rgba(0,0,0,0.4); padding: 60px; border-radius: 20px; max-width: 900px;">
            <h1 style="font-size: 40px; line-height: 1.4; margin: 0;">${quoteText.split('#')[0].replace(/\n/g, '<br>')}</h1>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    await page.screenshot({ path: 'motivation.png' });
    await browser.close();
    console.log("Image card generated successfully!");

    // 3. Dispatch payload to your Make.com Webhook URL
    const WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
    
    if (WEBHOOK_URL) {
      console.log("Sending payload to Make.com webhook...");
      
      const imageBuffer = fs.readFileSync('motivation.png');
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('file', blob, 'motivation.png');
      formData.append('caption', quoteText);

      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      if (webhookResponse.ok) {
        console.log("Successfully triggered Make.com webhook!");
      } else {
        console.error("Failed to trigger webhook:", await webhookResponse.text());
      }
    } else {
      console.log("MAKE_WEBHOOK_URL not configured. Skipping transmission.");
    }

  } catch (error) {
    console.error("Error executing bot pipeline:", error);
    process.exit(1);
  }
}

runBot();