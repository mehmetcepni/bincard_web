import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Profilim from './Profilim.jsx';
import News from './News.jsx';
import TokenDebug from '../debug/TokenDebug.jsx';

  const menuItems = [
  { text: 'Ana Sayfa', icon: '🏠', path: 'dashboard', key: 'dashboard' },
  { text: 'Otobüs Seferleri', icon: '🚌', path: 'routes', key: 'routes' },
  { text: 'Kartlarım', icon: '💳', path: 'cards', key: 'cards' },
  { text: 'Geçmiş İşlemler', icon: '📜', path: 'history', key: 'history' },
  { text: 'Haberler', icon: '📰', path: 'news', key: 'news' },
  { text: 'Profilim', icon: '👤', path: 'profilim', key: 'profilim' },
  { text: 'Debug', icon: '🔧', path: 'debug', key: 'debug' },
  ];

const HEADER_HEIGHT = 56; // px
const SIDEBAR_WIDTH = 224; // 56 * 4 px

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // URL'ye göre aktif tab'ı belirle
  useEffect(() => {
    const path = location.pathname.replace('/', '');
    setActiveTab(path || 'dashboard');
  }, [location]);

  const handleNavigation = (item) => {
    setActiveTab(item.key);
    navigate(`/${item.path}`);
    setSidebarOpen(false);
  };

  // Hangi component'i render edeceğini belirle
  const renderContent = () => {
    switch (activeTab) {
      case 'profilim':
        return <Profilim />;
      case 'news':
        return <News />;
      case 'debug':
        return <TokenDebug />;
      case 'dashboard':
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-14 flex items-center px-4 bg-white border-b border-gray-100 z-40 shadow-sm">
        <button className="md:hidden mr-2 text-gray-500" onClick={() => setSidebarOpen(true)}>
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-base font-bold text-blue-700 tracking-tight">Dashboard</span>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-14 left-0 h-[calc(100vh-56px)] w-56 bg-white border-r border-gray-200 flex flex-col z-30 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-56'} md:translate-x-0`}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 md:hidden">
          <span className="text-lg font-bold text-blue-700 tracking-tight">BinCard</span>
          <button className="text-gray-500" onClick={() => setSidebarOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
                key={item.text}
                onClick={() => handleNavigation(item)}
              className={`flex items-center w-full px-4 py-2 transition rounded-lg mb-1 font-medium ${
                activeTab === item.key 
                  ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.text}
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="pt-14 md:pl-56 min-h-screen">
        <ToastContainer />
        {renderContent()}
      </div>
    </div>
  );
};

// Ana dashboard içeriği için ayrı component
const DashboardHome = () => {
  const cards = [
    {
      title: 'Bakiye',
      value: '₺150,00',
    icon: '💰',
      action: 'Bakiye Yükle',
      color: 'from-blue-600 to-blue-400',
    },
    {
      title: 'Aktif Biletler',
      value: '2 Bilet',
    icon: '🎫',
      action: 'Biletleri Görüntüle',
      color: 'from-green-400 to-blue-700',
    },
    {
      title: 'Puanlar',
      value: '120',
    icon: '⭐',
      action: 'Puanları Kullan',
      color: 'from-yellow-400 to-yellow-200',
    },
  ];

  const recentTransactions = [
    { id: 1, type: 'Bilet Alımı', amount: '-₺3,50', date: '2024-02-20', route: '500T Tuzla-Kadıköy' },
    { id: 2, type: 'Bakiye Yükleme', amount: '+₺50,00', date: '2024-02-19', route: '-' },
    { id: 3, type: 'Bilet Alımı', amount: '-₺3,50', date: '2024-02-19', route: '500T Kadıköy-Tuzla' },
  ];
  
  return (
    <main className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 min-h-[calc(100vh-56px)]">
      {/* Welcome */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-xl shadow-md p-4 md:p-6 mb-4">
        <h2 className="text-xl md:text-2xl font-bold mb-1">Hoş Geldin, Kullanıcı!</h2>
        <p className="opacity-90 text-sm md:text-base">Akıllı bilet ve kart yönetim paneline hoş geldin. Buradan bakiyeni, biletlerini ve geçmiş işlemlerini kolayca yönetebilirsin.</p>
      </section>
      {/* Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {cards.map((card) => (
          <div key={card.title} className={`rounded-xl shadow-md p-4 text-white bg-gradient-to-br ${card.color} flex flex-col items-start justify-between min-h-[120px]`}>
            <div className="flex items-center mb-1">
              <span className="text-2xl mr-2">{card.icon}</span>
              <span className="text-base font-semibold tracking-tight">{card.title}</span>
            </div>
            <div className="text-xl font-bold mb-1">{card.value}</div>
            <button className="mt-auto px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition">{card.action}</button>
          </div>
        ))}
      </section>
      {/* Recent Transactions */}
      <section className="bg-white rounded-xl shadow-md p-4 w-full">
        <h3 className="text-lg font-bold text-blue-700 mb-3">Son İşlemler</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="text-gray-600 border-b">
                <th className="py-2 px-2 text-left">Tarih</th>
                <th className="py-2 px-2 text-left">İşlem</th>
                <th className="py-2 px-2 text-left">Tutar</th>
                <th className="py-2 px-2 text-left">Güzergah</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="py-2 px-2 whitespace-nowrap">{tx.date}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{tx.type}</td>
                  <td className={`py-2 px-2 font-semibold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{tx.amount}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{tx.route}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
