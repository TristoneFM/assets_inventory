'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import PageBanner from '@/app/components/PageBanner';

export default function CrearActivoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    numeroActivo: '',
    numeroEtiqueta: '',
    tipo: '',
    marca: '',
    modelo: '',
    serie: '',
    ubicacion: '',
    planta: '',
    nacionalExtranjero: '',
    numeroPedimento: '',
    fechaAlta: new Date().toISOString().split('T')[0], // Default to today
    numeroCapex: '',
    ordenInterna: '',
    observaciones: '',
    statusCipFa: '',
  });
  const [assetPictures, setAssetPictures] = useState([]);
  const [pedimentoFile, setPedimentoFile] = useState(null);
  const [facturaFile, setFacturaFile] = useState(null);
  const [archivoAltaFile, setArchivoAltaFile] = useState(null);
  const [extraFiles, setExtraFiles] = useState([]);

  // Dropdown data from database
  const [plantas, setPlantas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Get logged-in user from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Error getting user data:', err);
    }
  }, []);

  // Fetch dropdown options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [plantasRes, tiposRes, ubicacionesRes] = await Promise.all([
          fetch('/api/configuration/plantas'),
          fetch('/api/configuration/tipos'),
          fetch('/api/configuration/ubicaciones'),
        ]);

        const plantasData = await plantasRes.json();
        const tiposData = await tiposRes.json();
        const ubicacionesData = await ubicacionesRes.json();

        if (plantasData.success) setPlantas(plantasData.data || []);
        if (tiposData.success) setTipos(tiposData.data || []);
        if (ubicacionesData.success) setUbicaciones(ubicacionesData.data || []);
      } catch (err) {
        console.error('Error fetching options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear errors when user types
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleAssetPicturesChange = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setAssetPictures(prev => [...prev, ...imageFiles]);
    }
    // Reset input
    event.target.value = '';
  };

  const handleRemovePicture = (index) => {
    setAssetPictures(prev => prev.filter((_, i) => i !== index));
  };

  const handlePedimentoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPedimentoFile(file);
    } else {
      setError('Por favor seleccione un archivo PDF para el pedimento');
    }
    event.target.value = '';
  };

  const handleFacturaChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFacturaFile(file);
    } else {
      setError('Por favor seleccione un archivo PDF para la factura');
    }
    event.target.value = '';
  };

  const handleRemovePedimento = () => {
    setPedimentoFile(null);
  };

  const handleRemoveFactura = () => {
    setFacturaFile(null);
  };

  const handleArchivoAltaChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setArchivoAltaFile(file);
    } else {
      setError('Por favor seleccione un archivo PDF para el archivo de alta');
    }
    event.target.value = '';
  };

  const handleRemoveArchivoAlta = () => {
    setArchivoAltaFile(null);
  };

  const handleExtraFilesChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setExtraFiles(prev => [...prev, ...files]);
    }
    event.target.value = '';
  };

  const handleRemoveExtraFile = (index) => {
    setExtraFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Create FormData to handle file uploads
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      // Add userAlta from logged-in user
      const userAlta = currentUser?.emp_alias || currentUser?.username || 'unknown';
      submitData.append('userAlta', userAlta);

      // Add asset pictures
      assetPictures.forEach((picture, index) => {
        submitData.append(`assetPictures`, picture);
      });

      // Add pedimento file if exists
      if (pedimentoFile) {
        submitData.append('pedimento', pedimentoFile);
      }

      // Add factura file if exists
      if (facturaFile) {
        submitData.append('factura', facturaFile);
      }

      // Add archivo de alta if exists
      if (archivoAltaFile) {
        submitData.append('archivoAlta', archivoAltaFile);
      }

      // Add extra files
      extraFiles.forEach((file) => {
        submitData.append('extraFiles', file);
      });

      // TODO: Replace with actual API call
      const response = await fetch('/api/activos', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Error al crear el activo');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCreatedAssetId(data.data?.id);
      setLoading(false);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form
      setFormData({
        numeroActivo: '',
        numeroEtiqueta: '',
        tipo: '',
        marca: '',
        modelo: '',
        serie: '',
        ubicacion: '',
        planta: '',
        nacionalExtranjero: '',
        numeroPedimento: '',
        fechaAlta: new Date().toISOString().split('T')[0],
        numeroCapex: '',
        ordenInterna: '',
        observaciones: '',
        statusCipFa: '',
      });
      setAssetPictures([]);
      setPedimentoFile(null);
      setFacturaFile(null);
      setArchivoAltaFile(null);
      setExtraFiles([]);

      // Optionally redirect after a delay
      // setTimeout(() => router.push('/buscar-activos'), 2000);
    } catch (err) {
      console.error('Error creating asset:', err);
      setError('Error de conexión. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageBanner
        title="Crear Nuevo Activo"
        subtitle=""
        icon={<AddIcon sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)"
      />

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Activo creado exitosamente {createdAssetId && `(ID: ${createdAssetId})`}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Número Activo"
                  name="numeroActivo"
                  value={formData.numeroActivo}
                  onChange={handleChange('numeroActivo')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Número Etiqueta"
                  name="numeroEtiqueta"
                  value={formData.numeroEtiqueta}
                  onChange={handleChange('numeroEtiqueta')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange('tipo')}
                  variant="outlined"
                  disabled={loadingOptions}
                >
                  <MenuItem value="">Seleccione un tipo</MenuItem>
                  {tipos.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange('marca')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Modelo"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange('modelo')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Serie"
                  name="serie"
                  value={formData.serie}
                  onChange={handleChange('serie')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Ubicación"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange('ubicacion')}
                  variant="outlined"
                  disabled={loadingOptions}
                >
                  <MenuItem value="">Seleccione una ubicación</MenuItem>
                  {ubicaciones.map((ubicacion) => (
                    <MenuItem key={ubicacion.id} value={ubicacion.id}>
                      {ubicacion.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Planta"
                  name="planta"
                  value={formData.planta}
                  onChange={handleChange('planta')}
                  variant="outlined"
                  disabled={loadingOptions}
                >
                  <MenuItem value="">Seleccione una planta</MenuItem>
                  {plantas.map((planta) => (
                    <MenuItem key={planta.id} value={planta.id}>
                      {planta.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Nacional/Extranjero"
                  name="nacionalExtranjero"
                  value={formData.nacionalExtranjero}
                  onChange={handleChange('nacionalExtranjero')}
                  variant="outlined"
                >
                  <MenuItem value="">Seleccione una opción</MenuItem>
                  <MenuItem value="nacional">Nacional</MenuItem>
                  <MenuItem value="extranjero">Extranjero</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número Pedimento"
                  name="numeroPedimento"
                  value={formData.numeroPedimento}
                  onChange={handleChange('numeroPedimento')}
                  variant="outlined"
                  disabled={formData.nacionalExtranjero === 'nacional'}
                  helperText={
                    formData.nacionalExtranjero === 'nacional'
                      ? 'Solo aplica para activos extranjeros'
                      : ''
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha de Alta"
                  name="fechaAlta"
                  value={formData.fechaAlta}
                  onChange={handleChange('fechaAlta')}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Capex"
                  name="numeroCapex"
                  value={formData.numeroCapex}
                  onChange={handleChange('numeroCapex')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Orden Interna"
                  name="ordenInterna"
                  value={formData.ordenInterna}
                  onChange={handleChange('ordenInterna')}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status CIP/FA"
                  name="statusCipFa"
                  value={formData.statusCipFa}
                  onChange={handleChange('statusCipFa')}
                  variant="outlined"
                >
                  <MenuItem value="">Seleccione una opción</MenuItem>
                  <MenuItem value="CIP">CIP</MenuItem>
                  <MenuItem value="FA">FA</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange('observaciones')}
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>

            </Grid>

            <Divider sx={{ my: 4 }} />

            {/* Asset Pictures Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Fotos del Activo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puede subir múltiples imágenes del activo (JPG, PNG)
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                sx={{ mb: 2 }}
              >
                Agregar Fotos
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleAssetPicturesChange}
                />
              </Button>

              {assetPictures.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {assetPictures.map((picture, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box
                        sx={{
                          position: 'relative',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          component="img"
                          src={URL.createObjectURL(picture)}
                          alt={`Preview ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '50%',
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePicture(index)}
                            sx={{ color: 'white' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Box sx={{ p: 1, backgroundColor: 'background.paper' }}>
                          <Typography variant="caption" noWrap>
                            {picture.name}
                          </Typography>
                          <Chip
                            label={`${(picture.size / 1024).toFixed(2)} KB`}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Pedimento PDF Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Pedimento (PDF)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {formData.nacionalExtranjero === 'extranjero' 
                  ? 'Suba el archivo PDF del pedimento aduanal (Requerido para activos extranjeros)'
                  : 'Suba el archivo PDF del pedimento aduanal (Opcional)'}
              </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PdfIcon />}
                  >
                    Seleccionar PDF de Pedimento
                    <input
                      type="file"
                      hidden
                      accept=".pdf,application/pdf"
                      onChange={handlePedimentoChange}
                    />
                  </Button>
                </Box>

                {pedimentoFile && (
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon color="error" />
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {pedimentoFile.name}
                      </Typography>
                      <Chip
                        label={`${(pedimentoFile.size / 1024).toFixed(2)} KB`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <IconButton
                      color="error"
                      onClick={handleRemovePedimento}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>

            <Divider sx={{ my: 4 }} />

            {/* Factura PDF Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Factura (PDF)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Suba el archivo PDF de la factura del activo (Opcional)
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PdfIcon />}
                >
                  Seleccionar PDF de Factura
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={handleFacturaChange}
                  />
                </Button>
              </Box>

              {facturaFile && (
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'action.hover',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon color="error" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {facturaFile.name}
                    </Typography>
                    <Chip
                      label={`${(facturaFile.size / 1024).toFixed(2)} KB`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <IconButton
                    color="error"
                    onClick={handleRemoveFactura}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Archivo de Alta PDF Section - OPTIONAL */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Archivo de Alta (PDF)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Suba el archivo PDF del documento de alta del activo (Opcional)
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PdfIcon />}
                >
                  Seleccionar PDF de Alta
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={handleArchivoAltaChange}
                  />
                </Button>
              </Box>

              {archivoAltaFile && (
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'action.hover',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon color="error" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {archivoAltaFile.name}
                    </Typography>
                    <Chip
                      label={`${(archivoAltaFile.size / 1024).toFixed(2)} KB`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <IconButton
                    color="error"
                    onClick={handleRemoveArchivoAlta}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Extra Files Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Archivos Extra
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puede adjuntar archivos adicionales de cualquier tipo (Opcional)
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
                sx={{ mb: 2 }}
              >
                Agregar Archivos
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleExtraFilesChange}
                />
              </Button>

              {extraFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {extraFiles.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'action.hover',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachFileIcon color="primary" />
                        <Typography variant="body1" sx={{ fontWeight: 500 }} noWrap>
                          {file.name}
                        </Typography>
                        <Chip
                          label={`${(file.size / 1024).toFixed(2)} KB`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveExtraFile(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
                sx={{
                  minWidth: 150,
                }}
              >
                {loading ? 'Guardando...' : 'Guardar Activo'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

