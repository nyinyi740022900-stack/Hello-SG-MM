import fs from "fs";
import path from "path";
import { CONTENT_CATEGORIES, type ContentCategory } from "@/lib/content";

/**
 * Optional per-category thumbnail, read from `public/categories/`.
 *
 * A dense headline feed needs a visual anchor on each row or it reads as a wall
 * of text — which matters more here than on an English site, because Myanmar
 * script is already visually dense. Rather than hot-linking news photography
 * (copyrighted, and a legal risk), each category gets one reusable
 * illustration. One drawing per topic, not one per story, so the feed gains
 * anchors without adding daily work to the review routine.
 *
 * Every category is optional: a missing file falls back to the coloured badge,
 * so the feed works before any artwork exists and degrades safely if a file is
 * removed.
 */

const CATEGORY_DIR = path.join(process.cwd(), "public", "categories");
const EXTENSIONS = [".webp", ".png", ".jpg", ".svg"];

export type CategoryImageMap = Partial<Record<ContentCategory, string>>;

/**
 * Resolved once per server process, not once per request.
 *
 * These files ship with the deployment and cannot change while the process is
 * alive, but the lookup was running on every render: twelve categories times
 * four extensions is up to forty-eight synchronous `existsSync` calls, on the
 * critical path, before the feed could be sent. Caching the answer makes every
 * request after the first one free.
 */
let cachedMap: CategoryImageMap | null = null;

/**
 * Resolve which categories currently have artwork.
 *
 * Called once per render rather than per row: this touches the filesystem, and
 * a feed of thirty items should not mean thirty stat calls.
 */
export function getCategoryImages(): CategoryImageMap {
  if (cachedMap) return cachedMap;

  const map: CategoryImageMap = {};

  for (const category of CONTENT_CATEGORIES) {
    for (const ext of EXTENSIONS) {
      const filename = `${category}${ext}`;
      try {
        if (fs.existsSync(path.join(CATEGORY_DIR, filename))) {
          map[category] = `/categories/${filename}`;
          break;
        }
      } catch {
        // Unreadable directory is not worth failing a page render over.
      }
    }
  }

  cachedMap = map;
  return map;
}
