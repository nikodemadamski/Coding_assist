import { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

// Renders trusted-ish markdown (our own seed bank + questions the user imported
// into their own browser). Not meant for arbitrary third-party content.
export default function Markdown({ text }) {
  const html = useMemo(() => marked.parse(text || ''), [text]);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
