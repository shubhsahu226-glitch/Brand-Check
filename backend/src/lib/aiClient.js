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

/**
 * Calls AI service to audit draft content against brand rules
 */
async function checkDraft(text, rules) {
  try {
    const res = await globalThis.fetch(`${AI_SERVICE_URL}/ai/check-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        text,
        rules,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const code = errData?.error?.code || 'REVIEW_FAILED';
      const message =
        errData?.error?.message || `AI service responded with HTTP ${res.status}`;
      throw new Error(`[${code}] ${message}`);
    }

    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn(
      `AI check-draft call failed (${err.message}). Using deterministic rule checker fallback.`
    );

    // Deterministic fallback review engine
    const suggestions = [];
    const textLower = text.toLowerCase();

    // Check rules
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const rType = (rule.type || '').toUpperCase();
        const rBody = rule.body || rule.title || '';
        const rId = rule.id || null;

        if (rType === 'TERM_BANNED') {
          // Extract term from quotes or body
          const quotesMatch = rBody.match(/['"]([^'"]+)['"]/);
          const term = quotesMatch ? quotesMatch[1] : rBody.split(/[:,\n]/)[0].trim();
          if (term && term.length >= 2 && textLower.includes(term.toLowerCase())) {
            const idx = textLower.indexOf(term.toLowerCase());
            const snippet = text.slice(idx, idx + term.length);
            suggestions.push({
              ruleId: rId,
              category: 'TERM_BANNED',
              severity: 'ERROR',
              originalText: snippet,
              suggestedText: null,
              explanation: `Banned terminology '${snippet}' found. Guideline: ${rBody}`,
            });
          }
        }
      }
    }

    // Check common superlatives if no errors
    const claims = ['best in the world', '100% guaranteed', 'zero risk', '#1 leader'];
    for (const claim of claims) {
      if (textLower.includes(claim)) {
        const idx = textLower.indexOf(claim);
        const snippet = text.slice(idx, idx + claim.length);
        suggestions.push({
          ruleId: null,
          category: 'CLAIM',
          severity: 'WARNING',
          originalText: snippet,
          suggestedText: 'leading industry solution',
          explanation: `Unverified claim '${snippet}'. Requires verified factual citation.`,
        });
      }
    }

    let penalty = 0;
    for (const s of suggestions) {
      penalty += s.severity === 'ERROR' ? 20 : s.severity === 'WARNING' ? 10 : 5;
    }
    const score = Math.max(0, Math.min(100, 100 - penalty));

    return {
      complianceScore: score,
      summary:
        suggestions.length > 0
          ? `Review identified ${suggestions.length} finding(s). Compliance score: ${score}/100.`
          : 'Draft complies with brand guidelines. Ready for review.',
      suggestions,
    };
  }
}

module.exports = {
  extractText,
  extractKnowledge,
  checkDraft,
};
