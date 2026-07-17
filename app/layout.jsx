import { headers } from "next/headers";
import "../src/styles.css";

const title = "地球编年史";
const description =
  "在可交互的手绘世界疆域地图与时间轴上穿越历史，对照同一时期全球不同政权的科技、经济、社会与信仰。";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : undefined;
  const image = origin ? `${origin}/og-atlas-v2.png` : undefined;

  return {
    title,
    description,
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
