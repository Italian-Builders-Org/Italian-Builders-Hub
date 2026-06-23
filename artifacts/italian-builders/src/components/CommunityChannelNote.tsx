import { MessageCircle } from "lucide-react";

type CommunityChannelNoteProps = {
  techLabels: boolean;
  className?: string;
};

export function CommunityChannelNote({
  techLabels,
  className = "",
}: CommunityChannelNoteProps) {
  return (
    <div
      className={`rounded-sm border border-blue-500/20 bg-blue-500/5 p-4 ${className}`}
    >
      <div className="mb-2 flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400">
        <MessageCircle size={12} />
        {techLabels ? "COMMUNITY_CHANNEL" : "Where we talk"}
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">
        {techLabels
          ? "Private Telegram group. Submit the waitlist form, verify your email, then wait for approval before the invite link is sent."
          : "The community already talks and grows on a private Telegram group. Access is invite-only: join the waitlist, verify your email, and wait for approval before you receive the link."}
      </p>
    </div>
  );
}
