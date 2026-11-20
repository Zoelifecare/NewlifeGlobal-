/** ai.gov.rw P4 — kicker + H2 + lead on the left, page-level "01 / 04" index on the right. */
export function SectionHead({
  kicker, title, lead, index, total, tone = "dark", id, as: Tag = "h2",
}: {
  kicker?: string | null; title?: string | null; lead?: string | null;
  index?: number; total?: number; tone?: "dark" | "light"; id?: string; as?: "h1" | "h2";
}) {
  return (
    <div className="nl-sec-head">
      <div className="nl-sec-head__left nl-reveal">
        {kicker && <p className={`nl-label ${tone === "light" ? "nl-label--light" : ""}`}>{kicker}</p>}
        {title && <Tag id={id} className={Tag === "h1" ? "nl-h1" : "nl-h2"} style={tone === "light" ? { color: "#fff" } : undefined}>{title}</Tag>}
        {lead && <p className="nl-lead" style={tone === "light" ? { color: "rgba(255,255,255,.72)" } : undefined}>{lead}</p>}
      </div>
      {index !== undefined && total !== undefined && (
        <span className="nl-index nl-num pb-1.5" aria-label={`Section ${index} of ${total}`}>
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}
