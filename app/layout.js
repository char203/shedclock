import "./globals.css";

export const metadata = {
  title: "ShedClock — NYC Sidewalk Shed Compliance",
  description:
    "Track 90-day shed permit renewals and Local Law 49 fine exposure for NYC general contractors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
