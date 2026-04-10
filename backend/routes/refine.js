const express = require('express');
const { refineMigrationPlan } = require('../services/claude');

const router = express.Router();

router.post('/', async (req, res) => {
  const { content, projectName, currentPlan, additionalNotes } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Original content is required' });
  }

  if (!currentPlan) {
    return res.status(400).json({ error: 'Current plan is required' });
  }

  if (!additionalNotes || additionalNotes.trim().length === 0) {
    return res.status(400).json({ error: 'Please provide additional information to refine the plan' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const trimmedContent = content.length > 100000
    ? content.substring(0, 100000) + '\n\n[Content truncated due to size limits]'
    : content;

  try {
    console.log(`Refining migration plan for: ${projectName || 'Unknown'}`);
    const plan = await refineMigrationPlan(trimmedContent, projectName, currentPlan, additionalNotes.trim());
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Refinement error:', err);

    if (err instanceof SyntaxError) {
      res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    } else if (err.status === 401) {
      res.status(401).json({ error: 'Invalid API key. Check your ANTHROPIC_API_KEY.' });
    } else if (err.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
    } else {
      res.status(500).json({ error: err.message || 'Failed to refine migration plan' });
    }
  }
});

module.exports = router;
