const apiKey = process.env.GROQ_API_KEY || '';

const MEDICAL_SYSTEM_PROMPT = `You are MediVault Health Assistant, an AI-powered medical document assistant embedded in the MediVault platform.

Your capabilities:
- Summarize medical reports and prescriptions in simple, patient-friendly language
- Identify key findings, medications, diagnoses, and lab values
- Highlight abnormal values (if present) and explain their significance
- Provide general health education and wellness information
- Answer healthcare-related questions clearly and empathetically

Your strict limitations:
- You NEVER provide a medical diagnosis
- You NEVER prescribe or recommend specific medications
- You NEVER replace professional medical advice
- You ALWAYS display a medical disclaimer with AI-generated content
- You ALWAYS encourage consulting a qualified healthcare professional
- When detecting emergency symptoms (chest pain, difficulty breathing, stroke signs, severe allergic reaction, loss of consciousness), you MUST immediately recommend calling emergency services (911/112)

Emergency keywords to watch: chest pain, heart attack, stroke, can't breathe, difficulty breathing, severe allergic reaction, anaphylaxis, overdose, unconscious, loss of consciousness, seizure, severe bleeding.

Format your responses in clear, structured markdown. Always end medical discussions with a disclaimer.`;

const DISCLAIMER = '\n\n---\n> ⚕️ **Medical Disclaimer**: This information is AI-generated and for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.';

const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', "can't breathe", 'difficulty breathing',
  'severe allergic', 'anaphylaxis', 'overdose', 'unconscious', 'loss of consciousness',
  'seizure', 'severe bleeding', 'cannot breathe', 'choking',
];

const checkEmergency = (text) => {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
};

const EMERGENCY_WARNING = `🚨 **EMERGENCY ALERT**: The symptoms you described may indicate a life-threatening emergency.

**Please call emergency services (112 / 911) immediately or go to the nearest emergency room.**

Do not wait for an online response in a medical emergency.

${DISCLAIMER}`;

const sanitizeErrorMessage = (msg) => {
  if (!msg) return '';
  return msg.replace(/(https?:\/\/[^\s`]+)/g, '`$1`');
};

/**
 * Summarize a medical record (text content)
 * @param {string} textContent - Extracted text from the document
 * @param {string} recordTitle - Title of the record
 * @param {string} category - Category (e.g., 'Lab', 'Prescription')
 */
const summarizeRecord = async (textContent, recordTitle, category) => {
  try {
    const prompt = `You are analyzing a medical document for a patient.

Document Title: ${recordTitle}
Document Category: ${category}
Content:
---
${textContent.substring(0, 8000)}
---

Please provide:
1. **Summary**: A clear, patient-friendly summary (3-5 sentences)
2. **Key Findings**: A bullet list of the most important findings, diagnoses, medications, or instructions
3. **Abnormal Values**: Any lab values, vitals, or findings that are outside normal range (if applicable)
4. **Wellness Recommendations**: General health tips relevant to this document

Format your response as JSON with this structure:
{
  "summary": "...",
  "keyFindings": ["finding1", "finding2"],
  "abnormalValues": ["value1: explanation"],
  "wellnessRecommendations": "..."
}

If you cannot identify abnormal values, use an empty array.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API Error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    const responseText = data.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: responseText,
        keyFindings: [],
        abnormalValues: [],
        wellnessRecommendations: '',
      };
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        summary: responseText,
        keyFindings: [],
        abnormalValues: [],
        wellnessRecommendations: '',
      };
    }
  } catch (err) {
    console.error('AI API Error in summarizeRecord:', err.message);
    // Return a mock summary as a graceful fallback
    return {
      summary: `Note: Offline Mode (AI Quota Limit). This is a mock patient-friendly summary for "${recordTitle}" (${category}). To enable live AI summaries, verify your Groq API key in backend/.env has active free tier/paid quota.`,
      keyFindings: [
        `Document Name: ${recordTitle}`,
        `Document Category: ${category}`,
        `API Status: ${sanitizeErrorMessage(err.message)}`
      ],
      abnormalValues: [],
      wellnessRecommendations: 'Ensure your backend/.env contains a valid Groq API key with active quota.'
    };
  }
};

/**
 * Chat with the health assistant
 * @param {string} message - User message
 * @param {Array} history - Chat history [{role, content}]
 * @param {string|null} contextRecord - Optional record context text
 */
const chatWithAssistant = async (message, history = [], contextRecord = null) => {
  // Emergency check
  if (checkEmergency(message)) {
    return { response: EMERGENCY_WARNING, isEmergency: true };
  }

  try {
    const contextPrompt = contextRecord
      ? `\n\nThe patient has provided a medical record as context:\n${contextRecord.substring(0, 3000)}`
      : '';

    const messages = [
      { role: 'system', content: MEDICAL_SYSTEM_PROMPT + contextPrompt },
      ...history.slice(-10).map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      })),
      { role: 'user', content: message }
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API Error: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    const response = data.choices[0].message.content + DISCLAIMER;

    return { response, isEmergency: false };
  } catch (err) {
    console.error('AI API Error in chatWithAssistant:', err.message);
    return {
      response: `🤖 **MediVault Assistant (Offline Mode)**: I cannot process your request because the AI service is currently unavailable or your API key has run out of quota.\n\n*Error details:* ${sanitizeErrorMessage(err.message)}\n\nPlease check your backend \`.env\` file. ${DISCLAIMER}`,
      isEmergency: false,
    };
  }
};

module.exports = { summarizeRecord, chatWithAssistant };
