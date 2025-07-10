import React, { useState, useEffect } from 'react';
import AuthService from '../../services/auth.service';

const Profilim = () => {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', photoUrl: '' });
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);

  // Profil bilgisini yükle
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Profil bilgisi getiriliyor...');
      const data = await AuthService.getProfile();
      
      if (!data) throw new Error('Profil bilgileri alınamadı.');
      
      console.log('Alınan profil bilgisi:', data);
      console.log('Ham veri:', data._rawData);
      
      // Tüm veriyi detaylı olarak inceleyelim
      console.log('Tüm nesne özellikleri:');
      const flattenAndLog = (obj, prefix = '') => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null && key !== '_rawData') {
            flattenAndLog(obj[key], `${prefix}${key}.`);
          } else if (key !== '_rawData') {
            console.log(`- ${prefix}${key}: ${JSON.stringify(obj[key])}`);
          }
        }
      };
      flattenAndLog(data);
      
      // Backend'den gelen tüm olası alan adlarını kontrol et
      const firstName = data.firstName || '';
      const lastName = data.lastName || '';
      const email = data.email || '';
      const photoUrl = data.photoUrl || '';
      
      console.log('İşlenen profil verileri:', { firstName, lastName, email, photoUrl });
      
      const profileData = {
        firstName,
        lastName,
        email,
        photoUrl,
        // Eğer backend'den gelen özel alan adları varsa onları da sakla
        originalFieldNames: data.originalFieldNames || {
          firstName: 'firstName',
          lastName: 'lastName',
          email: 'email'
        }
      };
      
      console.log('Oluşturulan profil nesnesi:', profileData);
      
      setProfile(profileData);
      setPhotoPreview(photoUrl);
      setOriginalProfile({...profileData});
    } catch (err) {
      console.error('Profil yükleme hatası:', err);
      setError('Profil bilgileri alınamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Fotoğraf seçilince önizleme göster
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf boyutu 5MB\'dan küçük olmalı!');
        return;
      }
      
      // Dosya tipi kontrolü (sadece resim dosyalarına izin ver)
      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir resim dosyası seçin!');
        return;
      }
      
      console.log('Fotoğraf seçildi:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError(''); // Herhangi bir hata mesajı varsa temizle
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field değişiyor: ${name} = ${value}`);
    setProfile(prev => {
      const newProfile = { ...prev, [name]: value };
      console.log('Yeni profil durumu:', newProfile);
      return newProfile;
    });
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setPhotoPreview(originalProfile?.photoUrl || '');
    setPhotoFile(null);
    setMessage('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (!profile.firstName.trim() || !profile.lastName.trim()) {
        setError('Ad ve soyad boş olamaz!');
        setSaving(false);
        return;
      }
      if (!profile.email || !profile.email.includes('@')) {
        setError('Geçerli bir e-posta adresi girin!');
        setSaving(false);
        return;
      }
      
      // Ad, soyad veya e-posta değiştiyse güncelle
      if (
        profile.firstName !== originalProfile.firstName ||
        profile.lastName !== originalProfile.lastName ||
        profile.email !== originalProfile.email
      ) {
        console.log('Profil güncellenecek:', {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email
        });
        
        // Tüm olası alan adlarını içeren bir veri hazırlayalım
        // Orijinal backend alan adlarını kullanmaya çalışalım, böylece değişiklikleri doğru şekilde işleyebilir
        const updateData = {
          // Temel alanlar
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          email: profile.email.trim(),
          
          // Orijinal alan adlarını kontrol ederek kullan
          [profile.originalFieldNames?.firstName || 'firstName']: profile.firstName.trim(),
          [profile.originalFieldNames?.lastName || 'lastName']: profile.lastName.trim(),
          [profile.originalFieldNames?.email || 'email']: profile.email.trim(),
          
          // Türkçe alan adları
          ad: profile.firstName.trim(),
          soyad: profile.lastName.trim(),
          
          // Snake case
          first_name: profile.firstName.trim(),
          last_name: profile.lastName.trim(),
          
          // Diğer varyantlar
          name: profile.firstName.trim(),
          surname: profile.lastName.trim()
        };
        
        console.log('http://localhost:8080/v1/api/user/profile adresine PUT isteği yapılıyor...');
        console.log('Gönderilen veri:', updateData);
        
        // Güncelleme isteğini gönder
        const updateResult = await AuthService.updateProfile(updateData);
        
        // Sonucu detaylıca logla
        console.log('Güncelleme sonucu:', updateResult);
        
        // Başarıyla güncellendi mi kontrol et
        if (!updateResult) {
          throw new Error('Profil güncellenirken bir hata oluştu');
        }
        
        // Hata yoksa güncelleme durumu (eğer backend ilerleme bildiriyorsa)
        if (updateResult.success === false) {
          throw new Error(updateResult.message || 'Güncelleme işlemi başarısız oldu');
        }
        
        if (updateResult.message) {
          setMessage(updateResult.message);
        }
      }
      
      // Fotoğraf değiştiyse güncelle
      if (photoFile) {
        console.log('Fotoğraf güncelleniyor:', photoFile.name, photoFile.type, photoFile.size);
        try {
          // Fotoğraf yükleme işlemini başlat
          console.log('http://localhost:8080/v1/api/user/profile/photo adresine PUT isteği yapılıyor...');
          const photoResult = await AuthService.updateProfilePhoto(photoFile);
          console.log('Fotoğraf güncelleme sonucu:', photoResult);
          
          // Başarılı yanıt alındı mı kontrol et
          if (photoResult && photoResult.message) {
            console.log('Fotoğraf başarıyla yüklendi:', photoResult.message);
            setMessage(prevMessage => 
              prevMessage ? `${prevMessage} Fotoğraf da güncellendi.` : 'Fotoğraf başarıyla güncellendi!'
            );
          } else {
            console.warn('Fotoğraf yüklendi ancak backend yanıtı eksik');
          }
        } catch (photoError) {
          console.error('Fotoğraf güncelleme hatası:', photoError);
          if (!message) {
            setError(`Profil bilgileri güncellendi ancak fotoğraf yüklenemedi: ${photoError.message}`);
          }
        }
      }
      
      // Mesaj daha önce ayarlanmadıysa varsayılan mesajı göster
      if (!message && !error) {
        setMessage('Profil başarıyla güncellendi!');
      }
      
      setPhotoFile(null);
      
      // İşlemler bittikten sonra biraz bekleyelim
      setTimeout(async () => {
        // Güncel profil bilgisini yükle
        console.log('Güncel profil bilgisi yeniden alınıyor...');
        await fetchProfile(); // Profil bilgisini tekrar yükle ki yeni değerler hemen görünsün
      }, 500); // Backend'in değişiklikleri işlemesi için biraz bekle
      
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      setError(err.message || 'Profil güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]">Yükleniyor...</div>;
  }

  return (
    <div className="flex justify-center items-start min-h-[calc(100vh-56px)] bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-2 md:px-0">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 md:p-10">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Profilim</h2>
        {error && <div className="mb-4 text-red-600 bg-red-100 border border-red-200 rounded px-4 py-2 text-sm animate-shake">{error}</div>}
        {message && <div className="mb-4 text-green-700 bg-green-100 border border-green-200 rounded px-4 py-2 text-sm">{message}</div>}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <img
                src={photoPreview || '/default-avatar.png'}
                alt="Profil Fotoğrafı"
                className="w-28 h-28 rounded-full object-cover border-4 border-blue-200 shadow"
              />
              <input
                id="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handlePhotoChange}
                disabled={saving}
                tabIndex={0}
                aria-label="Profil fotoğrafı yükle"
              />
              <span className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg flex items-center justify-center z-30 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6 6M8.414 6.414a2 2 0 112.828 2.828L5 15.485V19h3.515l6.243-6.243a2 2 0 10-2.828-2.828z" /></svg>
              </span>
            </div>
            {photoFile && (
              <div className="mt-2 text-sm text-blue-600">
                Yeni fotoğraf seçildi: {photoFile.name}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Ad</label>
              <input
                type="text"
                name="firstName"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
                value={profile.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Soyad</label>
              <input
                type="text"
                name="lastName"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
                value={profile.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                disabled={saving}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">E-posta</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
              value={profile.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition disabled:opacity-60" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button type="button" className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg shadow transition" onClick={handleCancel} disabled={saving}>
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profilim;