import React, { useState, useEffect } from 'react';
import NewsService from '../../services/news.service';
import NewsImage from '../ui/NewsImage.jsx';

// Resim URL'sini düzeltme fonksiyonu
const normalizeImageUrl = (imageUrl, newsId) => {
  console.log(`🔍 [Haber ${newsId}] Original imageUrl:`, imageUrl);
  
  // Eğer backend'den resim gelmemişse veya geçersizse placeholder kullan
  if (!imageUrl || imageUrl === '' || imageUrl === null || imageUrl === undefined) {
    const placeholderUrl = `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000) + 1500000000000}?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3`;
    console.log(`📷 [Haber ${newsId}] Placeholder kullanılıyor:`, placeholderUrl);
    return placeholderUrl;
  }
  
  let finalUrl = imageUrl;
  
  if (imageUrl.startsWith('/')) {
    // Relative path ise backend base URL'i ekle
    finalUrl = `http://localhost:8080${imageUrl}`;
    console.log(`🔗 [Haber ${newsId}] Relative path düzeltildi:`, finalUrl);
  } else if (!imageUrl.startsWith('http')) {
    // Protocol eksikse https ekle
    finalUrl = `https://${imageUrl}`;
    console.log(`🔒 [Haber ${newsId}] Protocol eklendi:`, finalUrl);
  } else {
    console.log(`✅ [Haber ${newsId}] URL geçerli:`, finalUrl);
  }
  
  return finalUrl;
};

