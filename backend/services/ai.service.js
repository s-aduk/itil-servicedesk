/**
 * AI Resolution Suggestion Service
 * Uses Claude API to suggest resolutions based on ticket content and KB articles.
 */

const getAiSuggestion = async (ticket, relatedArticles = []) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw Object.assign(new Error('ANTHROPIC_API_KEY not configured'), { statusCode: 503 });

  const articleContext = relatedArticles.length
    ? `\n\nRelated Knowledge Base Articles:\n${relatedArticles.map((a, i) => `${i + 1}. [${a.category}] ${a.title}`).join('\n')}`
    : '';

  const prompt = `You are an ITIL-aligned IT support assistant for a banking operations service desk in Ghana.

Ticket Details:
- Ticket Number: ${ticket.ticketNumber}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Title: ${ticket.title}
- Description: ${ticket.description}
- Current Status: ${ticket.status}
- Escalation Tier: ${ticket.currentEscalationTier || 'None'}${articleContext}

Provide a structured resolution suggestion in the following JSON format only (no markdown, no preamble):
{
  "immediateSteps": ["step1", "step2", "step3"],
  "rootCauseLikely": "Brief root cause analysis",
  "estimatedResolutionTime": "e.g. 30 minutes",
  "escalationRecommended": false,
  "escalationReason": "only if true",
  "preventionTips": ["tip1", "tip2"],
  "relevantTeam": "e.g. Network Team / Database Team / Security Team"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw Object.assign(new Error(err.error?.message || 'AI service unavailable'), { statusCode: 502 });
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || '{}';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { immediateSteps: [raw], rootCauseLikely: 'Could not parse structured response', estimatedResolutionTime: 'Unknown', escalationRecommended: false, preventionTips: [], relevantTeam: 'IT Support' };
  }
};

module.exports = { getAiSuggestion };
