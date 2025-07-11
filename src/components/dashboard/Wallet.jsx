import React, { useState } from 'react';

const Wallet = () => {
  const [balance, setBalance] = useState(150.75);
  const [recentTransactions] = useState([
    { id: 1, type: 'Yükleme', amount: 50, date: '2025-01-10', status: 'completed' },
    { id: 2, type: 'Otobüs', amount: -3.5, date: '2025-01-10', status: 'completed' },
    { id: 3, type: 'Metro', amount: -5.2, date: '2025-01-09', status: 'completed' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💛 Cüzdanım</h1>
          <p className="text-gray-600">Bakiye yönetimi ve işlem geçmişi</p>
        </div>

        {/* Bakiye Kartı */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm mb-1">Mevcut Bakiye</p>
              <h2 className="text-4xl font-bold">₺{balance.toFixed(2)}</h2>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <span className="text-2xl">💳</span>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-all">
              💰 Bakiye Yükle
            </button>
            <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-all">
              📤 Para Gönder
            </button>
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-xl">💵</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Otomatik Yükleme</h3>
                <p className="text-gray-600 text-sm">Bakiye azaldığında otomatik yükle</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Hedef Bakiye</h3>
                <p className="text-gray-600 text-sm">Minimum bakiye limiti belirle</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Harcama Analizi</h3>
                <p className="text-gray-600 text-sm">Aylık harcama raporları</p>
              </div>
            </div>
          </div>
        </div>

        {/* Son İşlemler */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Son İşlemler</h3>
          <div className="space-y-3">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'Yükleme' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <span className="text-sm">
                      {transaction.type === 'Yükleme' ? '⬆️' : '⬇️'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{transaction.type}</p>
                    <p className="text-gray-600 text-sm">{transaction.date}</p>
                  </div>
                </div>
                <div className={`font-bold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}₺{Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-3 rounded-lg transition-colors">
            Tüm İşlemleri Görüntüle
          </button>
        </div>

        {/* Placeholder Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>🚧 Geliştirme Aşamasında:</strong> Bu sayfa henüz tamamlanmamış bir protiptir. 
            Yakında gerçek cüzdan işlevleri eklenecektir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
