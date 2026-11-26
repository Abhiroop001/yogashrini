// Frontend/src/components/MarkdownView.tsx
// Lightweight, dependency-free Markdown renderer for AI outputs (Headings, Lists, Bold, Tables)
import React from "react";

interface MarkdownViewProps {
  content: string;
  compact?: boolean;
}

function renderInline(text: string): React.ReactNode[] {
  const cleaned = text.replace(/<br\s*\/?>/gi, " · ");
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} style={{ color: "var(--heading-color)", fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={idx} style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            background: "var(--brand-primary-subtle)",
            color: "var(--brand-primary)",
            padding: "1px 6px",
            borderRadius: 6,
            fontSize: "0.82em",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, compact = false }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line || /^-{3,}$/.test(line) || /^\*{3,}$/.test(line)) {
      i++;
      continue;
    }

    // Markdown table block
    if (line.startsWith("|") && i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
      const tableRows: string[][] = [];
      let rowIdx = i;
      while (rowIdx < lines.length && lines[rowIdx].trim().startsWith("|")) {
        const rowLine = lines[rowIdx].trim();
        if (!/^\|[\s:-]+\|/.test(rowLine)) {
          const cells = rowLine
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
          if (cells.length > 0) tableRows.push(cells);
        }
        rowIdx++;
      }
      if (tableRows.length > 0) {
        const [header, ...bodyRows] = tableRows;
        elements.push(
          <div key={`tbl-${i}`} className="table-responsive my-2">
            <table className="values-table" style={{ fontSize: "0.82rem", marginTop: 0 }}>
              <thead>
                <tr>
                  {header.map((cell, cIdx) => (
                    <th key={cIdx} style={{ padding: "8px 10px" }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: "7px 10px" }}>
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      i = rowIdx;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      elements.push(
        <div
          key={`h-${i}`}
          className="fw-bold mt-2 mb-1"
          style={{
            fontSize: level <= 2 ? "0.98rem" : "0.9rem",
            color: "var(--brand-primary)",
            borderBottom: level <= 2 ? "1px solid var(--border-subtle)" : "none",
            paddingBottom: level <= 2 ? 3 : 0,
          }}
        >
          {renderInline(headingMatch[2])}
        </div>
      );
      i++;
      continue;
    }

    // Bullet / Numbered list block
    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const isOrdered = /^\d+\.\s+/.test(line);
      const listItems: string[] = [];
      let liIdx = i;
      while (liIdx < lines.length) {
        const l = lines[liIdx].trim();
        if (isOrdered && /^\d+\.\s+/.test(l)) {
          listItems.push(l.replace(/^\d+\.\s+/, ""));
          liIdx++;
        } else if (!isOrdered && /^[-*•]\s+/.test(l)) {
          listItems.push(l.replace(/^[-*•]\s+/, ""));
          liIdx++;
        } else {
          break;
        }
      }
      const Tag = isOrdered ? "ol" : "ul";
      elements.push(
        <Tag
          key={`list-${i}`}
          className="ps-3 mb-2"
          style={{ fontSize: compact ? "0.84rem" : "0.88rem", color: "var(--text-secondary)" }}
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="mb-1">
              {renderInline(item)}
            </li>
          ))}
        </Tag>
      );
      i = liIdx;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className="mb-1"
        style={{ fontSize: compact ? "0.84rem" : "0.88rem", lineHeight: 1.55, color: "var(--text-secondary)" }}
      >
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="markdown-view-root">{elements}</div>;
};

export default MarkdownView;
