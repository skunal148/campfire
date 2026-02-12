import { redirect } from "next/navigation";
import { getChannels } from "@/lib/actions/channels";

export default async function WorkspacePage() {
  const channels = await getChannels();
  const general = channels.find((c) => c.name === "general");

  if (general) {
    redirect(`/channel/${general.id}`);
  }

  return (
    <div className="flex flex-1 items-center justify-center text-muted-foreground">
      <p>Select a channel to start messaging</p>
    </div>
  );
}
