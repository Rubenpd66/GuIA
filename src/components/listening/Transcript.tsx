import { useTranslations } from "next-intl";
import { RichText } from "@/components/content/RichText";
import type { Script } from "@/lib/content/schemas/listening";

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The script with the speaker of each turn; `cues` are highlighted where they occur. */
export function Transcript({
  script,
  cues = [],
  open = false,
}: {
  script: Script;
  cues?: readonly string[];
  open?: boolean;
}) {
  const t = useTranslations("Listening.trainer");
  const pattern = cues.length
    ? new RegExp(`(${cues.map(escape).join("|")})`, "gi")
    : null;
  return (
    <details
      open={open}
      className="rounded-control border-[1.5px] border-hairline p-3"
    >
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
        {t("showTranscript")}
      </summary>
      <div lang="en" className="prose-reading mt-2 space-y-2">
        {script.map((line, i) => (
          <p key={i}>
            <span className="mr-2 font-sans text-sm font-bold text-ink-soft">
              {t(`speakers.${line.speaker}`)}:
            </span>
            <RichText
              text={pattern ? line.text.replace(pattern, "==$1==") : line.text}
            />
          </p>
        ))}
      </div>
    </details>
  );
}
