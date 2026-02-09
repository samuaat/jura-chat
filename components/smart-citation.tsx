"use client";

import React from "react";
import { CITATION_REGEX, buildJogtarUrl } from "@/lib/citation-regex";

interface SmartCitationProps {
  children: React.ReactNode;
}

export function SmartCitation({ children }: SmartCitationProps) {
  if (typeof children !== "string") {
    return <>{children}</>;
  }

  const text = children;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Reset regex state
  CITATION_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const citation = match[1];
    const matchStart = match.index + (match[0].length - match[0].trimStart().length);
    const matchEnd = match.index + match[0].length;

    // Text before the match
    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }

    // The citation as a link
    parts.push(
      <a
        key={`citation-${matchStart}`}
        href={buildJogtarUrl(citation)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {citation}
      </a>
    );

    lastIndex = matchEnd;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
}
