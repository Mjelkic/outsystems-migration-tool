const express = require('express');
const { generateMigrationPlan } = require('../services/claude');

const router = express.Router();

router.post('/', async (req, res) => {
  const { content, projectName } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'No content provided for analysis' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  try {
    console.log(`Generating migration plan for: ${projectName || 'Unknown'} (${content.length} chars)`);
    const plan = await generateMigrationPlan(content, projectName);
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Generation error:', err);

    if (err instanceof SyntaxError) {
      res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    } else if (err.response?.status === 401) {
      res.status(401).json({ error: 'Invalid API key. Check your ANTHROPIC_API_KEY.' });
    } else if (err.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
    } else {
      res.status(500).json({ error: err.message || 'Failed to generate migration plan' });
    }
  }
});

module.exports = router;
