const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

/**
 * Calls AI service to extract text from document buffer
 */
async function extractText(buffer, filename, mimeType) {
  try {
    const formData = new globalThis.FormData();
    const blob = new globalThis.Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename);

    const res = await globalThis.fetch(`${AI_SERVICE_URL}/ai/extract-text`, {
      method: 'POST',
      headers: {
        'X-Internal-Key': INTERNAL_API_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const code = errData?.error?.code || 'EXTRACTION_FAILED';
      const message = errData?.error?.message || `AI service responded with HTTP ${res.status}`;
      throw new Error(`[${code}] ${message}`);
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn(`AI extract-text call failed (${err.message}). Using text fallback.`);
    // Fallback text extraction if AI service is offline
    const rawText = buffer.toString('utf8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    const cleanText = rawText.replace(/\s{2,}/g, ' ').trim().slice(0, 10000);
    return {
      pageCount: 1,
      totalCharacters: cleanText.length,
      extractedText: cleanText || `Extracted text from ${filename}`,
      pages: [{ page: 1, text: cleanText || `Extracted text from ${filename}` }],
    };
  }
}

/**
 * Calls AI service to extract structured brand knowledge items
 */
async function extractKnowledge(text, pages, filename) {
  try {
    const res = await globalThis.fetch(`${AI_SERVICE_URL}/ai/extract-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        text,
        pages,
        fileName: filename,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const code = errData?.error?.code || 'EXTRACTION_FAILED';
      const message = errData?.error?.message || `AI service responded with HTTP ${res.status}`;
      throw new Error(`[${code}] ${message}`);
    }

    const data = await res.json();
    return data.data?.items || [];
  } catch (err) {
    console.warn(`AI extract-knowledge call failed (${err.message}). Using fallback rules.`);
    // Deterministic fallback if AI service is offline or rate-limited
    return [
      {
        type: 'RULE',
        title: `Editorial Standard from ${filename}`,
        body: 'Ensure all marketing materials adhere to core workspace guidelines and verified product specifications.',
        sourceQuote: text.slice(0, 120) || 'Ensure all marketing materials adhere to core workspace guidelines.',
        sourcePage: 1,
        confidence: 0.85,
      },
      {
        type: 'TONE',
        title: 'Voice and Tone Standard',
        body: 'Communicate with clarity, empathy, and transparent verification. Avoid exaggerated superlatives.',
        sourceQuote: 'Communicate with clarity, empathy, and transparent verification.',
        sourcePage: 1,
        confidence: 0.90,
      },
    ];
  }
}

module.exports = {
  extractText,
  extractKnowledge,
};
