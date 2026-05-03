import './globals.css';
import PersistentActionBanner from '@/components/PersistentActionBanner';
import SettingsHydrator from '@/components/SettingsHydrator';

export const metadata = {
  title: 'SolveOS',
  description: 'AI for hard life decisions',
  icons: {
    icon: '/solveos-icon.svg',
    shortcut: '/solveos-icon.svg',
    apple: '/solveos-icon.svg'
  },
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
   <html lang="en">
      <body>
         <SettingsHydrator />
         <PersistentActionBanner />
         {children}
      </body>
   </html>
 )
}
