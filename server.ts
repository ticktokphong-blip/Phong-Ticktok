import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Endpoint for Debt Payoff & Budgeting advice
  app.post("/api/ai/advisor", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "ไม่พบ GEMINI_API_KEY กรุณาตั้งค่า API key ในโปรเจกต์",
        });
      }

      const { debts, monthlyIncome, monthlyExpenses, selectedStrategy } = req.body;

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
คุณคือผู้เชี่ยวชาญด้านการวางแผนบริหารจัดการค่าเช่า รายรับรายจ่าย และจัดการการเงินประจำแอป "RentTracker / บันทึกค่าเช่าและรายรับรายจ่าย"
กรุณาวิเคราะห์ข้อมูลผู้เช่า/ค่าเช่าหรือรายการการเงินของผู้ใช้ และให้คำแนะนำที่ปฏิบัติตามได้จริงเป็นภาษาไทย
อย่างสุภาพ เป็นกันเอง และมีประสิทธิภาพ

ข้อมูลปัจจุบัน:
- กลยุทธ์การติดตาม: ${selectedStrategy || "เรียงตามกำหนดชำระรายเดือน"}

รายการลูกค้าผู้เช่า/บัญชีทั้งหมด:
${JSON.stringify(debts, null, 2)}

ข้อคำถามและข้อแนะนำที่ต้องการ:
1. สรุปสถานะการเก็บค่าเช่า ยอดรวมที่เก็บได้แล้ว และยอดคงเหลือค้างชำระ
2. ลำดับลูกค้าที่ต้องติดตามทวงถามหรือแจ้งเตือนในเดือนนี้ พร้อมร่างข้อความสุภาพสำหรับส่งแจ้งเตือนใน LINE/SMS
3. คำแนะนำในการบริหารกระแสเงินสดและการดูแลสัญญาเช่าให้ราบรื่น

ให้ตอบในรูปแบบข้อความ Markdown ที่อ่านง่าย มีการใช้หัวข้อ ตัวหนา และ bullet points สวยงาม
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (err: any) {
      console.error("Gemini AI error:", err);
      res.status(500).json({
        error: "เกิดข้อผิดพลาดในการประมวลผลคำแนะนำ AI: " + (err.message || err.toString()),
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DebtTracker App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
