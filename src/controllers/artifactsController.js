import fs from 'fs';
import path from 'path';

export async function listArtifacts (req, res, next) {
  try {
    const artifactsDir = path.join(process.cwd(), 'artifacts');
    if (!fs.existsSync(artifactsDir)) return res.json({ artifacts: [] });

    const files = fs.readdirSync(artifactsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const full = path.join(artifactsDir, f);
        const stat = fs.statSync(full);
        return {
          name: f,
          path: full,
          size: stat.size,
          mtime: stat.mtime.toISOString()
        };
      })
      .sort((a,b) => new Date(b.mtime) - new Date(a.mtime));

    return res.json({ artifacts: files });
  } catch (err) {
    return next(err);
  }
}
