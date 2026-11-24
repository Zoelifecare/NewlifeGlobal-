import "server-only";
import { after } from "next/server";

/**
 * The public website (separate repository, hosted at newlifeglobalaz.org) is built as plain files from the
 * published content. When staff change public content here, ask GitHub to rebuild and upload it.
 *
 * Needs, in Vercel:
 *   WEBSITE_REPO          e.g. "Zoelifecare/newlifeglobal-website"
 *   WEBSITE_DEPLOY_TOKEN  a fine-grained GitHub token for that repository only, with "Contents: read and write"
 *                         (repository_dispatch requires it). Never commit it.
 * Without them this does nothing. Many saves in a row are fine: the website workflow cancels older runs.
 */
export function requestWebsiteRebuild(reason = "content-updated") {
  const repo = process.env.WEBSITE_REPO;
  const token = process.env.WEBSITE_DEPLOY_TOKEN;
  if (!repo || !token) return;
  const send = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "newlifeglobal-admin" },
        body: JSON.stringify({ event_type: "content-updated", client_payload: { reason } }),
      });
      if (!res.ok) console.error("website rebuild request failed", res.status);
    } catch (e) {
      console.error("website rebuild request failed", e);
    }
  };
  try {
    after(send); // after the response, so saving never waits on GitHub
  } catch {
    void send();
  }
}
