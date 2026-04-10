const STORAGE_KEY = 'os-migration-plans';
const MAX_ENTRIES = 20;

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function savePlan(plan, originalContent, projectName) {
  const entries = loadAll();
  const id = Date.now().toString();

  // If a plan with the same project name already exists, update it
  const existingIdx = entries.findIndex(e => e.projectName === projectName);

  const entry = {
    id: existingIdx >= 0 ? entries[existingIdx].id : id,
    projectName,
    savedAt: new Date().toISOString(),
    complexity: plan.projectSummary?.complexity || '',
    originalTechnology: plan.projectSummary?.originalTechnology || '',
    estimatedModules: plan.projectSummary?.estimatedModules || 0,
    plan,
    // Store enough content for the refine feature (matches Claude's slice limit)
    originalContent: (originalContent || '').slice(0, 8000),
  };

  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.unshift(entry); // newest first
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  }

  saveAll(entries);
  return entry.id;
}

export function getAllPlans() {
  return loadAll();
}

export function deletePlan(id) {
  saveAll(loadAll().filter(e => e.id !== id));
}
