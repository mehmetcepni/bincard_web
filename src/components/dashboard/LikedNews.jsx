import React, { useState, useEffect } from 'react';
import NewsService from '../../services/news.service';
import NewsImage from '../ui/NewsImage.jsx';

// Resim URL'sini düzeltme fonksiyonu
const normalizeImageUrl = (imageUrl, newsId) => {
  if (!imageUrl || imageUrl === '' || imageUrl === null || imageUrl === undefined) {
    return null; // Resim yoksa null döndür
  }
  
  let finalUrl = imageUrl;
  
  if (imageUrl.startsWith('/')) {
    finalUrl = `http://localhost:8080${imageUrl}`;
  } else if (!imageUrl.startsWith('http')) {
    finalUrl = `https://${imageUrl}`;
  }
  
  return finalUrl;
};

const LikedNews = () => {
  const [likedNews, setLikedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingNews, setRemovingNews] = useState(new Set());

  useEffect(() => {
    fetchLikedNews();
  }, []);

  const fetchLikedNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Backend'den beğenilen haberleri getir
      const response = await NewsService.getLikedNews();
      
      // Backend'den gelen data'yı işle
      const likedNewsData = response.map(processNewsData);
      
      setLikedNews(likedNewsData);
      console.log('✅ Beğenilen haberler başarıyla getirildi:', likedNewsData);
      
    } catch (error) {
      console.error('❌ Beğenilen haberler getirilemedi:', error);
      
      // Hata durumunda mock data kullan (offline mod)
      console.log('🔄 Hata nedeniyle mock data kullanılıyor...');
      const mockLikedNews = [
        {
          id: 1,
          title: "Yeni Metro Hattı Açıldı",
          content: "Şehirdeki ulaşım ağı genişliyor. Yeni metro hattı ile daha rahat seyahat edebileceksiniz.",
          image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
          category: "Ulaşım",
          likeCount: 245,
          likedAt: "2025-01-10T14:30:00Z",
          isActive: true,
          validUntil: "Sürekli",
          discount: "Özel Fırsat"
        },
        {
          id: 2,
          title: "Öğrenci İndirimi Başladı",
          content: "Tüm öğrenciler için %50 indirim kampanyası başladı. Kimlik kontrolü ile indirimli bilet alabilirsiniz.",
          image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2069&auto=format&fit=crop",
          category: "Kampanya",
          likeCount: 189,
          likedAt: "2025-01-09T10:15:00Z",
          isActive: true,
          validUntil: "28 Şubat 2025",
          discount: "50%"
        },
        {
          id: 3,
          title: "Mobil Ödeme Sistemi Güncellemesi",
          content: "Mobil ödeme sistemimiz yeni özelliklerle güncellendi. Artık daha güvenli ve hızlı ödeme yapabilirsiniz.",
          image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2069&auto=format&fit=crop",
          category: "Teknoloji",
          likeCount: 167,
          likedAt: "2025-01-08T16:45:00Z",
          isActive: true,
          validUntil: "Sürekli",
          discount: "Özel Fırsat"
        }
      ];
      
      setLikedNews(mockLikedNews);
      setError('Backend bağlantısı başarısız - demo veriler gösteriliyor');
      
    } finally {
      setLoading(false);
    }
  };

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
      
      // İsteğe bağlı: Listeyi backend'den tekrar yükle (consistency için)
      // setTimeout(() => fetchLikedNews(), 1000);
      
    } catch (error) {
      console.error(`❌ Haber ${newsId} beğeni kaldırma hatası:`, error);
      
      // Hata mesajını kullanıcı dostu hale getir
      let errorMessage = 'Beğeni kaldırılırken bir hata oluştu';
      
      if (error.message.includes('aktif değil')) {
        errorMessage = 'Bu haber artık aktif değil';
      } else if (error.message.includes('bulunamadı')) {
        errorMessage = 'Haber veya beğeni bulunamadı';
      } else if (error.message.includes('401')) {
        errorMessage = 'Bu işlem için giriş yapmanız gerekli';
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 4000);
    } finally {
      setRemovingNews(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Yakın zamanda beğenildi';
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Bugün beğenildi';
    } else if (diffDays === 2) {
      return 'Dün beğenildi';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} gün önce beğenildi`;
    } else if (diffDays <= 30) {
      return `${Math.ceil(diffDays / 7)} hafta önce beğenildi`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Backend'den gelen haber objesini frontend formatına çevir
  const processNewsData = (news) => {
    return {
      id: news.id,
      title: news.title || 'Başlık Bulunamadı',
      content: news.content || news.description || 'Açıklama bulunamadı',
      image: normalizeImageUrl(news.image || news.imageUrl, news.id),
      category: news.type || news.category || 'Genel',
      likeCount: news.likeCount || 0,
      likedAt: news.likedAt || news.createdAt || new Date().toISOString(),
      isActive: news.active !== undefined ? news.active : news.isActive !== undefined ? news.isActive : true,
      validUntil: news.endDate ? new Date(news.endDate).toLocaleDateString('tr-TR') : 'Sürekli',
      discount: news.priority === 'KRITIK' ? 'KRİTİK' : 
               news.priority === 'COK_YUKSEK' ? 'ÇOK YÜKSEK' :
               news.priority === 'YUKSEK' ? 'YÜKSEK' :
               news.priority === 'NORMAL' ? 'NORMAL' :
               news.priority === 'DUSUK' ? 'DÜŞÜK' :
               news.priority === 'COK_DUSUK' ? 'ÇOK DÜŞÜK' : 'Özel Fırsat',
      priority: news.priority,
      type: news.type,
      // Backend'den gelen ek alanlar
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      viewCount: news.viewCount || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">❤️ Beğendiğim Haberler</h1>
            <p className="text-gray-600">Beğendiğiniz haberler yükleniyor...</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">❤️ Beğendiğim Haberler</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">Hata Oluştu</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchLikedNews}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (likedNews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">❤️ Beğendiğim Haberler</h1>
            <p className="text-gray-600">Henüz hiç haber beğenmediniz</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-8xl mb-6">💔</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Henüz Beğenilen Haber Yok</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Haberler sekmesine giderek ilginizi çeken haberleri beğenebilir ve daha sonra burada görüntüleyebilirsiniz.
            </p>
            <button 
              onClick={() => window.location.href = '/news'}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              📰 Haberleri Keşfet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">❤️ Beğendiğim Haberler</h1>
          <p className="text-gray-600">
            Toplam {likedNews.length} haber beğendiniz
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">❤️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Toplam Beğeni</h3>
                <p className="text-2xl font-bold text-red-600">{likedNews.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Aktif Haberler</h3>
                <p className="text-2xl font-bold text-green-600">
                  {likedNews.filter(news => news.isActive).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Toplam Beğeni Sayısı</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {likedNews.reduce((total, news) => total + news.likeCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedNews.map((news) => (
            <div key={news.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
              {/* News Image - sadece resim varsa göster */}
              {news.image && (
                <div className="relative h-48 overflow-hidden">
                  <NewsImage
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded-full">
                      {news.category}
                    </span>
                  </div>
                  
                  {/* Like Date Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-red-500 bg-opacity-90 text-white text-xs font-medium rounded-full">
                      {formatDate(news.likedAt)}
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  {!news.isActive && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
                        ❌ İnaktif
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* News Content */}
              <div className="p-6">
                {/* Resim yoksa kategori ve tarih bilgilerini üst kısımda göster */}
                {!news.image && (
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {news.category}
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      {formatDate(news.likedAt)}
                    </span>
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                  {news.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {news.content}
                </p>
                
                {/* News Meta */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-1">👍</span>
                    <span>{news.likeCount} beğeni</span>
                  </div>
                  
                  <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    📅 {news.validUntil}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRemoveLike(news.id)}
                    disabled={removingNews.has(news.id)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      removingNews.has(news.id)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200'
                    }`}
                  >
                    {removingNews.has(news.id) ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                        Kaldırılıyor...
                      </div>
                    ) : (
                      <>💔 Beğeniyi Kaldır</>
                    )}
                  </button>
                  
                  <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                    📖 Detaylar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LikedNews;
