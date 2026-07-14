"use client";

/**
 * input: a detail page URL and compact meme take-away text
 * output: clipboard buttons with immediate copied feedback
 * pos: small client-only interaction island for static detail pages
 */
import { useState } from "react";
import { Check, Copy, LinkIcon, type LucideIcon } from "lucide-react";

type CopyButtonsProps = {
  link: string;
  takeText: string;
};

type CopyKind = "link" | "take";
type ClipboardResult = "copied" | "failed" | "unsupported";

async function writeClipboard(value: string): Promise<ClipboardResult> {
  if (!navigator.clipboard) return "unsupported";
  try {
    await navigator.clipboard.writeText(value);
    return "copied";
  } catch {
    return "failed";
  }
}

type ClipboardButtonProps = {
  active: boolean;
  className: string;
  icon: LucideIcon;
  idleLabel: string;
  successLabel: string;
  onClick: () => void;
};

function ClipboardButton(props: ClipboardButtonProps) {
  const Icon = props.active ? Check : props.icon;
  return (
    <button className={props.className} onClick={props.onClick} type="button">
      <Icon size={15} aria-hidden="true" />
      {props.active ? props.successLabel : props.idleLabel}
    </button>
  );
}

type CopyActionsProps = CopyButtonsProps & {
  copied: CopyKind | null;
  feedback: string;
  onCopy: (value: string, kind: CopyKind) => void;
};

function CopyActions({ copied, feedback, link, onCopy, takeText }: CopyActionsProps) {
  return (
    <div>
      <div className="tag-row" style={{ marginTop: 22 }}>
        <ClipboardButton
          active={copied === "take"}
          className="button primary"
          icon={Copy}
          idleLabel="复制带走"
          successLabel="已复制"
          onClick={() => onCopy(takeText, "take")}
        />
        <ClipboardButton
          active={copied === "link"}
          className="button"
          icon={LinkIcon}
          idleLabel="复制链接"
          successLabel="链接已复制"
          onClick={() => onCopy(link, "link")}
        />
      </div>
      <p aria-atomic="true" aria-live="polite" className="copy-feedback" role="status">
        {feedback}
      </p>
    </div>
  );
}

async function performCopy(
  value: string,
  kind: CopyKind,
  setCopied: (value: CopyKind | null) => void,
  setFeedback: (value: string) => void,
) {
  const result = await writeClipboard(value);
  if (result === "unsupported") {
    setFeedback("当前浏览器不支持自动复制，请长按文字手动复制。");
    return;
  }
  if (result === "failed") {
    setCopied(null);
    setFeedback("复制失败，请检查浏览器剪贴板权限后重试。");
    return;
  }
  setCopied(kind);
  setFeedback(kind === "link" ? "链接已复制。" : "内容已复制。");
  window.setTimeout(() => {
    setCopied(null);
    setFeedback("");
  }, 1500);
}

export function CopyButtons({ link, takeText }: CopyButtonsProps) {
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const [feedback, setFeedback] = useState("");
  const onCopy = (value: string, kind: CopyKind) => {
    void performCopy(value, kind, setCopied, setFeedback);
  };
  return <CopyActions {...{ copied, feedback, link, onCopy, takeText }} />;
}
