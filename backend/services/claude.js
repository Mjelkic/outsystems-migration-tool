const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const baseURL = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');

// Singleton — created once, reused across all requests
const client = axios.create({
  baseURL,
  httpsAgent,
  headers: {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  },
  timeout: 180000
});

const SYSTEM_PROMPT = `You are an OutSystems migration architect. Your response is fed directly into JSON.parse(). Any character outside the JSON object — markdown fences, explanation, whitespace before { — will throw a SyntaxError and break the application. Output ONLY the raw JSON object, starting with { and ending with }. No \`\`\`json, no \`\`\`, no text before or after.

Use this exact structure. Keep all string values concise (under 20 words). Limit arrays to the most important items only (max 5 per array):

{"projectSummary":{"name":"","description":"","complexity":"Low|Medium|High","estimatedModules":0,"originalTechnology":""},"dataModel":{"entities":[{"name":"","description":"","attributes":[{"name":"","dataType":"Text|Integer|Boolean|DateTime|Decimal|Email|Phone|Currency","isPrimaryKey":false,"isMandatory":false,"description":""}],"relationships":[{"entity":"","type":"OneToMany|ManyToOne|ManyToMany|OneToOne","description":""}]}]},"architecture":{"modules":[{"name":"","layer":"End-User|Core|Foundation|Integration","type":"Web|Mobile|Service|Library","description":"","dependencies":[],"mainFunctionalities":[]}],"layerDiagram":""},"screens":[{"name":"","module":"","type":"Web Screen|Mobile Screen|Popup|Block","description":"","uiComponents":[],"actions":[],"roles":[]}],"businessLogic":{"serverActions":[{"name":"","module":"","description":"","inputs":[{"name":"","dataType":""}],"outputs":[{"name":"","dataType":""}],"logic":""}],"clientActions":[{"name":"","screen":"","description":"","logic":""}],"timers":[{"name":"","schedule":"","description":""}]},"integrations":[{"name":"","type":"REST|SOAP|SAP|Database|File|Email|SMS","direction":"Inbound|Outbound|Both","description":"","endpoints":[]}],"security":{"roles":[{"name":"","description":"","permissions":[]}],"authenticationMethod":"","sensitiveData":[]},"roadmap":{"phases":[{"phase":1,"name":"","duration":"","tasks":[],"deliverables":[],"dependencies":[]}],"totalEstimatedDuration":"","risks":[{"risk":"","impact":"High|Medium|Low","mitigation":""}]},"recommendations":[]}`;

function parseResponse(rawText, label) {
  const stripped = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const first = stripped.indexOf('{');
  const last = stripped.lastIndexOf('}');
  const jsonText = (first !== -1 && last !== -1) ? stripped.slice(first, last + 1) : stripped;
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error(`JSON parse error (${label}). Raw (first 500):`, rawText.slice(0, 500));
    throw new SyntaxError('AI returned invalid JSON: ' + e.message);
  }
}

async function generateMigrationPlan(projectContent, projectName) {
  const userMessage = `Project: ${projectName || 'Unknown'}

Documentation:
${projectContent.slice(0, 8000)}

Return the JSON migration plan. Be concise.`;

  const response = await client.post('/v1/messages', {
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });

  return parseResponse(response.data.content[0].text, 'generate');
}

async function refineMigrationPlan(projectContent, projectName, currentPlan, additionalNotes) {
  const userMessage = `Project: ${projectName || 'Unknown'}

Original Documentation:
${projectContent.slice(0, 6000)}

Current Migration Plan (JSON):
${JSON.stringify(currentPlan).slice(0, 6000)}

Additional Information / Corrections:
${additionalNotes}

Update the migration plan to incorporate the additional information above. Return the complete updated JSON plan.`;

  const response = await client.post('/v1/messages', {
    model: process.env.CLAUDE_MODEL || 'claude-opus-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });

  return parseResponse(response.data.content[0].text, 'refine');
}

module.exports = { generateMigrationPlan, refineMigrationPlan };
