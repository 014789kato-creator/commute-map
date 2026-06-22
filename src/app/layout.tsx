import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Script from "next/script";
import { GA_MEASUREMENT_ID }
  from "@/analytics";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "通勤圏マップ｜通勤時間から住めるエリアを可視化",

  description:
    "勤務地や駅から設定した通勤時間で到達できる範囲を地図上に表示。住まい探しや引越し検討に活用できます。",

  verification: {
    google:
      "ZoVWK-OtEJg4YgaAKaTqyyAT-xu1asFLnQ_IxxTzfeg",
  },

  openGraph: {
    title: "通勤圏マップ｜通勤時間から住めるエリアを可視化",
  
    description:
      "勤務地や駅から設定した通勤時間で到達できる範囲を地図上に表示。",
  
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
  
    locale: "ja_JP",
    type: "website",
    siteName: "通勤圏マップ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>

<Script
  id="google-analytics"
  strategy="afterInteractive"
>
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag(
      'config',
      '${GA_MEASUREMENT_ID}'
    );
  `}
</Script>

{children}

</body>
    </html>
  );
}
