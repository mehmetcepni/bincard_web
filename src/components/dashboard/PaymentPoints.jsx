import React, { useState } from 'react';

const PaymentPoints = () => {
  const [selectedCity, setSelectedCity] = useState('ankara');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapView, setMapView] = useState(false);

  const cities = [
    { id: 'ankara', name: 'Ankara', count: 247 },
    { id: 'istanbul', name: 'İstanbul', count: 523 },
    { id: 'izmir', name: 'İzmir', count: 186 },
    { id: 'bursa', name: 'Bursa', count: 94 }
  ];

  const paymentPoints = [
    {
      id: 1,
      name: 'Kızılay Merkez Noktası',
      address: 'Kızılay Meydanı, Çankaya/Ankara',
      type: 'Ana Terminal',
      distance: '0.8 km',
      openHours: '06:00 - 22:00',
      services: ['Bakiye Yükleme', 'Kart Satışı', 'Müşteri Hizmetleri'],
      rating: 4.5
    },
    {
      id: 2,
      name: 'Ulus İstasyonu',
      address: 'Ulus Meydanı, Altındağ/Ankara',
      type: 'Metro İstasyonu',
      distance: '2.1 km',
      openHours: '05:30 - 00:30',
      services: ['Bakiye Yükleme', 'Kart Satışı'],
      rating: 4.2
    },
    {
      id: 3,
      name: 'Bahçelievler Market',
      address: 'Bahçelievler Mah. 7. Cad. No:15',
      type: 'Market/Büfe',
      distance: '1.5 km',
      openHours: '07:00 - 23:00',
      services: ['Bakiye Yükleme'],
      rating: 4.0
    },
    {
      id: 4,
      name: 'Tunalı Hilmi Büfe',
      address: 'Tunalı Hilmi Cad. No:42, Çankaya',
      type: 'Market/Büfe',
      distance: '0.5 km',
      openHours: '24 Saat',
      services: ['Bakiye Yükleme', 'Kart Satışı'],
      rating: 3.8
    }
  ];

  const serviceTypes = [
    { id: 'all', name: 'Tümü', icon: '🏪' },
    { id: 'terminal', name: 'Ana Terminal', icon: '🚌' },
    { id: 'metro', name: 'Metro İstasyonu', icon: '🚇' },
    { id: 'market', name: 'Market/Büfe', icon: '🛒' }
  ];

  const filteredPoints = paymentPoints.filter(point =>
    point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏪 Ödeme Noktaları</h1>
          <p className="text-gray-600">BinCard bakiye yükleme ve kart satış noktalarını bulun</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* City Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.count} nokta)
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
              <input
                type="text"
                placeholder="Nokta adı veya adres ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Görünüm</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMapView(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    !mapView ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📋 Liste
                </button>
                <button
                  onClick={() => setMapView(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    mapView ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🗺️ Harita
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Type Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {serviceTypes.map(type => (
            <button
              key={type.id}
              className="flex items-center space-x-2 bg-white hover:bg-blue-50 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              <span>{type.icon}</span>
              <span className="text-sm font-medium text-gray-700">{type.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {mapView ? (
          /* Map View Placeholder */
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mb-4">
              <span className="text-6xl">🗺️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Harita Görünümü</h3>
            <p className="text-gray-600 mb-4">
              Ödeme noktalarının harita üzerinde konumlarını gösterir
            </p>
            <div className="bg-gray-100 rounded-lg p-8 text-gray-500">
              Harita entegrasyonu yakında eklenecek...
            </div>
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPoints.map(point => (
              <div key={point.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{point.name}</h3>
                    <p className="text-gray-600 text-sm">{point.address}</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded">
                    <span className="text-yellow-600">⭐</span>
                    <span className="text-yellow-800 text-sm font-medium">{point.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tür:</span>
                    <span className="ml-2 font-medium">{point.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mesafe:</span>
                    <span className="ml-2 font-medium text-blue-600">{point.distance}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Açık:</span>
                    <span className="ml-2 font-medium text-green-600">{point.openHours}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Hizmetler:</p>
                  <div className="flex flex-wrap gap-2">
                    {point.services.map((service, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    🧭 Yol Tarifi
                  </button>
                  <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
                    📞 Ara
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-blue-600">247</div>
            <div className="text-gray-600 text-sm">Toplam Nokta</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-green-600">98%</div>
            <div className="text-gray-600 text-sm">Aktif Oran</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-gray-600 text-sm">Açık Nokta</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-md">
            <div className="text-2xl font-bold text-orange-600">4.2</div>
            <div className="text-gray-600 text-sm">Ort. Puan</div>
          </div>
        </div>

        {/* Placeholder Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>🚧 Geliştirme Aşamasında:</strong> Bu sayfa henüz tamamlanmamış bir protiptir. 
            Yakında gerçek ödeme noktası verileri ve harita entegrasyonu eklenecektir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPoints;
