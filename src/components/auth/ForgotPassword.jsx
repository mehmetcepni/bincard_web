import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../../services/auth.service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [telephone, setTelephone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validate = () => {
    if (!/^0[0-9]{10}$/.test(telephone)) return 'Telefon numarası 0 ile başlamalı ve 11 haneli olmalı';
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
      const response = await AuthService.forgotPassword(telephone);
      if (response.success) {
        setError('');
        toast.success('Şifre sıfırlama bağlantısı gönderildi!', {
          position: 'top-right',
          autoClose: 2000,
          onClose: () => {
            navigate('/reset-password', {
              state: {
                telephone,
                message: 'Lütfen telefonunuza gönderilen kodu giriniz.'
              }
            });
          }
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Şifre sıfırlama işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin.';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-300 p-4">
      <ToastContainer />
      <div className="w-full max-w-md bg-white/90 rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-700 tracking-tight">Şifre Sıfırlama</h1>
        <p className="text-center text-gray-600 mb-4">Şifrenizi sıfırlamak için telefon numaranızı girin. Size bir doğrulama kodu göndereceğiz.</p>
        {error && (
          <div className="mb-4 text-red-600 bg-red-100 border border-red-200 rounded px-4 py-2 text-sm animate-shake">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Telefon Numarası</label>
            <input
              type="tel"
              name="telephone"
              maxLength={11}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base bg-white"
              placeholder="05xxxxxxxxx"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
          </button>
          <div className="flex justify-center text-sm mt-2">
            <Link to="/login" className="text-blue-600 hover:underline">Giriş sayfasına dön</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 