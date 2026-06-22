"use client";

/**
 * input: a detail page URL and compact meme take-away text
 * output: clipboard buttons with immediate copied feedback
 * pos: small client-only interaction island for static detail pages
 */
import { useState } from "react";
import { Check, Copy, LinkIcon } from "lucide-react";

type CopyButtonsProps = {
  link: string;
  takeText: string;
};

export function CopyButtons({ link, takeText }: CopyButtonsProps) {
  const [copied, setCopied] = useState<"link" | "take" | null>(null);

  async function copy(value: string, kind: "link" | "take") {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard can reject (insecure context / permission denied); fail silently.
    }
  }

  return (
    <div className="tag-row" style={{ marginTop: 22 }}>
      <button className="button primary" onClick={() => copy(takeText, "take")} type="button">
        {copied === "take" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        {copied === "take" ? "已复制" : "复制带走"}
      </button>
      <button className="button" onClick={() => copy(link, "link")} type="button">
        {copied === "link" ? <Check size={15} aria-hidden="true" /> : <LinkIcon size={15} aria-hidden="true" />}
        {copied === "link" ? "链接已复制" : "复制链接"}
      </button>
    </div>
  );
}
