import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: form, 1: sms
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    telephone: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Bağlantı testi
    AuthService.testConnection();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Input validation - sadece belirli karakterlere izin ver
    if (name === 'firstName' || name === 'lastName') {
      // Ad ve soyad için sadece harfler, Türkçe karakterler ve boşluk
      const letterOnlyValue = value.replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ\s]/g, '');
      setForm({ ...form, [name]: letterOnlyValue });
    } else if (name === 'telephone') {
      // Telefon numarası için sadece sayılar
      const numberOnlyValue = value.replace(/[^0-9]/g, '');
      setForm({ ...form, [name]: numberOnlyValue });
    } else {
      // Diğer alanlar için normal işlem
      setForm({ ...form, [name]: value });
    }
  };

  const validate = () => {
    if (!form.firstName || form.firstName.length < 2) return 'Ad en az 2 karakter olmalı';
    if (!/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/.test(form.firstName)) return 'Ad alanına sadece harf girebilirsiniz';
    if (!form.lastName || form.lastName.length < 2) return 'Soyad en az 2 karakter olmalı';
    if (!/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/.test(form.lastName)) return 'Soyad alanına sadece harf girebilirsiniz';
    if (!/^0[0-9]{10}$/.test(form.telephone)) return 'Telefon numarası 0 ile başlamalı ve 11 haneli olmalı';
    if (!form.password || form.password.length < 6) return 'Şifre en az 6 karakter olmalı';
    if (form.password !== form.confirmPassword) return 'Şifreler eşleşmiyor';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const err = validate();
    if (err) { setError(err); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const formData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        telephone: form.telephone.trim(),
        password: form.password,
        deviceUuid: 'a1b2c3d4-e5f6-7890-abcd-1234567890ef',
        fcmToken: 'fcm_örnek_token_bilgisi'
      };
      const response = await AuthService.register(formData);
      if (response && response.success) {
        setStep(1);
        toast.success('Hesabınız başarıyla oluşturuldu!', { position: 'top-center', autoClose: 3000 });
        toast.info('Doğrulama kodu telefonunuza gönderildi!', { position: 'top-center', autoClose: 5000 });
      } else {
        if (response?.message && (response.message.includes('already exists') || response.message.includes('duplicate'))) {
          setError('Bu numarayla daha önce kaydoldu');
          toast.error('Bu numarayla daha önce kaydoldu', { position: 'top-center', autoClose: 5000 });
          return;
        }
        throw new Error(response?.message || 'Kayıt işlemi başarısız oldu');
      }
    } catch (err) {
      setError(err.message || 'Kayıt işlemi başarısız oldu.');
      toast.error(err.message || 'Kayıt işlemi başarısız oldu.', { position: 'top-center', autoClose: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendSms = async () => {
    if (isResending || isSubmitting) return;
    
    setIsResending(true);
    setError('');
    
    try {
      const response = await AuthService.resendSmsCode(form.telephone);
      if (response && response.success) {
        toast.success('SMS kodu başarıyla tekrar gönderildi!', { 
          position: 'top-center', 
          autoClose: 3000 
        });
        toast.info('Yeni doğrulama kodunu telefonunuza gönderdik!', { 
          position: 'top-center', 
          autoClose: 5000 
        });
      } else {
        throw new Error(response?.message || 'SMS kodu gönderilemedi');
      }
    } catch (err) {
      const errorMessage = err.message || 'SMS kodu gönderilemedi. Lütfen tekrar deneyin.';
      setError(errorMessage);
      toast.error(errorMessage, { 
        position: 'top-center', 
        autoClose: 5000 
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!verificationCode) {
      setError('Lütfen doğrulama kodunu giriniz!');
      toast.error('Lütfen doğrulama kodunu giriniz!', { position: 'top-center', autoClose: 3000 });
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const verifyResponse = await AuthService.verifyPhone(verificationCode);
      if (verifyResponse && verifyResponse.success) {
        setError('');
        toast.success('🎉 Tebrikler! Kayıt işlemi başarıyla tamamlandı!', { position: 'top-center', autoClose: 3000 });
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Kayıt işleminiz başarıyla tamamlandı! Şimdi giriş yapabilirsiniz.', type: 'success' }
          });
        }, 2000);
      } else {
        throw new Error(verifyResponse?.message || 'Doğrulama işlemi başarısız oldu');
      }
    } catch (err) {
      setError(err.message || 'Doğrulama işlemi başarısız oldu.');
      toast.error(err.message || 'Doğrulama işlemi başarısız oldu.', { position: 'top-center', autoClose: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-300 p-4">
      <ToastContainer />
      <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700 tracking-tight">Kayıt Ol</h1>
        {error && (
          <div className="mb-4 text-red-600 bg-red-100 border border-red-200 rounded px-4 py-2 text-sm animate-shake">{error}</div>
        )}
        {step === 0 ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Ad</label>
                <input
                  type="text"
                  name="firstName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
                  placeholder="Adınız"
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="given-name"
                  pattern="[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]*"
                  title="Sadece harfler girebilirsiniz"
                  onKeyPress={(e) => {
                    // Sadece harfler, Türkçe karakterler ve boşluk
                    if (!/[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
                  placeholder="Soyadınız"
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="family-name"
                  pattern="[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]*"
                  title="Sadece harfler girebilirsiniz"
                  onKeyPress={(e) => {
                    // Sadece harfler, Türkçe karakterler ve boşluk
                    if (!/[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Telefon Numarası</label>
              <input
                type="tel"
                name="telephone"
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
                placeholder="05xxxxxxxxx"
                value={form.telephone}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="tel"
                pattern="[0-9]*"
                title="Sadece sayılar girebilirsiniz"
                onKeyPress={(e) => {
                  // Sadece sayılar
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white pr-10"
                    placeholder="Şifreniz"
                    value={form.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.807 6.07 6.75 9.75 6.75 1.563 0 3.06-.362 4.396-1.02M6.25 6.25l11.5 11.5M9.75 9.75a3 3 0 1 0 4.5 4.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6.25 0c-2.036-3.807-6.07-6.75-9.75-6.75-1.563 0-3.06.362-4.396 1.02M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.807 6.07 6.75 9.75 6.75 1.563 0 3.06-.362 4.396-1.02" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Şifre Tekrar</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white pr-10"
                    placeholder="Şifrenizi tekrar girin"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.807 6.07 6.75 9.75 6.75 1.563 0 3.06-.362 4.396-1.02M6.25 6.25l11.5 11.5M9.75 9.75a3 3 0 1 0 4.5 4.5" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6.25 0c-2.036-3.807-6.07-6.75-9.75-6.75-1.563 0-3.06.362-4.396 1.02M3.98 8.223A10.477 10.477 0 0 0 2.25 12c2.036 3.807 6.07 6.75 9.75 6.75 1.563 0 3.06-.362 4.396-1.02" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
            </button>
            <div className="flex justify-between text-sm mt-2">
              <Link to="/login" className="text-blue-600 hover:underline">Giriş Yap</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                <strong>{form.telephone}</strong> numarasına SMS doğrulama kodu gönderildi.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Kod gelmedi mi? Aşağıdaki butonu kullanarak tekrar gönderebilirsiniz.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">SMS Doğrulama Kodu</label>
              <input
                type="text"
                name="verifyCode"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
                placeholder="6 haneli doğrulama kodunu girin"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={isSubmitting}
                autoComplete="one-time-code"
                maxLength="6"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting || isResending}
            >
              {isSubmitting ? 'Doğrulanıyor...' : 'Doğrula ve Kayıt Ol'}
            </button>
            
            {/* Tekrar SMS Kodu Gönder Butonu */}
            <button
              type="button"
              onClick={handleResendSms}
              className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting || isResending}
            >
              {isResending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SMS Gönderiliyor...
                </>
              ) : (
                <>
                  📲 Tekrar SMS Kodu Gönder
                </>
              )}
            </button>
            
            <button
              type="button"
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg shadow-md transition duration-150"
              onClick={() => setStep(0)}
              disabled={isSubmitting || isResending}
            >
              ← Geri Dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register; 