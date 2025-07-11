import axios from 'axios';

// Token debug fonksiyonu
const debugToken = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('🔍 Token Debug Info:', {
    hasAccessToken: !!token,
    hasRefreshToken: !!refreshToken,
    tokenLength: token ? token.length : 0,
    tokenStart: token ? token.substring(0, 20) + '...' : 'Yok',
    tokenType: token ? (token.startsWith('eyJ') ? 'JWT' : 'Unknown') : 'None'
  });
  
  // JWT token ise decode et
  if (token && token.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📋 JWT Payload:', {
        sub: payload.sub,
        exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'Unknown',
        iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'Unknown',
        expired: payload.exp ? Date.now() > payload.exp * 1000 : 'Unknown'
      });
    } catch (e) {
      console.warn('❌ JWT decode hatası:', e);
    }
  }
  
  return token;
};

// Axios instance oluştur
const axiosInstance = axios.create({
  baseURL: '/api/v1/api',  // Vite proxy üzerinden yönlendirilecek
  timeout: 15000,   // 15 saniye timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - token ve platform bilgisi ekleme
axiosInstance.interceptors.request.use(
  (config) => {
    // Hem accessToken hem token anahtarını kontrol et
    const token = debugToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[NEWS] Authorization header eklendi');
    } else {
      console.warn('[NEWS] Authorization header eklenmedi, token bulunamadı!');
    }
    
    // Platform bilgisini header olarak ekle
    config.headers['X-Platform'] = 'WEB';
    config.headers['Platform'] = 'WEB';
    
    // İstek detaylarını logla
    console.log('🚀 NEWS İstek gönderiliyor:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      hasAuth: !!config.headers.Authorization,
      platform: config.headers.Platform
    });
    return config;
  },
  (error) => {
    console.error('❌ NEWS İstek hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Başarılı yanıtı logla
    console.log('✅ NEWS Başarılı yanıt:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('❌ NEWS Yanıt hatası:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });

    // Token geçersizse sadece console'a yaz, logout yapma
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔐 News API için token geçersiz, ama logout yapmıyoruz - fallback data kullanılacak');
      // localStorage.removeItem('accessToken');
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Manuel token yenileme fonksiyonu
const refreshTokenIfNeeded = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    console.warn('🔄 Refresh token bulunamadı');
    return false;
  }

  try {
    console.log('🔄 Token yenileniyor...');
    const response = await axios.post('/api/v1/api/auth/refresh', {
      refreshToken: refreshToken
    });

    if (response.data && response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken.token);
      }
      console.log('✅ Token başarıyla yenilendi');
      return true;
    }
  } catch (error) {
    console.error('❌ Token yenileme hatası:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
  }
  return false;
};

