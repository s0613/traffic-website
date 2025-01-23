import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

import './styles/globals.css';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-800">
        <Navbar />
        <div className="w-full">{children}</div> {/* 전체 너비로 설정 */}
        <Footer />
      </body>
    </html>
  );
}