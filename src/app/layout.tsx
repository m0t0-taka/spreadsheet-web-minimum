export const metadata = {
  title: 'Google Spreadsheet Web App',
  description: 'Minimum web app using Google Spreadsheet as database',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
