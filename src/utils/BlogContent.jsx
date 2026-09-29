

/**
 * Blog media helpers.
 *
 * Photos and videos are stored inside the blog's normal `content` text, one per
 * line, so NO database change is needed:
 *
 *   {{image:https://res.cloudinary.com/.../photo.jpg}}
 *   {{image:https://res.cloudinary.com/.../photo2.jpg|Optional caption}}
 *   {{video:https://res.cloudinary.com/.../clip.mp4|Optional caption}}
 *
 * Consecutive image lines are shown together as a responsive gallery.
 */

const MEDIA_LINE = /^\{\{(image|video):(.+?)(?:\|(.*?))?\}\}$/;

const isCloudinary = (url = "") => /res\.cloudinary\.com/.test(url);

// Not trimmed on purpose: the admin caption box needs to keep spaces while typing.
export const cleanCaption = (text = "") =>
  String(text).replace(/\}\}/g, "").replace(/[\r\n]+/g, " ");

export function makeMediaToken(type, url, caption = "") {
  const clean = cleanCaption(caption);

  return `{{${type}:${url}${clean.trim() ? `|${clean}` : ""}}}`;
}

export function parseMediaLine(line = "") {
  const match = String(line).trim().match(MEDIA_LINE);

  if (!match) return null;

  return {
    type: match[1],
    url: match[2].trim(),
    caption: match[3] || "",
  };
}

/**
 * Splits content into blocks:
 *   { type: "text", text }
 *   { type: "gallery", items: [{ url, caption }] }   (1 or more consecutive images)
 *   { type: "video", url, caption }
 */
export function parseBlogContent(content = "") {
  const blocks = [];
  let textLines = [];

  const flushText = () => {
    const text = textLines.join("\n").replace(/^\n+|\n+$/g, "");

    if (text.trim()) {
      blocks.push({ type: "text", text });
    }

    textLines = [];
  };

  for (const line of String(content || "").split(/\r?\n/)) {
    const media = parseMediaLine(line);

    if (!media) {
      textLines.push(line);
      continue;
    }

    flushText();

    if (media.type === "video") {
      blocks.push({ type: "video", url: media.url, caption: media.caption.trim() });
      continue;
    }

    const item = { url: media.url, caption: media.caption.trim() };
    const last = blocks[blocks.length - 1];

    if (last?.type === "gallery") {
      last.items.push(item);
    } else {
      blocks.push({ type: "gallery", items: [item] });
    }
  }

  flushText();

  return blocks;
}

/** Content with the media lines removed (for word counts, plain-text use). */
export function stripMediaTokens(content = "") {
  return String(content || "")
    .split(/\r?\n/)
    .filter((line) => !parseMediaLine(line))
    .join("\n");
}

/** All media lines in order: [{ type, url, caption }] */
export function extractMedia(content = "") {
  return String(content || "")
    .split(/\r?\n/)
    .map(parseMediaLine)
    .filter(Boolean);
}

/**
 * Changes or removes the Nth media line.
 * updater(media) returns { type, url, caption } to replace it, or null to remove it.
 */
export function updateMediaAt(content = "", index, updater) {
  const out = [];
  let position = -1;

  for (const line of String(content || "").split(/\r?\n/)) {
    const media = parseMediaLine(line);

    if (!media) {
      out.push(line);
      continue;
    }

    position += 1;

    if (position !== index) {
      out.push(line);
      continue;
    }

    const next = updater(media);

    if (next) {
      out.push(makeMediaToken(next.type, next.url, next.caption));
    }
  }

  return out.join("\n");
}

/* ---------- video helpers ---------- */

/** iPhone .mov files are converted to mp4 by Cloudinary just by changing the extension. */
export function getVideoSrc(url = "") {
  if (isCloudinary(url) && /\.mov$/i.test(url)) {
    return url.replace(/\.mov$/i, ".mp4");
  }

  return url;
}

export function getVideoType(url = "") {
  const src = getVideoSrc(url);

  if (/\.webm$/i.test(src)) return "video/webm";

  return "video/mp4";
}

/** Cloudinary can return the first frame of a video as a .jpg poster. */
export function getVideoPoster(url = "") {
  return isCloudinary(url) ? url.replace(/\.[^./?]+$/, ".jpg") : undefined;
}