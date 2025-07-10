import React, { useState, useEffect } from 'react';

const News = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Örnek kampanyalar - gerçek projede API'den çekilecektir
  const sampleCampaigns = [
    {
      id: 1,
      title: "Otobüs & Metro Kombine Bilette %20 İndirim",
      content: "Aynı gün içinde otobüs ve metro kullanımlarında, ikinci biniş için %20 indirim fırsatını kaçırmayın! BinCard ile tüm hatlar geçerlidir.",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
      validUntil: "2025-08-31",
      category: "Ulaşım",
      discount: "20%",
      code: "KOMBINE20"
    },
    {
      id: 2,
      title: "Öğrenci Abonmanlarda Yaz İndirimi",
      content: "Tüm öğrenci abonman ücretlerinde Temmuz ve Ağustos ayları boyunca %15 indirim. Yaz okulu öğrencileri için kaçırılmayacak fırsat!",
      image: "https://images.unsplash.com/photo-1583118443607-9a8f2a0487e3?q=80&w=2070&auto=format&fit=crop",
      validUntil: "2025-08-31",
      category: "Öğrenci",
      discount: "15%",
      code: "YAZ2025"
    },
    {
      id: 3,
      title: "Hafta Sonu Aile Paketi",
      content: "Cumartesi ve Pazar günleri, aile kartı ile yapılan toplu taşıma seyahatlerinde, 4 kişiye kadar olan yolculuklarda maksimum ücret 30₺ olarak uygulanacaktır.",
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop",
      validUntil: "2025-12-31",
      category: "Aile",
      discount: "Sabit Fiyat",
      code: "AILE2025"
    },
    {
      id: 4,
      title: "Sabah Kuşu Avantajı",
      content: "Sabah 06:00-07:30 arası yapılan yolculuklarda %25 indirim. Erken kalkanlar için özel fırsat, yalnızca BinCard kullananlara özel.",
      image: "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?q=80&w=1944&auto=format&fit=crop",
      validUntil: "2025-09-30",
      category: "İndirim",
      discount: "25%",
      code: "SABAH25"
    },
    {
      id: 5,
      title: "Sadakat Programı Avantajı",
      content: "BinCard uygulaması ile aylık en az 40 biniş yapan kullanıcılara, bir sonraki ay için 10 ücretsiz biniş hakkı.",
      image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2070&auto=format&fit=crop",
      validUntil: "Sürekli",
      category: "Sadakat",
      discount: "10 Ücretsiz Biniş",
      code: "SADAKAT40"
    },
    {
      id: 6,
      title: "Mobil Ödeme Fırsatı",
      content: "BinCard mobil uygulaması üzerinden yapılan bakiye yüklemelerinde %5 bonus bakiye. Minimum 100₺ yükleme için geçerlidir.",
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop",
      validUntil: "2025-10-15",
      category: "Mobil",
      discount: "5% Bonus",
      code: "MOBILBONUS"
    }
  ];

  useEffect(() => {
    // Gerçek bir projede burası API çağrısı yapacaktır
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        // Burada API çağrısı simüle ediliyor
        setTimeout(() => {
          setCampaigns(sampleCampaigns);
          // Kategorileri kampanyalardan dinamik olarak çıkaralım
          const uniqueCategories = [...new Set(sampleCampaigns.map(item => item.category))];
          setCategories(uniqueCategories);
          setLoading(false);
        }, 600);
      } catch (err) {
        setError('Kampanyalar yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Filtreli kampanyaları getir
  const filteredCampaigns = activeCategory === 'all' 
    ? campaigns 
    : campaigns.filter(campaign => campaign.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden h-72">
              <div className="h-40 bg-blue-100"></div>
              <div className="p-4">
                <div className="h-5 bg-blue-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-red-700 max-w-md">
          <h3 className="text-lg font-bold mb-2">Hata Oluştu</h3>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full"
            onClick={() => window.location.reload()}
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 min-h-[calc(100vh-56px)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">Güncel Kampanyalar</h1>
          <p className="text-gray-600 mb-6">
            BinCard'ınızla yararlanabileceğiniz özel indirim ve fırsatları keşfedin. Tüm kampanyalarımızı inceleyerek size en uygun fırsatı yakalayın.
          </p>

          {/* Kategori filtreleri */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Tümü
            </button>
            
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeCategory === category 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={campaign.image} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-red-500 text-white py-1 px-3 rounded-bl-lg font-bold">
                  {campaign.discount}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-3">
                  <span className="text-sm font-medium">
                    Son geçerlilik: {campaign.validUntil}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-gray-800 line-clamp-2">{campaign.title}</h2>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.content}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {campaign.category}
                  </span>
                  
                  <button className="text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium">
                    Kampanyayı Gör
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredCampaigns.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Bu kategoride kampanya bulunamadı</h3>
            <p className="text-gray-600 mb-4">Farklı bir kategori seçebilir veya daha sonra tekrar kontrol edebilirsiniz.</p>
            <button 
              onClick={() => setActiveCategory('all')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tüm Kampanyaları Göster
            </button>
          </div>
        )}

        {/* Promo Footer */}
        <div className="mt-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">BinCard Mobil Uygulama İndirin</h3>
              <p className="opacity-90">Kampanyalardan anında haberdar olmak ve özel fırsatları kaçırmamak için mobil uygulamayı indirin.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
                App Store
              </button>
              <button className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-50">
                Google Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
