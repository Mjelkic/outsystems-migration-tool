const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.docx', '.doc', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  }
});

async function extractText(filePath, mimetype, originalname) {
  const ext = path.extname(originalname).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // .txt, .md, or anything else readable
  return fs.readFileSync(filePath, 'utf-8');
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractText(req.file.path, req.file.mimetype, req.file.originalname);

    // Clean up uploaded file after extraction
    fs.unlinkSync(req.file.path);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from file' });
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      content: text
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process file' });
  }
});

module.exports = router;
