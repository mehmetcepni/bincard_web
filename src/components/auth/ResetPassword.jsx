import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, Sms } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AuthService from '../../services/auth.service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      verificationCode: Yup.string()
        .required('Doğrulama kodu gereklidir'),
      newPassword: Yup.string()
        .min(6, 'Şifre en az 6 karakter olmalıdır')
        .required('Yeni şifre gereklidir'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Şifreler eşleşmiyor')
        .required('Şifre tekrarı gereklidir'),
    }),
    onSubmit: async (values) => {
      try {
        const telephone = location.state?.telephone;
        if (!telephone) {
          throw new Error('Telefon numarası bulunamadı');
        }

        // 1. Adım: Doğrulama kodunu kontrol et ve resetToken al
        const verifyResponse = await AuthService.passwordVerifyCode({
          code: values.verificationCode,
          phone: telephone
        });
        // Gelen mesajı resetToken olarak al
        let resetToken = verifyResponse.resetToken;
        if (!resetToken && typeof verifyResponse.message === 'string' && /^[0-9a-fA-F\-]{36}$/.test(verifyResponse.message)) {
          resetToken = verifyResponse.message;
        }
        if (!verifyResponse.success || !resetToken) {
          throw new Error(verifyResponse.message || 'Doğrulama kodu hatalı veya süresi dolmuş.');
        }

        // 2. Adım: Yeni şifreyi belirle
        const resetResponse = await AuthService.passwordReset({
          resetToken: resetToken,
          newPassword: values.newPassword
        });
        // Eğer resetResponse bir string ise (ör. UUID), hata olarak gösterme
        if (typeof resetResponse === 'string' && /^[0-9a-fA-F\-]{36}$/.test(resetResponse)) {
          throw new Error('Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar şifre sıfırlama isteği başlatın.');
        }
        if (resetResponse.success) {
          setError('');
          toast.success('Şifreniz başarıyla değiştirildi!', {
            position: "top-right",
            autoClose: 2000,
            onClose: () => {
              navigate('/login', {
                state: { 
                  message: 'Şifreniz başarıyla değiştirildi! Lütfen yeni şifrenizle giriş yapın.',
                  type: 'success'
                }
              });
            }
          });
        } else {
          throw new Error(resetResponse.message || 'Şifre sıfırlama işlemi başarısız oldu.');
        }
      } catch (err) {
        console.error('Error:', err);
        const errorMessage = err.message || 'Şifre sıfırlama işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin.';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000
        });
      }
    },
  });

  const handleResendCode = async () => {
    try {
      const telephone = location.state?.telephone;
      if (!telephone) {
        throw new Error('Telefon numarası bulunamadı');
      }

      const response = await AuthService.forgotPassword(telephone);
      if (response.success) {
        setError('');
        toast.info('Doğrulama kodu tekrar gönderildi!', {
          position: "top-right",
          autoClose: 5000
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'SMS kodu gönderilirken bir hata oluştu';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  if (!location.state?.telephone) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
          padding: { xs: 2, sm: 4 }
        }}
      >
        <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center' }}>
          <Paper
            elevation={10}
            sx={{
              width: '100%',
              padding: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              Geçersiz sayfa erişimi. Lütfen şifre sıfırlama işlemini baştan başlatın.
            </Alert>
            <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  height: 48,
                  background: 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0 30%, #42a5f5 90%)',
                  }
                }}
              >
                Şifre Sıfırlama Sayfasına Git
              </Button>
            </Link>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
        padding: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center' }}>
        <Paper
          elevation={10}
          sx={{
            width: '100%',
            padding: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#1976d2',
                mb: 1
              }}
            >
              BinCard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Yeni Şifre Oluştur
            </Typography>
          </Box>

          {location.state?.message && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {location.state.message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              id="verificationCode"
              name="verificationCode"
              label="Doğrulama Kodu"
              value={formik.values.verificationCode}
              onChange={formik.handleChange}
              error={formik.touched.verificationCode && Boolean(formik.errors.verificationCode)}
              helperText={formik.touched.verificationCode && formik.errors.verificationCode}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Sms color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="text"
              onClick={handleResendCode}
              sx={{
                mb: 3,
                color: '#1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                }
              }}
            >
              Kodu Tekrar Gönder
            </Button>

            <TextField
              fullWidth
              margin="normal"
              id="newPassword"
              name="newPassword"
              label="Yeni Şifre"
              type={showPassword ? 'text' : 'password'}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
              helperText={formik.touched.newPassword && formik.errors.newPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              margin="normal"
              id="confirmPassword"
              name="confirmPassword"
              label="Yeni Şifre Tekrarı"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mb: 3,
                height: 48,
                background: 'linear-gradient(45deg, #1976d2 30%, #64b5f6 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #42a5f5 90%)',
                }
              }}
            >
              Şifreyi Değiştir
            </Button>

            <Grid container justifyContent="center">
              <Grid item>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button
                    variant="text"
                    sx={{
                      color: '#1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      }
                    }}
                  >
                    Giriş sayfasına dön
                  </Button>
                </Link>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
      <ToastContainer />
    </Box>
  );
};

export default ResetPassword; 