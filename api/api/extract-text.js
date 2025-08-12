import fetch from 'node-fetch';
import pdf from 'pdf-parse';
import FormData from 'form-data';

/**
 * POST /api/extract-text
 * Body:
 *   { pdfUrl?: string, imageUrl?: string }
 * Returns:
 *   { content: string }
 *
 * - PDF: extraction 100% du texte via pdf-parse
 * - Image: OCR via OCR.space (si process.env.OCR_API_KEY est défini)
 */

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pdfUrl, imageUrl } = req.body || {};

    if (!pdfUrl && !imageUrl) {
      return res.status(400).json({ error: 'Provide either pdfUrl or imageUrl' });
    }

    // 1) PDF extraction
    if (pdfUrl) {
      const resp = await fetch(pdfUrl);
      if (!resp.ok) return res.status(400).json({ error: 'Unable to fetch PDF' });
      const buffer = Buffer.from(await resp.arrayBuffer());
      const data = await pdf(buffer);
      const text = (data.text || '').trim();
      return res.status(200).json({ content: text });
    }

    // 2) OCR image via OCR.space (clé requise)
    if (imageUrl) {
      const apiKey = process.env.OCR_API_KEY;
      if (!apiKey) {
        return res.status(501).json({
          error: 'OCR for images is not configured. Set OCR_API_KEY in Vercel Environment Variables.'
        });
      }
      const form = new FormData();
      form.append('url', imageUrl);
      form.append('language', 'ara'); // arabe
      form.append('isOverlayRequired', 'false');

      const ocrResp = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: { apikey: apiKey },
        body: form
      });

      const ocrJson = await ocrResp.json();
      if (!ocrResp.ok || !ocrJson || !ocrJson.ParsedResults) {
        return res.status(400).json({ error: 'OCR failed or invalid response' });
      }
      const text = ocrJson.ParsedResults.map(r => r.ParsedText || '')
        .join('\n')
        .replace(/\r/g, '')
        .trim();

      return res.status(200).json({ content: text });
    }

    return res.status(400).json({ error: 'Invalid input' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', detail: String(err?.message || err) });
  }
}
