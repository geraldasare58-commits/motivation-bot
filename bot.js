import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer';
import fs from 'fs';

// Automatically uses process.env.GEMINI_API_KEY
const ai = new GoogleGenAI();

async function generateQuote() {
    console.log("Asking Gemini for a Christian motivational quote...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate a short, powerful Christian motivational quote and a matching Bible verse reference. Return it strictly as JSON with keys 'quote' and 'reference'."
    });

    let text = response.text.trim();
    // Clean up markdown code blocks if the model wrapped the JSON in them
    if (text.startsWith("```json")) {
        text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (text.startsWith("```")) {
        text = text.replace(/^```/, "").replace(/```$/, "").trim();
    }

    return JSON.parse(text);
}

async function createQuoteCard(data) {
    console.log("Rendering quote card image with Puppeteer...");
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                width: 1080px;
                height: 1080px;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #1f1c2c, #928dab);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #ffffff;
            }
            .card {
                width: 880px;
                padding: 60px;
                text-align: center;
                background: rgba(0, 0, 0, 0.4);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .quote {
                font-size: 48px;
                line-height: 1.4;
                margin-bottom: 30px;
                font-weight: 400;
            }
            .reference {
                font-size: 28px;
                color: #ffd700;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="quote">"${data.quote}"</div>
            <div class="reference">— ${data.reference}</div>
        </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });
    await page.setContent(htmlContent);
    
    if (!fs.existsSync('output')) {
        fs.mkdirSync('output');
    }
    
    const filePath = `output/motivation-${Date.now()}.png`;
    await page.screenshot({ path: filePath });
    await browser.close();
    console.log(`Quote card successfully saved to ${filePath}`);
}

async function run() {
    try {
        const quoteData = await generateQuote();
        await createQuoteCard(quoteData);
    } catch (error) {
        console.error("Error generating motivation bot content:", error);
        process.exit(1);
    }
}

run();