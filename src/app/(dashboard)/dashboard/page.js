'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Assignment,
  CheckCircleOutline,
  Schedule,
} from '@mui/icons-material';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Get current user from localStorage
  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.emp_id) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    getUserData();
    window.addEventListener('storage', getUserData);
    return () => window.removeEventListener('storage', getUserData);
  }, []);

  // Carousel slides data
  const carouselSlides = [
    {
      title: `Bienvenido, ${currentUser?.emp_alias || currentUser?.name || 'Usuario'}`,
      subtitle: 'Sistema de Gestión de Inventario',
      description: '',
      icon: <Assignment sx={{ fontSize: 60 }} />,
      color: '#1976d2',
      bgGradient: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
    },
  ];

  // Auto-rotate carousel
  useEffect(() => {
    if (carouselSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [carouselSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleSlideClick = (index) => {
    setCurrentSlide(index);
  };

  const quickActions = [
    {
      title: 'Crear Nuevo Item',
      description: 'Agregar un nuevo elemento al inventario',
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      path: '/create-pic',
    },
    {
      title: 'Mis Items',
      description: 'Ver y gestionar mis items creados',
      icon: <FolderOpen sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      path: '/my-pics',
    },
    {
      title: 'Aprobar / Rechazar',
      description: 'Revisar items pendientes',
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      path: '/approve-reject',
    },
    {
      title: 'Consultar Items',
      description: 'Buscar y consultar todos los items',
      icon: <Search sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      path: '/query-pics',
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Carousel Banner */}
      <Box sx={{ width: '100%', mb: 4, position: 'relative' }}>
        <Paper
          elevation={4}
          sx={{
            position: 'relative',
            height: { xs: 180, sm: 220 },
            borderRadius: 3,
            overflow: 'hidden',
            background: carouselSlides[currentSlide]?.bgGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'all 0.5s ease',
          }}
        >
          {/* Previous Button */}
          {carouselSlides.length > 1 && (
            <IconButton
              onClick={handlePrevSlide}
              sx={{
                position: 'absolute',
                left: 16,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                zIndex: 2,
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          {/* Slide Content */}
          <Box sx={{ textAlign: 'center', px: 4, py: 2, maxWidth: '800px', zIndex: 1 }}>
            <Box sx={{ mb: 1.5, opacity: 0.9 }}>
              {React.cloneElement(carouselSlides[currentSlide]?.icon, { sx: { fontSize: { xs: 50, sm: 60 } } })}
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {carouselSlides[currentSlide]?.title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                mb: 1,
                opacity: 0.95,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              {carouselSlides[currentSlide]?.subtitle}
            </Typography>
            {carouselSlides[currentSlide]?.description && (
              <Typography
                variant="body1"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                }}
              >
                {carouselSlides[currentSlide]?.description}
              </Typography>
            )}
          </Box>

          {/* Next Button */}
          {carouselSlides.length > 1 && (
            <IconButton
              onClick={handleNextSlide}
              sx={{
                position: 'absolute',
                right: 16,
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                zIndex: 2,
              }}
            >
              <ChevronRight />
            </IconButton>
          )}

          {/* Dots Indicator */}
          {carouselSlides.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                zIndex: 2,
              }}
            >
              {carouselSlides.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => handleSlideClick(index)}
                  sx={{
                    width: currentSlide === index ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: currentSlide === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#1976d2', textAlign: 'center', width: '100%' }}>
        Acciones Rápidas
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center', maxWidth: '1200px' }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => router.push(action.path)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: action.color, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

