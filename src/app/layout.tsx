import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from 'antd';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import PDFProvider from '@/components/providers/PDFProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuMancer - AI-Powered Academic Paper Reading Assistant",
  description: "Sophisticated paper reading assistant with AI-powered analysis, summarization, and Q&A capabilities",
  keywords: "academic papers, AI assistant, research, PDF reader, paper analysis",
  authors: [{ name: "DocuMancer Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const antdTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#fafafa',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(24, 144, 255, 0.1)',
      itemHoverBg: 'rgba(0, 0, 0, 0.04)',
    },
    Button: {
      primaryShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
    },
    Card: {
      boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ConfigProvider theme={antdTheme}>
            <PDFProvider>
              {children}
            </PDFProvider>
          </ConfigProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
