import {
  criticalUrgencyWords,
  highUrgencyWords,
  intentKeywords,
  intents,
  mediumUrgencyWords,
  negativeSignalWords,
  positiveSignalWords,
  recommendationTemplates,
  responseTemplates,
  sentiments,
  urgencies
} from '../spec/emailRules.js';

function normalizeText(subject, body) {
  return `${subject} ${body}`
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(text, patterns) {
  return patterns.reduce((count, pattern) => count + (text.includes(pattern) ? 1 : 0), 0);
}

function classifyIntent(text) {
  const scores = Object.fromEntries(intents.map((intent) => [intent, countMatches(text, intentKeywords[intent] || [])]));
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestIntent, bestScore] = sorted[0];
  const totalScore = sorted.reduce((sum, [, value]) => sum + value, 0) || 1;
  const confidence = Math.min(0.95, 0.4 + (bestScore / totalScore) * 0.5);
  return {
    intent: bestIntent || 'general_inquiry',
    confidence: bestIntent ? confidence : 0.6
  };
}

function calculateSentiment(text) {
  const positiveCount = countMatches(text, positiveSignalWords);
  const negativeCount = countMatches(text, negativeSignalWords);
  const score = Math.max(-1, Math.min(1, (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1)));
  const sentiment = score > 0.25 ? 'positive' : score < -0.25 ? 'negative' : 'neutral';
  const confidence = Math.min(0.95, 0.55 + Math.abs(score) * 0.45 + Math.min(0.2, (positiveCount + negativeCount) * 0.05));
  return { sentiment, score, confidence };
}

function calculateUrgency(text, intent, sentimentScore) {
  if (countMatches(text, criticalUrgencyWords) > 0) {
    return { urgency: 'critical', score: 1, confidence: 0.95 };
  }

  const highMatches = countMatches(text, highUrgencyWords);
  const mediumMatches = countMatches(text, mediumUrgencyWords);
  const intentUrgency = intent === 'support_request' || intent === 'invoice_request' ? 0.25 : 0;
  const score = Math.min(1, Math.max(0, (highMatches * 0.35 + mediumMatches * 0.2 + intentUrgency + Math.abs(sentimentScore) * 0.15)));

  if (score >= 0.7) return { urgency: 'high', score, confidence: 0.85 };
  if (score >= 0.35) return { urgency: 'medium', score, confidence: 0.75 };
  return { urgency: 'low', score, confidence: 0.7 };
}

function buildRecommendations(intent, urgency, sentiment) {
  const intentRecommendations = recommendationTemplates[intent] || recommendationTemplates.general_inquiry;
  const priorityRecommendations = [];

  if (urgency === 'critical') {
    priorityRecommendations.push('Escalate this email immediately and notify the appropriate owner.');
  } else if (urgency === 'high') {
    priorityRecommendations.push('Prioritize follow-up within the next business hour.');
  }

  if (sentiment === 'negative') {
    priorityRecommendations.push('Assign a customer success owner and address the customer sentiment directly.');
  }

  return [...priorityRecommendations, ...intentRecommendations];
}

function generateAutoResponse(intent, urgency, sentiment) {
  const template = responseTemplates[intent] || responseTemplates.general_inquiry;
  const urgencyPhrase = urgency === 'critical' ? 'This request is being prioritized.' : urgency === 'high' ? 'We are reviewing this with priority.' : 'We will review this and respond soon.';
  const sentimentPhrase = sentiment === 'negative' ? ' I understand your concern and will work to resolve it quickly.' : sentiment === 'positive' ? ' Thank you for your positive note.' : '';
  return `${template} ${urgencyPhrase}${sentimentPhrase}`.trim();
}

export function analyzeEmail({ subject = '', body = '' }) {
  const text = normalizeText(subject, body);
  const { sentiment, score: sentimentScore, confidence: sentimentConfidence } = calculateSentiment(text);
  const { intent, confidence: intentConfidence } = classifyIntent(text);
  const { urgency, score: urgencyScore, confidence: urgencyConfidence } = calculateUrgency(text, intent, sentimentScore);
  const autoResponse = generateAutoResponse(intent, urgency, sentiment);
  const recommendations = buildRecommendations(intent, urgency, sentiment);

  const overallConfidence = Number(
    Math.max(0.55, Math.min(0.98, (sentimentConfidence + intentConfidence + urgencyConfidence) / 3)).toFixed(2)
  );

  return {
    analysisVersion: '1.0',
    sentiment,
    sentimentScore: Number(sentimentScore.toFixed(2)),
    intent,
    intentConfidence: Number(intentConfidence.toFixed(2)),
    urgency,
    urgencyScore: Number(urgencyScore.toFixed(2)),
    confidence: overallConfidence,
    autoResponse,
    recommendations,
    processed: true
  };
}
