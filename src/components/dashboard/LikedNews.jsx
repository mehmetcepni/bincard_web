import React, { useState, useEffect } from 'react';
import NewsService from '../../services/news.service';

// Resim URL'sini düzeltme fonksiyonu
const normalizeImageUrl = (imageUrl, newsId) => {
  console.log(`🔍 [Beğenilen Haber ${newsId}] Original imageUrl:`, imageUrl);
  
  if (!imageUrl || imageUrl === '' || imageUrl === null || imageUrl === undefined) {
    console.log(`📷 [Beğenilen Haber ${newsId}] Resim yok, boş bırakılıyor`);
    return null;
  }
  
  let finalUrl = imageUrl;
  
  if (imageUrl.startsWith('/')) {
    finalUrl = `http://localhost:8080${imageUrl}`;
    console.log(`🔗 [Beğenilen Haber ${newsId}] Relative path düzeltildi:`, finalUrl);
  } else if (!imageUrl.startsWith('http')) {
    finalUrl = `https://${imageUrl}`;
    console.log(`🔒 [Beğenilen Haber ${newsId}] Protocol eklendi:`, finalUrl);
  } else {
    console.log(`✅ [Beğenilen Haber ${newsId}] URL geçerli:`, finalUrl);
  }
  
  // Geçersiz URL'leri filtrele - via.placeholder.com'u test için izin ver
  if (finalUrl.includes('example.com')) {
    console.log(`🚫 [Beğenilen Haber ${newsId}] Geçersiz URL algılandı, resim gösterilmeyecek:`, finalUrl);
    return null;
  }
  
  return finalUrl;
};

