import { ImageResponse } from "next/og";
import { getPublicSettings } from "@/lib/settings/public";
export const dynamic = "force-dynamic";
export async function GET() {
  const { data } = await getPublicSettings();
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", background: "#090e17", color: "#edf2f7", padding: 80, borderLeft: "12px solid #79e3de", fontFamily: "sans-serif" }}><div style={{ color: "#79e3de", fontSize: 30, marginBottom: 40 }}>{data.name}</div><div style={{ fontSize: 58, lineHeight: 1.15 }}>{data.headline.slice(0, 180)}</div><div style={{ color: "#a5b2c3", fontSize: 24, marginTop: 40 }}>Frontend Development / IoT / Robotics</div></div>, { width: 1200, height: 630, headers: { "Cache-Control": "no-store" } });
}