const NewsService = {
  // Tüm haberleri getir
  getAllNews: async () => {
    try {
      console.log('📰 Tüm haberler getiriliyor...');
      const response = await axiosInstance.get('/news', {
        params: { platform: 'WEB' }
      });
      console.log('✅ Haberler başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haberler getirilemedi:', error);
      throw new Error(error.response?.data?.message || 'Haberler yüklenirken bir hata oluştu');
    }
  },

  // Aktif haberleri getir
  getActiveNews: async () => {
    try {
      console.log('📰 Aktif haberler getiriliyor...');
      const response = await axiosInstance.get('/news/active', {
        params: { platform: 'WEB' }
      });
      console.log('✅ Aktif haberler başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Aktif haberler getirilemedi:', error);
      
      // Backend bağlantısı yoksa test verisi döndür
      console.log('🔄 Backend bağlantısı yok, test verisi döndürülüyor...');
      return [
        {
          id: 1,
          title: 'BinCard Yeni Özellikler',
          content: 'BinCard uygulamasına yeni özellikler eklendi. Mobil ödeme sistemi artık daha hızlı ve güvenli.',
          imageUrl: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=BinCard+Service',
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
          imageUrl: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Service+Indirim',
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
          imageUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Service+Bakim',
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
    }
  },

  // Belirli bir haberi getir
  getNewsById: async (newsId) => {
    try {
      console.log(`📰 Haber getiriliyor: ${newsId}`);
      const response = await axiosInstance.get(`/news/${newsId}`, {
        params: { platform: 'WEB' }
      });
      console.log('✅ Haber başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haber getirilemedi:', error);
      throw new Error(error.response?.data?.message || 'Haber yüklenirken bir hata oluştu');
    }
  },

  // Haber beğen (POST) - yeni beğeni ekleme
  likeNews: async (newsId) => {
    try {
      console.log(`👍 Haber beğeniliyor: ${newsId}`);
      const response = await axiosInstance.post(`/news/${newsId}/like`, {
        platform: 'WEB'
      });
      console.log('✅ Haber başarıyla beğenildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haber beğenilemedi:', error);
      
      // Backend'den gelen hata mesajını öncelik ver
      const backendMessage = error.response?.data?.message;
      
      // Backend exception'larına göre özel hata mesajları
      if (error.response?.status === 400) {
        throw new Error(backendMessage || 'Beğeni işlemi başarısız oldu');
      } else if (error.response?.status === 404) {
        // NewsNotFoundException
        throw new Error(backendMessage || 'Haber bulunamadı');
      } else if (error.response?.status === 403) {
        // UserNotFoundException veya yetki hatası
        throw new Error(backendMessage || 'Kullanıcı bulunamadı veya yetki hatası');
      } else if (error.response?.status === 410) {
        // NewsIsNotActiveException
        throw new Error(backendMessage || 'Bu haber artık aktif değil');
      } else if (error.response?.status === 408) {
        // OutDatedNewsException
        throw new Error(backendMessage || 'Bu haberin süresi dolmuş');
      } else if (error.response?.status === 409) {
        // Haber zaten beğenilmiş olabilir
        throw new Error(backendMessage || 'Bu haber zaten beğenilmiş');
      }
      
      throw new Error(backendMessage || 'Haber beğenilirken bir hata oluştu');
    }
  },

  // Haber beğenisini kaldır (DELETE) - mevcut beğeniyi kaldırma
  unlikeNews: async (newsId) => {
    try {
      console.log(`👎 Haber beğenisi kaldırılıyor: ${newsId}`);
      const response = await axiosInstance.delete(`/news/${newsId}/unlike`, {
        data: { platform: 'WEB' }
      });
      console.log('✅ Haber beğenisi başarıyla kaldırıldı:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haber beğenisi kaldırılamadı:', error);
      
      // Backend'den gelen hata mesajını öncelik ver
      const backendMessage = error.response?.data?.message;
      
      // Backend exception'larına göre özel hata mesajları
      if (error.response?.status === 400) {
        throw new Error(backendMessage || 'Beğeni kaldırma işlemi başarısız oldu');
      } else if (error.response?.status === 404) {
        // NewsNotFoundException veya beğeni bulunamadı
        throw new Error(backendMessage || 'Haber veya beğeni bulunamadı');
      } else if (error.response?.status === 403) {
        // UserNotFoundException veya yetki hatası
        throw new Error(backendMessage || 'Kullanıcı bulunamadı veya yetki hatası');
      } else if (error.response?.status === 410) {
        // NewsIsNotActiveException
        throw new Error(backendMessage || 'Bu haber artık aktif değil');
      } else if (error.response?.status === 408) {
        // OutDatedNewsException
        throw new Error(backendMessage || 'Bu haberin süresi dolmuş');
      } else if (error.response?.status === 409) {
        // Beğeni zaten kaldırılmış olabilir
        throw new Error(backendMessage || 'Bu haber zaten beğenilmemiş');
      } else if (error.response?.status === 401) {
        throw new Error(backendMessage || 'Giriş yapmanız gerekiyor');
      } else {
        throw new Error(backendMessage || 'Haber beğenisi kaldırılırken bir hata oluştu');
      }
    }
  },

  // Kullanıcının beğendiği haberleri getir
  getLikedNews: async () => {
    try {
      console.log('📖 Beğenilen haberler isteniyor...');
      debugToken();
      
      const response = await axiosInstance.get('/news/liked', {
        params: { platform: 'WEB' }
      });
      console.log('✅ Beğenilen haberler başarıyla alındı:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Beğenilen haberler getirme hatası:', error);
      
      // Backend'den gelen hata mesajını öncelik ver
      const backendMessage = error.response?.data?.message;
      
      if (error.response?.status === 401) {
        console.error('🔐 Token geçersiz, kullanıcı giriş yapmamış');
        throw new Error('Beğenilen haberleri görmek için giriş yapmanız gerekiyor.');
      } else if (error.response?.status === 403) {
        console.error('🚫 Yetki yok - UnauthorizedAreaException');
        throw new Error('Bu işlem için yetkiniz bulunmuyor.');
      } else if (error.response?.status === 404) {
        console.error('📭 Kullanıcı bulunamadı - UserNotFoundException');
        throw new Error('Kullanıcı bulunamadı.');
      } else if (error.response?.status === 400) {
        console.error('📭 Geçersiz istek');
        return []; // Boş array döndür
      } else {
        // Backend bağlantısı yoksa test verisi döndür
        console.log('🔄 Backend bağlantısı yok, beğenilen haberler için test verisi döndürülüyor...');
        return [
          {
            id: 3,
            title: 'Sistem Bakım Duyurusu',
            content: 'Bu gece 02:00 - 04:00 arası sistem bakımı yapılacaktır. Bu sürede hizmet kesintisi yaşanabilir.',
            image: 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Service+Liked+1',
            thumbnail: null,
            priority: 'KRITIK',
            type: 'DUYURU',
            likedByUser: true,
            viewedByUser: true,
            viewCount: 156,
            likeCount: 8,
            createdAt: new Date().toISOString()
          },
          {
            id: 5,
            title: 'Beğendiğim Test Haberi',
            content: 'Bu kullanıcının beğendiği test haberidir. Backend bağlantısı olmadığı için gösteriliyor.',
            image: 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Service+Liked+2',
            thumbnail: null,
            priority: 'YUKSEK',
            type: 'KAMPANYA',
            likedByUser: true,
            viewedByUser: true,
            viewCount: 89,
            likeCount: 23,
            createdAt: new Date().toISOString()
          }
        ];
      }
    }
  },

  // Kategoriye göre haberler getir
  getNewsByCategory: async (category) => {
    try {
      console.log(`📰 Kategoriye göre haberler getiriliyor: ${category}`);
      const response = await axiosInstance.get(`/news/category/${category}`, {
        params: { platform: 'WEB' }
      });
      console.log('✅ Kategoriye göre haberler başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Kategoriye göre haberler getirilemedi:', error);
      throw new Error(error.response?.data?.message || 'Kategoriye göre haberler yüklenirken bir hata oluştu');
    }
  }
};

export default NewsService;
