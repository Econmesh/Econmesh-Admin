"use client";

import { Mail } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";

import type { NotificationChannel } from "@/types/api";

type CampaignChannelsProps = {
  channels: NotificationChannel[];
};

function InAppChannelIcon() {
  const { resolvedTheme } = useTheme();
  const src =
    resolvedTheme === "dark" ? "/ECONMESH-LOGO-BRANCO.png" : "/ECONMESH-LOGO.png";

  return (
    <span className="flex flex-col items-center " title="App">
      <Image
        src={src}
        alt=""
        width={72}
        height={16}
        className="h-4 w-auto"
        style={{ width: "auto" }}
      />
      
    </span>
  );
}

export function CampaignChannels({ channels }: CampaignChannelsProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      {channels.map((channel) =>
        channel === "in_app" ? (
          <InAppChannelIcon key={channel} />
        ) : (
          <span
            key={channel}
            className="flex-col  items-center"
            title="E-mail"
            aria-label="E-mail"
          >
            <Mail className="size-5" aria-hidden />
           
          </span>
        ),
      )}
    </span>
  );
}
