import React, { useState, useEffect } from 'react';
import NewsService from '../../services/news.service';

// Resim URL'sini düzeltme fonksiyonu
const normalizeImageUrl = (imageUrl, newsId) => {
  console.log(`🔍 [Haber ${newsId}] Original imageUrl:`, imageUrl);
  
  // Eğer backend'den resim gelmemişse veya geçersizse null döndür (boş bırak)
  if (!imageUrl || imageUrl === '' || imageUrl === null || imageUrl === undefined) {
    console.log(`📷 [Haber ${newsId}] Resim yok, boş bırakılıyor`);
    return null;
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
  
  // Geçersiz URL'leri filtrele (test URL'leri gibi) - via.placeholder.com'u test için izin ver
  if (finalUrl.includes('example.com')) {
    console.log(`🚫 [Haber ${newsId}] Geçersiz URL algılandı, resim gösterilmeyecek:`, finalUrl);
    return null;
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
        
        console.log('✅ Backend\'den haberler alındı, online mode aktivated');
        setIsOnline(true);
        
        // Backend'den gelen raw veriyi logla
        console.log('📊 Backend\'den gelen haber verisi:', newsData);
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
            image: normalizeImageUrl(news.image || news.imageUrl, news.id), // Backend'den 'image' field'ı (NewsDTO'ya göre)
            thumbnail: news.thumbnail,
            validUntil: news.endDate ? new Date(news.endDate).toLocaleDateString('tr-TR') : 'Sürekli',
            category: news.type || 'Genel', // Backend'den 'type' alanı geliyor
            discount: news.priority === 'KRITIK' ? 'KRİTİK' : 
                     news.priority === 'COK_YUKSEK' ? 'ÇOK YÜKSEK' :
                     news.priority === 'YUKSEK' ? 'YÜKSEK' :
                     news.priority === 'NORMAL' ? 'NORMAL' :
                     news.priority === 'DUSUK' ? 'DÜŞÜK' :
                     news.priority === 'COK_DUSUK' ? 'ÇOK DÜŞÜK' : 'Özel Fırsat',
            code: news.promoCode || `HABER${news.id}`,
            isActive: news.active !== undefined ? news.active : true,
            likeCount: news.likeCount || 0,
            isLikedByUser: news.likedByUser || false, // Backend'den gelen beğeni durumu
            viewCount: news.viewCount || 0,
            priority: news.priority,
            type: news.type,
            startDate: news.startDate,
            endDate: news.endDate,
            createdAt: news.createdAt
          };
        });
        
        setCampaigns(formattedNews);
        
        // Backend'den gelen beğeni durumlarını set et
        const userLikedNews = formattedNews
          .filter(news => news.isLikedByUser) // Backend'den likedByUser field'ı gelirse
          .map(news => news.id);
        
        if (userLikedNews.length > 0) {
          setLikedNews(new Set(userLikedNews));
          console.log('👍 Kullanıcının beğendiği haberler:', userLikedNews);
        }
        
        // Kategorileri dinamik olarak çıkar (type alanından)
        const uniqueCategories = [...new Set(formattedNews.map(item => item.category))];
        setCategories(uniqueCategories);
        
        console.log('✅ Haberler başarıyla yüklendi:', formattedNews);
        setIsOnline(true); // Backend bağlantısı başarılı
        
      } catch (err) {
        console.error('❌ Haberler yüklenirken hata:', err);
        
        // Test verisi ile devam et (offline mode)
        console.log('🔄 Backend bağlantısı yok, test verileri kullanılıyor...');
        setIsOnline(false);
        
        const testNews = [
          {
            id: 1,
            title: 'BinCard Yeni Özellikler',
            content: 'BinCard uygulamasına yeni özellikler eklendi. Mobil ödeme sistemi artık daha hızlı ve güvenli.',
            imageUrl: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=BinCard+Ozellikler',
            endDate: null,
            type: 'GENEL',
            priority: 'NORMAL',
            likeCount: 15,
            viewCount: 234,
            active: true,
            likedByUser: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Özel İndirim Kampanyası',
            content: '%20 indirim fırsatı! Bu ay boyunca tüm BinCard yüklemelerinde geçerli.',
            imageUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Indirim+Kampanyasi',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'KAMPANYA',
            priority: 'YUKSEK',
            likeCount: 42,
            viewCount: 567,
            active: true,
            likedByUser: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            title: 'Sistem Bakım Duyurusu',
            content: 'Bu gece 02:00 - 04:00 arası sistem bakımı yapılacaktır. Bu sürede hizmet kesintisi yaşanabilir.',
            imageUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Sistem+Bakimi',
            endDate: null,
            type: 'DUYURU',
            priority: 'KRITIK',
            likeCount: 8,
            viewCount: 156,
            active: true,
            likedByUser: true,
            createdAt: new Date().toISOString()
          }
        ];
        
        // Test verilerini format et
        const formattedTestNews = testNews.map(news => {
          return {
            id: news.id,
            title: news.title,
            content: news.content,
            image: normalizeImageUrl(news.image || news.imageUrl, news.id), // Backend'den 'image' field'ı (NewsDTO'ya göre)
            thumbnail: news.thumbnail,
            validUntil: news.endDate ? new Date(news.endDate).toLocaleDateString('tr-TR') : 'Sürekli',
            category: news.type || 'Genel',
            discount: news.priority === 'KRITIK' ? 'KRİTİK' : 
                     news.priority === 'COK_YUKSEK' ? 'ÇOK YÜKSEK' :
                     news.priority === 'YUKSEK' ? 'YÜKSEK' :
                     news.priority === 'NORMAL' ? 'NORMAL' :
                     news.priority === 'DUSUK' ? 'DÜŞÜK' :
                     news.priority === 'COK_DUSUK' ? 'ÇOK DÜŞÜK' : 'Özel Fırsat',
            code: news.promoCode || `HABER${news.id}`,
            isActive: news.active !== undefined ? news.active : true,
            likeCount: news.likeCount || 0,
            isLikedByUser: news.likedByUser || false,
            viewCount: news.viewCount || 0,
            viewedByUser: news.viewedByUser || false,
            priority: news.priority,
            type: news.type,
            startDate: news.startDate,
            endDate: news.endDate,
            createdAt: news.createdAt
          };
        });
        
        setCampaigns(formattedTestNews);
        
        // Test verilerinden beğeni durumlarını set et
        const userLikedNews = formattedTestNews
          .filter(news => news.isLikedByUser)
          .map(news => news.id);
        
        if (userLikedNews.length > 0) {
          setLikedNews(new Set(userLikedNews));
          console.log('👍 Test verisinde beğenilen haberler:', userLikedNews);
        }
        
        // Kategorileri test verisinden çıkar
        const uniqueCategories = [...new Set(formattedTestNews.map(item => item.category))];
        setCategories(uniqueCategories);
        
        // Hata mesajını daha bilgilendirici hale getir
        setError('Backend bağlantısı kurulamadı. Test verileri gösteriliyor.');
        
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Haber beğenme fonksiyonu
  const handleLikeNews = async (newsId) => {
    // Backend bağlantısı yoksa işlem yapma
    if (!isOnline) {
      setError('Backend bağlantısı bulunamadı. Beğeni işlemi yapılamıyor.');
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
      
      // Haber listesindeki beğeni sayısını artır
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

  // Filtreli haberleri getir
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h1 className="text-2xl font-bold text-blue-800 mb-2 md:mb-0">Güncel Haberler</h1>
            
            {/* Beğendiğim Haberler Linki */}
            <button 
              onClick={() => {
                // Dashboard içindeki liked-news sekmesine geç
                const currentUrl = window.location.href;
                if (currentUrl.includes('/news')) {
                  window.location.href = window.location.href.replace('/news', '/liked-news');
                } else {
                  window.location.href = '/liked-news';
                }
              }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="mr-2">❤️</span>
              <span className="font-medium">Beğendiğim Haberler</span>
              <span className="ml-2 bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs">
                {likedNews.size}
              </span>
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            BinCard'ınızla ilgili haberler ve duyuruları keşfedin. Tüm haberlerimizi inceleyerek güncel gelişmelerden haberdar olun.
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
              {/* Resim alanı - sadece geçerli resim varsa göster */}
              {normalizeImageUrl(campaign.imageUrl, campaign.id) && (
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={normalizeImageUrl(campaign.imageUrl, campaign.id)} 
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      console.log(`✅ [Haber ${campaign.id}] Resim başarıyla yüklendi: ${campaign.title}`);
                    }}
                    onError={(e) => {
                      console.log(`❌ [Haber ${campaign.id}] Resim yüklenemedi: ${e.target.src}`);
                      e.target.style.display = 'none';
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
              )}
              
              <div className="p-4">
                {/* Resim yoksa, discount badge'i ve tarih bilgisini üst kısma ekle */}
                {!campaign.image && (
                  <div className="flex justify-between items-center mb-3">
                    <div className="bg-red-500 text-white py-1 px-3 rounded-lg font-bold text-sm">
                      {campaign.discount}
                    </div>
                    <span className="text-sm text-gray-500">
                      Son geçerlilik: {campaign.validUntil}
                    </span>
                  </div>
                )}
                
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
                    
                    {/* Haber Detay Butonu */}
                    <button className="text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm font-medium">
                      Haberi Gör
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {activeCategory === 'all' ? 'Henüz haber bulunmuyor' : 'Bu kategoride haber bulunamadı'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isOnline 
                ? (activeCategory === 'all' 
                   ? 'Backend\'den henüz haber gelmedi. Lütfen daha sonra tekrar kontrol edin.' 
                   : 'Farklı bir kategori seçebilir veya daha sonra tekrar kontrol edebilirsiniz.')
                : 'Backend bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.'
              }
            </p>
            {activeCategory !== 'all' && (
              <button 
                onClick={() => setActiveCategory('all')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tüm Haberleri Göster
              </button>
            )}
          </div>
        )}

        {/* Promo Footer */}
        <div className="mt-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl shadow-md p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">BinCard Mobil Uygulama İndirin</h3>
              <p className="opacity-90">Haberlerden anında haberdar olmak ve özel duyuruları kaçırmamak için mobil uygulamayı indirin.</p>
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
