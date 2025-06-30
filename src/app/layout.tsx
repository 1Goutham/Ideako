import { Toaster } from 'sonner';
import './globals.css';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '600', '700'] });

export const metadata = {
  title: 'Ideako',
  description: 'AI Creative Partner',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        {children}
        <Toaster theme="dark" position="bottom-center"/>
      </body>
    </html>
  );
}
