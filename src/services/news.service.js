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
  baseURL: '/api',  // Vite proxy üzerinden yönlendirilecek
  timeout: 15000,   // 15 saniye timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - token ekleme
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
    // İstek detaylarını logla
    console.log('🚀 NEWS İstek gönderiliyor:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      hasAuth: !!config.headers.Authorization
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
      const response = await axiosInstance.get('/v1/api/news');
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
      const response = await axiosInstance.get('/v1/api/news/active');
      console.log('✅ Aktif haberler başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Aktif haberler getirilemedi:', error);
      
      // 403 hatası alındıysa token yenilemeyi dene
      if (error.response?.status === 403) {
        console.log('🔄 403 hatası nedeniyle token yenilemeyi deniyoruz...');
        const refreshed = await refreshTokenIfNeeded();
        
        if (refreshed) {
          try {
            console.log('🔄 Yenilenen token ile tekrar deniyoruz...');
            const retryResponse = await axiosInstance.get('/v1/api/news/active');
            console.log('✅ Token yenileme sonrası haberler başarıyla getirildi:', retryResponse.data);
            return retryResponse.data;
          } catch (retryError) {
            console.error('❌ Token yenileme sonrası da hata:', retryError);
          }
        }
      }
      
      throw new Error(error.response?.data?.message || 'Aktif haberler yüklenirken bir hata oluştu');
    }
  },

  // Belirli bir haberi getir
  getNewsById: async (newsId) => {
    try {
      console.log(`📰 Haber getiriliyor: ${newsId}`);
      const response = await axiosInstance.get(`/v1/api/news/${newsId}`);
      console.log('✅ Haber başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haber getirilemedi:', error);
      throw new Error(error.response?.data?.message || 'Haber yüklenirken bir hata oluştu');
    }
  },

  // Haber beğen
  likeNews: async (newsId) => {
    try {
      console.log(`👍 Haber beğeniliyor: ${newsId}`);
      const response = await axiosInstance.post(`/v1/api/news/${newsId}/like`);
      console.log('✅ Haber başarıyla beğenildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haber beğenilemedi:', error);
      
      // Özel hata mesajları
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Bu haberi beğenme işlemi başarısız oldu');
      } else if (error.response?.status === 404) {
        throw new Error('Haber bulunamadı');
      } else if (error.response?.status === 410) {
        throw new Error('Bu haber artık aktif değil');
      } else if (error.response?.status === 408) {
        throw new Error('Bu haberin süresi dolmuş');
      }
      
      throw new Error(error.response?.data?.message || 'Haber beğenilirken bir hata oluştu');
    }
  },

  // Haber beğenisini kaldır (eğer backend'de varsa)
  unlikeNews: async (newsId) => {
    try {
      console.log(`👎 Haber beğenisi kaldırılıyor: ${newsId}`);
      const response = await axiosInstance.delete(`/v1/api/news/${newsId}/like`);
      console.log('✅ Haber beğenisi başarıyla kaldırıldı:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Haber beğenisi kaldırılamadı:', error);
      throw new Error(error.response?.data?.message || 'Haber beğenisi kaldırılırken bir hata oluştu');
    }
  },

  // Kategoriye göre haberler getir (eğer backend'de varsa)
  getNewsByCategory: async (category) => {
    try {
      console.log(`📰 Kategoriye göre haberler getiriliyor: ${category}`);
      const response = await axiosInstance.get(`/v1/api/news/category/${category}`);
      console.log('✅ Kategoriye göre haberler başarıyla getirildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Kategoriye göre haberler getirilemedi:', error);
      throw new Error(error.response?.data?.message || 'Kategoriye göre haberler yüklenirken bir hata oluştu');
    }
  }
};

export default NewsService;