const LikedNews = () => {
  const [likedNews, setLikedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingNews, setRemovingNews] = useState(new Set()); // Unlike işlemi devam eden haberler

  useEffect(() => {
    fetchLikedNews();
  }, []);

  const fetchLikedNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📖 Backend\'den beğenilen haberler getiriliyor...');
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 Auth token check:', !!localStorage.getItem('accessToken'));
      
      // Test verisi ekle (Backend bağlantısı sorunu varsa)
      let newsData = [];
      
      try {
        // Backend'den beğenilen haberleri getir (yeni endpoint)
        newsData = await NewsService.getLikedNews();
        console.log('📊 Backend\'den gelen beğenilen haber verisi:', newsData);
      } catch (backendError) {
        console.warn('❌ Backend hatası, test verisi kullanılıyor:', backendError);
        
        // Test verisi
        newsData = [
          {
            id: 1,
            title: 'Test Beğenilen Haber 1',
            content: 'Bu bir test haberidir. Backend bağlantısı kurulana kadar gösterilmektedir.',
            imageUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Begendim+Test+1',
            endDate: null,
            type: 'GENEL',
            priority: 'NORMAL',
            likeCount: 5,
            viewCount: 100,
            createdAt: new Date().toISOString(),
            likedAt: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Test Beğenilen Haber 2',
            content: 'İkinci test haberi. Beğeni kaldırma butonunu test edebilirsiniz.',
            imageUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Begendim+Test+2',
            endDate: null,
            type: 'KAMPANYA',
            priority: 'YUKSEK',
            likeCount: 12,
            viewCount: 250,
            createdAt: new Date().toISOString(),
            likedAt: new Date().toISOString()
          }
        ];
        
        // Backend hatasını error state'e kaydet
        setError('Backend bağlantısı kurulamadı. Test verileri gösteriliyor.');
      }
      
      // Backend'den gelen veriyi frontend formatına dönüştür
      const formattedNews = newsData.map(news => {
        return {
          id: news.id,
          title: news.title,
          content: news.content,
          imageUrl: news.image, // Backend'den 'image' field'ı gelir (NewsDTO'ya göre)
          thumbnail: news.thumbnail, // Backend'den thumbnail
          validUntil: news.endDate ? new Date(news.endDate).toLocaleDateString('tr-TR') : 'Sürekli',
          category: news.type || 'Genel',
          priority: news.priority === 'KRITIK' ? 'KRİTİK' : 
                   news.priority === 'COK_YUKSEK' ? 'ÇOK YÜKSEK' :
                   news.priority === 'YUKSEK' ? 'YÜKSEK' :
                   news.priority === 'NORMAL' ? 'NORMAL' :
                   news.priority === 'DUSUK' ? 'DÜŞÜK' :
                   news.priority === 'COK_DUSUK' ? 'ÇOK DÜŞÜK' : 'Özel',
          likeCount: news.likeCount || 0,
          isLikedByUser: news.likedByUser !== undefined ? news.likedByUser : true, // Backend'den geliyor
          viewCount: news.viewCount || 0,
          createdAt: news.createdAt,
          likedAt: news.likedAt, // Beğenilme tarihi (eğer backend'den gelirse)
          viewedByUser: news.viewedByUser || false // Backend'den geliyor
        };
      });
      
      setLikedNews(formattedNews);
      console.log('✅ Beğenilen haberler başarıyla yüklendi:', formattedNews);
      
    } catch (error) {
      console.error('❌ Beğenilen haberler getirilemedi:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Hata mesajını daha detaylı hale getir
      let errorMessage = 'Beğenilen haberler yüklenirken bir hata oluştu';
      
      if (error.response?.status === 401) {
        errorMessage = 'Giriş yapmanız gerekiyor';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bu işlem için yetkiniz bulunmuyor';
      } else if (error.response?.status === 404) {
        errorMessage = 'Beğenilen haber bulunamadı';
      } else if (error.response?.status === 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Hata durumunda boş liste göster
      setLikedNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Haber beğenisini kaldırma fonksiyonu
  const handleRemoveLike = async (newsId) => {
    if (removingNews.has(newsId)) {
      return;
    }

    try {
      setRemovingNews(prev => new Set([...prev, newsId]));
      
      // Backend'e beğeni kaldırma isteği gönder
      await NewsService.unlikeNews(newsId);
      
      // Başarılı ise listeden kaldır (optimistic update)
      setLikedNews(prev => prev.filter(news => news.id !== newsId));
      
      console.log(`✅ Haber ${newsId} beğenilerden kaldırıldı`);
      
    } catch (error) {
      console.error(`❌ Haber ${newsId} beğeni kaldırma hatası:`, error);
      
      // Hata mesajını kullanıcı dostu hale getir
      let errorMessage = 'Beğeni kaldırılırken bir hata oluştu';
      
      if (error.response?.status === 401) {
        errorMessage = 'Giriş yapmanız gerekiyor';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bu işlem için yetkiniz bulunmuyor';
      } else if (error.response?.status === 404) {
        errorMessage = 'Haber bulunamadı';
      }
      
      setError(errorMessage);
      
      // 3 saniye sonra hata mesajını temizle
      setTimeout(() => setError(null), 3000);
      
    } finally {
      setRemovingNews(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-red-600 mb-2">❤️ Beğendiğim Haberler</h1>
            <p className="text-gray-600">Beğendiğiniz haberler yükleniyor...</p>
          </div>
          
          <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden h-72">
                <div className="h-40 bg-red-100"></div>
                <div className="p-4">
                  <div className="h-5 bg-red-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-md p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">❤️ Beğendiğim Haberler</h1>
              <p className="opacity-90">
                Beğendiğiniz {likedNews.length} haber burada görüntüleniyor. 
                {likedNews.length > 0 && ' İstediğiniz zaman beğeninizi kaldırabilirsiniz.'}
              </p>
            </div>
            
            {/* Tüm Haberlere Geri Dön Butonu */}
            <button 
              onClick={() => {
                const currentUrl = window.location.href;
                if (currentUrl.includes('/liked-news')) {
                  window.location.href = window.location.href.replace('/liked-news', '/news');
                } else {
                  window.location.href = '/news';
                }
              }}
              className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tüm Haberlere Dön
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Beğenilen Haberler */}
        {likedNews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedNews.map(news => (
              <div key={news.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 border-l-4 border-red-500">
                {/* Resim alanı */}
                {normalizeImageUrl(news.imageUrl, news.id) && (
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={normalizeImageUrl(news.imageUrl, news.id)} 
                      alt={news.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`❌ Resim yüklenemedi: ${e.target.src}`);
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-0 right-0 bg-red-500 text-white py-1 px-3 rounded-bl-lg font-bold">
                      {news.priority}
                    </div>
                    <div className="absolute top-0 left-0 bg-red-500 bg-opacity-90 text-white py-1 px-3 rounded-br-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  {/* Resim yoksa priority badge'i üste ekle */}
                  {!normalizeImageUrl(news.imageUrl, news.id) && (
                    <div className="flex justify-between items-center mb-3">
                      <div className="bg-red-500 text-white py-1 px-3 rounded-lg font-bold text-sm">
                        {news.priority}
                      </div>
                      <div className="bg-red-500 text-white py-1 px-3 rounded-lg">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-bold text-gray-800 line-clamp-2">{news.title}</h2>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{news.content}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-xs mb-1">
                        {news.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Geçerlilik: {news.validUntil}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Beğeni Sayısı */}
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs">
                        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{news.likeCount}</span>
                      </div>
                      
                      {/* Beğeniyi Kaldır Butonu */}
                      <button 
                        onClick={() => handleRemoveLike(news.id)}
                        disabled={removingNews.has(news.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 bg-red-500 text-white hover:bg-red-600 ${
                          removingNews.has(news.id) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Beğeniyi kaldır"
                      >
                        {removingNews.has(news.id) ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {removingNews.has(news.id) ? 'Kaldırılıyor...' : 'Beğeniyi Kaldır'}
                      </button>
                      
                      {/* Haber Detay Butonu */}
                      <button className="text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-1 rounded-lg text-xs font-medium">
                        Detay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Beğenilen haber yok */
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Henüz beğendiğiniz haber yok</h3>
            <p className="text-gray-600 mb-6">
              Haberler sayfasına giderek ilginizi çeken haberleri beğenebilirsiniz.
            </p>
            <button 
              onClick={() => {
                const currentUrl = window.location.href;
                if (currentUrl.includes('/liked-news')) {
                  window.location.href = window.location.href.replace('/liked-news', '/news');
                } else {
                  window.location.href = '/news';
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
            >
              Haberleri Keşfet
            </button>
          </div>
        )}

        {/* İstatistik Footer */}
        {likedNews.length > 0 && (
          <div className="mt-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-md p-6 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold mb-2">📊 Beğeni İstatistikleriniz</h3>
                <p className="opacity-90">
                  Toplam {likedNews.length} haber beğendiniz. 
                  {likedNews.length > 0 && (
                    <>
                      En çok beğendiğiniz kategori: {
                        Object.entries(
                          likedNews.reduce((acc, news) => {
                            acc[news.category] = (acc[news.category] || 0) + 1;
                            return acc;
                          }, {})
                        ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Bilinmeyen'
                      }
                    </>
                  )}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{likedNews.length}</div>
                <div className="text-sm opacity-90">Beğenilen Haber</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedNews;
