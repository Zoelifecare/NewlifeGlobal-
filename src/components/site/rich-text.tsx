/** Plain text from the CMS: blank lines become paragraphs, single line breaks are kept. No HTML is interpreted. */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={`grid gap-4 ${className}`}>
      {paras.map((p, i) => <p key={i} className="m-0 whitespace-pre-line">{p}</p>)}
    </div>
  );
}
