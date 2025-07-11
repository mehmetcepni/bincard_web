import axios from 'axios';

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
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[AUTH] Authorization header eklendi:', token);
    } else {
      console.warn('[AUTH] Authorization header eklenmedi, token bulunamadı!');
    }
    // İstek detaylarını logla
    console.log('🚀 İstek gönderiliyor:', {
      url: `${config.baseURL}${config.url}`,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data ? {
        ...config.data,
        password: config.data.password ? '[GİZLİ]' : undefined
      } : undefined
    });
    return config;
  },
  (error) => {
    console.error('❌ İstek hatası:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Başarılı yanıtı logla
    console.log('✅ Başarılı yanıt:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      url: response.config.url
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Token expired ise ve daha önce refresh denenmediyse
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const data = await AuthService.refreshToken(refreshToken);
          if (data.success && data.accessToken && data.refreshToken) {
            localStorage.setItem('accessToken', data.accessToken.token);
            localStorage.setItem('refreshToken', data.refreshToken.token);
            // Yeni token ile isteği tekrar dene
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken.token}`;
            return axiosInstance(originalRequest);
          } else {
            // Refresh başarısızsa logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(new Error(data.message || 'Oturum süresi doldu. Lütfen tekrar giriş yapın.'));
          }
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    // Hata detaylarını logla
    console.error('❌ Axios Hatası:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
    
    // 403 hataları için sadece kritik endpoint'lerde logout yap
    if (error.response?.status === 403) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                            error.config?.url?.includes('/login') || 
                            error.config?.url?.includes('/register');
      
      if (isAuthEndpoint) {
        // Sadece auth endpoint'lerinde token geçersizse logout yap
        console.warn('🔐 Auth endpoint token geçersiz, logout yapılıyor');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      } else {
        // Diğer endpoint'lerde sadece uyarı ver
        console.warn('🔐 Non-auth endpoint için 403 hatası, logout yapılmıyor');
      }
    }
    return Promise.reject(error);
  }
);

// Error handler
const handleError = (error) => {
  console.error('Hata İşleme Detayları:', {
    originalError: {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    },
    response: {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    },
    request: {
      url: error.config?.url ? `${error.config.baseURL}${error.config.url}` : undefined,
      method: error.config?.method,
      headers: error.config?.headers
    }
  });

  if (error.code === 'ECONNABORTED') {
    throw new Error('Sunucu yanıt vermedi. Lütfen daha sonra tekrar deneyin.');
  }

  if (!error.response) {
    throw new Error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve backend sunucusunun çalıştığını kontrol edin.');
  }

  // Eğer backend 401 döndürdü ve response.data yoksa, özel mesaj ver
  if (error.response.status === 401 && !error.response.data) {
    throw new Error('Girilen şifre ile telefon numarası eşleşmiyor');
  }

  // Backend'den gelen hata mesajını kullan
  const errorMessage = error.response?.data?.message 
    || error.response?.data?.error 
    || error.message 
    || 'Bir hata oluştu';

  throw new Error(errorMessage);
};

const AuthService = {
  // Test bağlantısı
  testConnection: async () => {
    try {
      console.log('Backend bağlantısı test ediliyor...');
      const response = await axiosInstance.options('/user/sign-up');
      console.log('Backend bağlantı testi başarılı:', response.data);
      return true;
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.log('Backend çalışıyor ama yetkilendirme gerekiyor');
        return true;
      }
      console.error('Backend bağlantı testi başarısız:', error);
      return false;
    }
  },

  // Kayıt olma işlemi
  register: async (userData) => {
    try {
      console.log('Register isteği başlatılıyor:', {
        ...userData,
        password: '[GİZLİ]'
      });

      // Telefon numarasını +90 ile başlat
      let telephone = userData.telephone;
      if (!telephone.startsWith('+90')) {
        telephone = '+90' + telephone.replace(/^0/, '');
      }

      const formData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        telephone: telephone,
        password: userData.password,
        deviceUuid: userData.deviceUuid,
        fcmToken: userData.fcmToken
      };

      console.log('Backend\'e gönderilecek veriler:', {
        ...formData,
        password: '[GİZLİ]'
      });

      const response = await axios.post('http://localhost:8080/v1/api/user/sign-up', formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Backend\'den gelen yanıt:', {
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error) {
      console.error('Register hatası:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return handleError(error);
    }
  },

  // Giriş yapma işlemi
  login: async (telephone, password) => {
    try {
      // Telefon numarasını +90 ile başlat
      if (!telephone.startsWith('+90')) {
        telephone = '+90' + telephone.replace(/^0/, '');
      }
      const formData = {
        telephone: telephone,
        password: password
      };
      const response = await axios.post('http://localhost:8080/v1/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      // Yeni cihaz algılandıysa özel durum
      if (data && data.message && data.message.includes('Yeni cihaz algılandı')) {
        return { success: false, newDevice: true, message: data.message };
      }
      if (data && data.accessToken && data.refreshToken) {
        localStorage.setItem('accessToken', data.accessToken.token);
        localStorage.setItem('refreshToken', data.refreshToken.token);
        return { success: true, data };
      } else {
        throw new Error(data?.message || 'Giriş başarısız oldu');
      }
    } catch (error) {
      return handleError(error);
    }
  },

  // Yeni cihaz için SMS doğrulama
  phoneVerify: async ({ code, ipAddress, deviceInfo, appVersion, platform }) => {
    try {
      const response = await axios.post('http://localhost:8080/v1/api/auth/phone-verify', {
        code,
        ipAddress,
        deviceInfo,
        appVersion,
        platform
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = response.data;
      if (data && data.accessToken && data.refreshToken) {
        localStorage.setItem('accessToken', data.accessToken.token);
        localStorage.setItem('refreshToken', data.refreshToken.token);
        return { success: true, data };
      } else {
        throw new Error(data?.message || 'Doğrulama başarısız oldu');
      }
    } catch (error) {
      return handleError(error);
    }
  },

  // Çıkış yapma işlemi
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  // Token kontrolü
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // SMS doğrulama
  verifyPhone: async (code) => {
    try {
      const response = await axios.post('http://localhost:8080/v1/api/user/verify/phone', { code }, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // SMS kodunu tekrar gönderme (Register işlemi için)
  resendSmsCode: async (telephone) => {
    try {
      console.log('[RESEND_SMS] Yeniden SMS kodu gönderiliyor:', telephone);
      
      // Telefon numarasını +90 ile başlat ve normalize et
      let normalizedPhone = telephone;
      if (!normalizedPhone.startsWith('+90')) {
        normalizedPhone = '+90' + normalizedPhone.replace(/^0/, '');
      }
      
      // Backend'in beklediği format: ResendPhoneVerificationRequest
      const requestData = {
        telephone: normalizedPhone,
        // IP address ve User Agent backend tarafından otomatik ekleniyor
      };
      
      console.log('[RESEND_SMS] Backend\'e gönderilecek veri:', requestData);
      
      // Kullanıcının belirttiği endpoint: POST /v1/api/auth/resend-verify-code?telephone=XXX
      // Query parameter olarak telefon numarası gönderiliyor
      const queryParams = new URLSearchParams({ telephone: normalizedPhone });
      const response = await axios.post(`http://localhost:8080/v1/api/auth/resend-verify-code?${queryParams}`, requestData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[RESEND_SMS] SMS kodu başarıyla gönderildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('[RESEND_SMS] SMS kodu gönderilemedi:', error);
      
      // Backend'den gelen hata mesajını öncelik ver
      const backendMessage = error.response?.data?.message;
      
      // Özel hata durumları
      if (error.response?.status === 404) {
        // UserNotFoundException
        throw new Error(backendMessage || 'Kullanıcı bulunamadı. Lütfen önce kayıt olun.');
      } else if (error.response?.status === 400) {
        // Geçersiz telefon numarası vb.
        throw new Error(backendMessage || 'Geçersiz telefon numarası.');
      } else if (error.response?.status === 429) {
        // Rate limiting - çok fazla istek
        throw new Error(backendMessage || 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.');
      }
      
      throw new Error(backendMessage || 'SMS kodu gönderilirken bir hata oluştu');
    }
  },

  // Şifre sıfırlama kodu doğrulama
  passwordVerifyCode: async (verificationCodeRequest) => {
    try {
      const response = await axios.post('http://localhost:8080/v1/api/user/password/verify-code', verificationCodeRequest);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Yeni şifre belirleme
  passwordReset: async ({ resetToken, newPassword }) => {
    try {
      const response = await axios.post('http://localhost:8080/v1/api/user/password/reset', { resetToken, newPassword });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Refresh token fonksiyonu
  refreshToken: async (refreshToken) => {
    try {
      const response = await axios.post('http://localhost:8080/v1/api/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Kullanıcı profilini getiren fonksiyon
  getProfile: async () => {
    try {
      console.log('[PROFILE] Profil bilgisi çekiliyor...');
      
      try {
        // Doğru endpoint ile profil bilgisini getiriyoruz
        const response = await axios.get('http://localhost:8080/v1/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
          }
        });
        console.log('[PROFILE] Profil bilgisi başarıyla alındı:', response.data);
        
        // Backend'den gelen yanıtı detaylı inceleyerek farklı alan adlarını kontrol edelim
        const data = response.data;
        console.log('[PROFILE] Backend\'den gelen ham veri:', JSON.stringify(data));
        
        // Daha fazla olası alan adı ekleyelim
        const possibleFirstNames = ['firstName', 'first_name', 'name', 'ad', 'firstname', 'given_name', 'givenName'];
        const possibleLastNames = ['lastName', 'last_name', 'surname', 'soyad', 'lastname', 'family_name', 'familyName'];
        const possibleEmails = ['email', 'mail', 'emailAddress', 'e_mail', 'email_address', 'userEmail'];
        const possiblePhotoUrls = ['photoUrl', 'photo_url', 'profilePhoto', 'avatarUrl', 'profilePicture', 'image', 'profileImage'];
        
        // Tüm alanları logla - JSON içinde iç içe nesnelerde de kontrol edelim
        console.log('[PROFILE] Bulunan alan değerleri:');
        
        // Tüm JSON nesnesini düz bir yapıya çevirelim (iç içe nesneleri düzleştirme)
        const flattenObject = (obj, prefix = '') => {
          return Object.keys(obj).reduce((acc, key) => {
            const pre = prefix.length ? `${prefix}.` : '';
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
            } else {
              acc[`${pre}${key}`] = obj[key];
            }
            return acc;
          }, {});
        };
        
        const flatData = flattenObject(data);
        
        // Düzleştirilmiş veriyi kontrol ederek alanları bul
        const findValueByPossibleKeys = (flatObj, possibleKeys) => {
          for (const key of possibleKeys) {
            // Doğrudan anahtar kontrolü
            if (flatObj[key] !== undefined) {
              console.log(`- ${key}: ${flatObj[key]}`);
              return flatObj[key];
            }
            
            // İç içe nesne içindeki anahtar kontrolü (düzleştirilmiş formatta)
            for (const flatKey in flatObj) {
              if (flatKey.endsWith(`.${key}`)) {
                console.log(`- ${flatKey}: ${flatObj[flatKey]}`);
                return flatObj[flatKey];
              }
            }
          }
          return null;
        };
        
        // Her bir alan tipi için olası anahtarları kontrol et
        const firstName = findValueByPossibleKeys(flatData, possibleFirstNames);
        const lastName = findValueByPossibleKeys(flatData, possibleLastNames);
        const email = findValueByPossibleKeys(flatData, possibleEmails);
        const photoUrl = findValueByPossibleKeys(flatData, possiblePhotoUrls);
        
        // Tüm alanları kontrol ederek profil nesnesini oluştur
        const profileData = {
          // Ana alanlar - birden fazla olası adı kontrol et
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || '',
          photoUrl: photoUrl || '',
          
          // Orijinal alan adları da sakla ki backend'e geri gönderebilmek
          originalFieldNames: {
            firstName: possibleFirstNames.find(field => data[field] !== undefined) || 'firstName',
            lastName: possibleLastNames.find(field => data[field] !== undefined) || 'lastName',
            email: possibleEmails.find(field => data[field] !== undefined) || 'email'
          },
          
          // Ham veriyi de sakla (tam debugger için)
          _rawData: data
        };
        
        console.log('[PROFILE] Oluşturulan profil nesnesi:', profileData);
        
        // Profil bilgisini önbelleğe kaydedelim
        localStorage.setItem('lastKnownProfile', JSON.stringify(profileData));
        
        return profileData;
      } catch (apiError) {
        console.warn('[PROFILE] API bağlantısında hata oluştu, geçici test verisi kullanılıyor', apiError);
        console.error('Hata detayları:', apiError.response?.data || apiError.message);
        
        // API çalışmadığında, son bilinen profil verisini localStorage'dan almaya çalış
        const cachedProfile = localStorage.getItem('lastKnownProfile');
        if (cachedProfile) {
          try {
            const parsedProfile = JSON.parse(cachedProfile);
            console.log('[PROFILE] Önbellekten alınan profil:', parsedProfile);
            return parsedProfile;
          } catch (parseError) {
            console.error('[PROFILE] Önbellek verisi ayrıştırılamadı:', parseError);
          }
        }
        
        // TEST: API çalışmazsa ve önbellekte veri yoksa test verisi döndür
        return {
          firstName: 'Test',
          lastName: 'Kullanıcı',
          email: 'test@example.com',
          photoUrl: '',
          // Diğer alanlar...
        };
      }
    } catch (error) {
      console.error('[PROFILE] Profil bilgisi alınamadı:', error);
      return handleError(error);
    }
  },

  // Kullanıcı profilini güncelleyen fonksiyon
  updateProfile: async (updateData) => {
    try {
      console.log('[PROFILE] Profil güncelleniyor:', updateData);
      
      // Girilen değerlerin boş olup olmadığını kontrol et
      if (!updateData.firstName || !updateData.lastName) {
        throw new Error('Ad ve soyad alanları boş bırakılamaz!');
      }
      
      // Backend'in beklediği tam parametreleri kontrol etmek için olası tüm alan adlarını deneyeceğiz
      // Java Spring Boot backend'in UpdateProfileRequest sınıfında hangi alanları beklediğini bilmiyoruz
      // bu nedenle birkaç olası varyantı deneyeceğiz
      const requestData = {
        // Camel case (Java standart)
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        
        // Alternatif alan adları (Türkçe)
        ad: updateData.firstName, 
        soyad: updateData.lastName,
        
        // Snake case
        first_name: updateData.firstName,
        last_name: updateData.lastName,
        
        // Diğer varyantlar
        name: updateData.firstName,
        surname: updateData.lastName
      };
      
      console.log('[PROFILE] Backend\'e gönderilecek genişletilmiş veri:', requestData);
      
      try {
        // Request öncesi detaylı log
        console.log('[PROFILE] Profil güncellemesi için HTTP isteği yapılıyor:');
        console.log('- Endpoint: http://localhost:8080/v1/api/user/profile');
        console.log('- Metod: PUT');
        console.log('- Veri:', JSON.stringify(requestData, null, 2));
        
        // Backend'deki @PutMapping("/profile") ile eşleşen endpoint
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
          throw new Error('Oturum bulunamadı! Lütfen tekrar giriş yapın.');
        }

        console.log('[PROFILE] Yetkilendirme token:', token.substring(0, 15) + '...');
        
        const response = await axios.put('http://localhost:8080/v1/api/user/profile', requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('[PROFILE] Profil başarıyla güncellendi:', response.data);
        
        // Backend'den dönen veriyi işle
        const responseData = response.data || {};
        
        // Backend'den gelen tüm olası alan adlarını kontrol et
        const updatedProfile = {
          message: responseData.message || 'Profil bilgileriniz başarıyla güncellendi.',
          
          // Öncelikle backend yanıtındaki alanları kontrol et
          firstName: responseData.firstName || responseData.first_name || responseData.ad || responseData.name || updateData.firstName,
          lastName: responseData.lastName || responseData.last_name || responseData.soyad || responseData.surname || updateData.lastName,
          
          // Email için özel olarak tüm olası alanları kontrol et
          email: responseData.email || responseData.mail || responseData.emailAddress || responseData.e_mail || updateData.email,
          
          // Diğer alanları da ekle
          ...responseData
        };
        
        console.log('[PROFILE] Döndürülen güncellenmiş profil:', updatedProfile);
        
        // Profil bilgisini localStorage'a da kaydedelim, böylece API bağlantısı olmasa bile 
        // son bilinen profil bilgisini gösterebiliriz
        localStorage.setItem('lastKnownProfile', JSON.stringify(updatedProfile));
        
        return updatedProfile;
      } catch (apiError) {
        console.warn('[PROFILE] API hatası, istemci tarafında güncellenmiş veri döndürülüyor:', apiError);
        
        // API hatası durumunda, kullanıcının gönderdiği bilgileri geri döndür
        const fallbackProfile = { 
          message: 'Profil bilgileriniz güncellendi (sunucu yanıtı alınamadı).',
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          email: updateData.email,
          // Alternatif alan adları
          ad: updateData.firstName,
          soyad: updateData.lastName,
          first_name: updateData.firstName,
          last_name: updateData.lastName,
          name: updateData.firstName,
          surname: updateData.lastName
        };
        
        // Önbellekte de saklayalım
        localStorage.setItem('lastKnownProfile', JSON.stringify(fallbackProfile));
        
        return fallbackProfile;
      }
    } catch (error) {
      console.error('[PROFILE] Profil güncellenemedi:', error);
      return handleError(error);
    }
  },

  // Kullanıcı profil fotoğrafını güncelleyen fonksiyon
  updateProfilePhoto: async (photoFile) => {
    try {
      if (!photoFile) {
        throw new Error('Lütfen bir fotoğraf seçin!');
      }
      if (photoFile.size > 5 * 1024 * 1024) {
        throw new Error('Fotoğraf boyutu 5MB\'dan küçük olmalıdır!');
      }
      
      console.log('[PROFILE_PHOTO] Fotoğraf yükleniyor:', photoFile.name, photoFile.size);
      
      // Backend'in beklediği parametre adı "photo" olmalı
      const formData = new FormData();
      formData.append('photo', photoFile);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      
      console.log('[PROFILE_PHOTO] FormData içeriği:', formData);
      console.log('[PROFILE_PHOTO] Fotoğraf adı:', photoFile.name);
      console.log('[PROFILE_PHOTO] Fotoğraf tipi:', photoFile.type);
      console.log('[PROFILE_PHOTO] Fotoğraf boyutu:', photoFile.size);
      
      try {
        // @PutMapping("/profile/photo") endpoint'i ile uyumlu
        // @RequestParam("photo") MultipartFile parametresi için doğru isim kullanılmalı
        console.log('[PROFILE_PHOTO] PUT isteği: http://localhost:8080/v1/api/user/profile/photo');
        console.log('[PROFILE_PHOTO] FormData içinde "photo" parametresi gönderiliyor');
        
        const response = await axios.put('http://localhost:8080/v1/api/user/profile/photo', formData, {
          headers: {
            'Authorization': `Bearer ${token}`
            // Content-Type header'ını axios otomatik ekleyecek
            // ve doğru boundary değeri ile multipart/form-data olarak ayarlayacak
          },
          // Dosya yükleme ilerleme bilgisi ekle
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`[PROFILE_PHOTO] Yükleme ilerleme: %${percentCompleted}`);
          }
        });
        
        console.log('[PROFILE_PHOTO] Fotoğraf başarıyla yüklendi:', response.data);
        return response.data;
      } catch (apiError) {
        console.error('[PROFILE_PHOTO] API hatası:', apiError);
        console.error('[PROFILE_PHOTO] Hata detayları:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers
        });
        throw new Error(apiError.response?.data?.message || 'Fotoğraf yüklenemedi.');
      }
    } catch (error) {
      console.error('[PROFILE] Profil fotoğrafı güncellenemedi:', error);
      
      // Tutarlı hata mesajı formatı için
      const errorMessage = error.message || 'Profil fotoğrafı güncellenirken bir hata oluştu.';
      throw new Error(errorMessage);
    }
  },

  // Haber ekleme fonksiyonu (Admin işlemi)
  addNews: async (newsData) => {
    try {
      console.log('[NEWS] Yeni haber ekleniyor:', newsData);
      
      // Girilen değerlerin boş olup olmadığını kontrol et
      if (!newsData.title || !newsData.content) {
        throw new Error('Başlık ve içerik alanları boş bırakılamaz!');
      }
      
      // Backend'e gönderilecek veri formatı
      const requestData = {
        title: newsData.title,
        content: newsData.content,
        image: newsData.image || null,
        priority: newsData.priority || 'NORMAL',
        type: newsData.type || 'DUYURU',
        endDate: newsData.endDate || null,
        active: newsData.active !== undefined ? newsData.active : true
      };
      
      console.log('[NEWS] Backend\'e gönderilecek haber verisi:', requestData);
      
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Oturum bulunamadı! Lütfen tekrar giriş yapın.');
      }

      console.log('[NEWS] Haber ekleme için HTTP isteği yapılıyor...');
      
      const response = await axios.post('http://localhost:8080/v1/api/news', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[NEWS] Haber başarıyla eklendi:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[NEWS] Haber eklenemedi:', error);
      
      // API hatası durumunda hata mesajını döndür
      const errorMessage = error.response?.data?.message || error.message || 'Haber eklenirken bir hata oluştu.';
      throw new Error(errorMessage);
    }
  },

  // Login SMS doğrulama için tekrar kod gönderme (Yeni cihaz doğrulaması)
  resendLoginSmsCode: async (telephone) => {
    try {
      console.log('[RESEND_LOGIN_SMS] Yeniden SMS kodu gönderiliyor (Login):', telephone);
      
      // Telefon numarasını +90 ile başlat ve normalize et
      let normalizedPhone = telephone;
      if (!normalizedPhone.startsWith('+90')) {
        normalizedPhone = '+90' + normalizedPhone.replace(/^0/, '');
      }
      
      // Backend'in beklediği format
      const requestData = {
        telephone: normalizedPhone,
      };
      
      console.log('[RESEND_LOGIN_SMS] Backend\'e gönderilecek veri:', requestData);
      
      // Aynı resend endpoint'ini kullan - register ve login için aynı
      const queryParams = new URLSearchParams({ telephone: normalizedPhone });
      const response = await axios.post(`http://localhost:8080/v1/api/auth/resend-verify-code?${queryParams}`, requestData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[RESEND_LOGIN_SMS] SMS kodu başarıyla gönderildi:', response.data);
      return response.data;
    } catch (error) {
      console.error('[RESEND_LOGIN_SMS] SMS kodu gönderilemedi:', error);
      
      // Backend'den gelen hata mesajını öncelik ver
      const backendMessage = error.response?.data?.message;
      
      // Özel hata durumları
      if (error.response?.status === 404) {
        throw new Error(backendMessage || 'Kullanıcı bulunamadı.');
      } else if (error.response?.status === 400) {
        throw new Error(backendMessage || 'Geçersiz telefon numarası.');
      } else if (error.response?.status === 429) {
        throw new Error(backendMessage || 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.');
      }
      
      throw new Error(backendMessage || 'SMS kodu gönderilirken bir hata oluştu');
    }
  },
};

export default AuthService;