const News = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [likedNews, setLikedNews] = useState(new Set()); // Beğenilen haberleri takip et
  const [likingNews, setLikingNews] = useState(new Set()); // Beğenme işlemi devam eden haberler
  const [isOnline, setIsOnline] = useState(true); // Backend bağlantı durumu

  useEffect(() => {
    // Backend'den haberleri getir
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Aktif haberleri getir
        const newsData = await NewsService.getActiveNews();
        
        // Backend'den gelen raw veriyi logla
        console.log('📊 Backend\den gelen haber verisi:', newsData);
        newsData.forEach((news, index) => {
          console.log(`📰 Haber ${index + 1}:`, {
            id: news.id,
            title: news.title,
            imageUrl: news.imageUrl,
            hasImage: !!news.imageUrl,
            imageType: typeof news.imageUrl
          });
        });
        
        // Backend'den gelen veriyi frontend formatına dönüştür
        const formattedNews = newsData.map(news => {
          return {
            id: news.id,
            title: news.title,
            content: news.content,
            image: normalizeImageUrl(news.imageUrl, news.id),
            validUntil: news.endDate ? new Date(news.endDate).toLocaleDateString('tr-TR') : 'Sürekli',
            category: news.category || 'Genel',
            discount: news.discount || 'Özel Fırsat',
            code: news.promoCode || `HABER${news.id}`,
            isActive: news.active,
            likeCount: news.likeCount || 0,
            startDate: news.startDate,
            endDate: news.endDate,
            createdAt: news.createdAt
          };
        });
        
        setCampaigns(formattedNews);
        
        // Kategorileri dinamik olarak çıkar
        const uniqueCategories = [...new Set(formattedNews.map(item => item.category))];
        setCategories(uniqueCategories);
        
        console.log('✅ Haberler başarıyla yüklendi:', formattedNews);
        setIsOnline(true); // Backend bağlantısı başarılı
        
      } catch (err) {
        console.error('❌ Haberler yüklenirken hata:', err);
        
        // Kritik olmayan hata - örnek veriler göster
        console.log('🔄 Backend bağlantısı başarısız, örnek veriler yükleniyor...');
        setIsOnline(false); // Backend'e bağlanamadı
        loadSampleData();
        
        // Error state'ini set etme, böylece kullanıcı arayüzünde hata gösterilmez
        // setError(err.message || 'Haberler yüklenirken bir hata oluştu');
        
      } finally {
        setLoading(false);
      }
    };

    // Örnek veri yükleme fonksiyonu (backend'e bağlanamadığında)
    const loadSampleData = () => {
      const sampleCampaigns = [
        {
          id: 1,
          title: "Otobüs & Metro Kombine Bilette %20 İndirim",
          content: "Aynı gün içinde otobüs ve metro kullanımlarında, ikinci biniş için %20 indirim fırsatını kaçırmayın! BinCard ile tüm hatlar geçerlidir.",
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
          validUntil: "2025-08-31",
          category: "Ulaşım",
          discount: "20%",
          code: "KOMBINE20",
          isActive: true,
          likeCount: 0
        },
        {
          id: 2,
          title: "Öğrenci Abonmanlarda Yaz İndirimi",
          content: "Tüm öğrenci abonman ücretlerinde Temmuz ve Ağustos ayları boyunca %15 indirim. Yaz okulu öğrencileri için kaçırılmayacak fırsat!",
          image: "https://images.unsplash.com/photo-1583118443607-9a8f2a0487e3?q=80&w=2070&auto=format&fit=crop",
          validUntil: "2025-08-31",
          category: "Öğrenci",
          discount: "15%",
          code: "YAZ2025",
          isActive: true,
          likeCount: 0
        },
        {
          id: 3,
          title: "Hafta Sonu Aile Paketi",
          content: "Cumartesi ve Pazar günleri, aile kartı ile yapılan toplu taşıma seyahatlerinde, 4 kişiye kadar olan yolculuklarda maksimum ücret 30₺ olarak uygulanacaktır.",
          image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop",
          validUntil: "2025-12-31",
          category: "Aile",
          discount: "Sabit Fiyat",
          code: "AILE2025",
          isActive: true,
          likeCount: 0
        }
      ];
      
      setCampaigns(sampleCampaigns);
      const uniqueCategories = [...new Set(sampleCampaigns.map(item => item.category))];
      setCategories(uniqueCategories);
    };

    fetchNews();
  }, []);

  // Haber beğenme fonksiyonu
  const handleLikeNews = async (newsId) => {
    // Offline modda beğeni işlemi yapma
    if (!isOnline) {
      setError('Offline moddasınız. Beğeni işlemi için internet bağlantısı gerekli.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      // Çift tıklamayı önle
      if (likingNews.has(newsId)) {
        return;
      }

      setLikingNews(prev => new Set([...prev, newsId]));
      
      // Backend'e beğeni isteği gönder
      const response = await NewsService.likeNews(newsId);
      
      // Başarılı ise beğeni durumunu güncelle
      setLikedNews(prev => new Set([...prev, newsId]));
      
      // Kampanya listesindeki beğeni sayısını artır
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === newsId 
            ? { ...campaign, likeCount: (campaign.likeCount || 0) + 1 }
            : campaign
        )
      );

      console.log('✅ Haber başarıyla beğenildi:', response);
      
    } catch (error) {
      console.error('❌ Haber beğenme hatası:', error);
      setError(error.message);
      
      // Hata mesajını 3 saniye sonra temizle
      setTimeout(() => setError(null), 3000);
      
    } finally {
      // İşlem tamamlandı, loading state'ini kaldır
      setLikingNews(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    }
  };

  // Haber beğenisini kaldırma fonksiyonu (opsiyonel)
  const handleUnlikeNews = async (newsId) => {
    try {
      if (likingNews.has(newsId)) {
        return;
      }

      setLikingNews(prev => new Set([...prev, newsId]));
      
      await NewsService.unlikeNews(newsId);
      
      setLikedNews(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
      
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === newsId 
            ? { ...campaign, likeCount: Math.max((campaign.likeCount || 0) - 1, 0) }
            : campaign
        )
      );

    } catch (error) {
      console.error('❌ Haber beğeni kaldırma hatası:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
      
    } finally {
      setLikingNews(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    }
  };

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
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[80vh]">
            <div className="bg-red-50 p-8 rounded-lg border border-red-200 text-red-700 max-w-md text-center">
              <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold mb-2">Backend Bağlantı Hatası</h3>
              <p className="mb-4">{error}</p>
              <p className="text-sm text-red-600 mb-4">
                Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.
              </p>
              <button 
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 w-full"
                onClick={() => window.location.reload()}
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">Güncel Kampanyalar</h1>
          <p className="text-gray-600 mb-6">
            BinCard'ınızla yararlanabileceğiniz özel indirim ve fırsatları keşfedin. Tüm kampanyalarımızı inceleyerek size en uygun fırsatı yakalayın.
          </p>

          {/* Backend Bağlantı Durumu */}
          <div className={`mb-4 p-3 border rounded-lg ${isOnline ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
              <span className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-orange-800'}`}>
                {isOnline 
                  ? 'Backend\'e bağlı - Gerçek zamanlı veriler' 
                  : 'Offline mod - Örnek veriler gösteriliyor'
                }
              </span>
            </div>
          </div>

          {/* Kategori filtreleri */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === 'all' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              Tümü
            </button>
            
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === category 
                    ? 'bg-blue-600 text-white shadow-md' 
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
          {/* Error Message */}
          {error && (
            <div className="col-span-full mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1">
              <div className="h-48 overflow-hidden relative">
                <NewsImage
                  src={campaign.image} 
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log(`✅ Resim başarıyla yüklendi: ${campaign.title}`);
                  }}
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
                  
                  <div className="flex items-center gap-2">
                    {/* Beğeni Butonu */}
                    <button 
                      onClick={() => likedNews.has(campaign.id) ? handleUnlikeNews(campaign.id) : handleLikeNews(campaign.id)}
                      disabled={likingNews.has(campaign.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        likedNews.has(campaign.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                      } ${likingNews.has(campaign.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {likingNews.has(campaign.id) ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill={likedNews.has(campaign.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                      <span>{campaign.likeCount || 0}</span>
                    </button>
                    
                    {/* Kampanya Detay Butonu */}
                    <button className="text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium">
                      Kampanyayı Gör
                    </button>
                  </div>
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
