import sanitizeHtml from "sanitize-html";

export function sanitizeProblemDescription(description: unknown) {
  if (typeof description !== "string") {
    return "";
  }

  return sanitizeHtml(description, {
    allowedTags: ["p", "code", "b", "i", "strong", "em", "ul", "ol", "li", "br", "pre"],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}

