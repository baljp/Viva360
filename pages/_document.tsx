
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="application-name" content="Viva360" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f4f7f5" />
        
        {/* Tailwind CDN (Mantendo a pedido, embora npm seja recomendado para Next.js) */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: { 50: '#f4f7f5', 100: '#e3ebe7', 200: '#c5dcd3', 300: '#9dbfb2', 400: '#759f90', 500: '#558273', 600: '#41665a', 700: '#365249', 800: '#2d423c', 900: '#263732' },
                    nature: { 50: '#fafbf9', 100: '#f2f4f1', 200: '#e4e8e1', 300: '#d1d8cd', 400: '#aab5a4', 500: '#86947e', 600: '#687561', 700: '#545f4e', 800: '#444c40', 900: '#1a211d' }
                  },
                  fontFamily: { sans: ['Inter', 'sans-serif'], serif: ['Playfair Display', 'serif'] },
                  animation: { 'fade-in': 'fadeIn 0.8s ease-out forwards', 'slide-up': 'slideUp 0.8s ease-out forwards' },
                  keyframes: {
                    fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
                    slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } }
                  }
                }
              }
            }
          `
        }} />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
        
        <style>{`
          :root { --sab: env(safe-area-inset-bottom); --sat: env(safe-area-inset-top); }
          body { font-family: 'Inter', sans-serif; background-color: #f4f7f5; color: #1a211d; overscroll-behavior-y: contain; overflow: hidden; user-select: none; -webkit-tap-highlight-color: transparent; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          .animate-float { animation: float 6s ease-in-out infinite; }
          @keyframes progress { from { width: 0%; } to { width: 100%; } }
          @media (min-width: 1024px) {
            .max-w-app { max-width: 410px; margin: 0 auto; height: 90vh; margin-top: 5vh; border-radius: 3.5rem; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(26, 33, 29, 0.4); border: 12px solid #2d423c; position: relative; }
            body { background-color: #111a16; display: flex; align-items: center; justify-content: center; height: 100vh; }
          }
        `}</style>
      </Head>
      <body>
        <div id="root" className="max-w-app w-full bg-primary-50 h-full overflow-hidden">
          <Main />
        </div>
        <NextScript />
      </body>
    </Html>
  )
}
