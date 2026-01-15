'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  PhotoLibrary as PhotoIcon,
} from '@mui/icons-material';
import PageBanner from '@/app/components/PageBanner';

export default function EditarActivoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
    fechaAlta: '',
    numeroCapex: '',
    ordenInterna: '',
    observaciones: '',
    statusCipFa: '',
  });

  // New files to upload
  const [newPictures, setNewPictures] = useState([]);
  const [newPedimento, setNewPedimento] = useState(null);
  const [newFactura, setNewFactura] = useState(null);

  // Existing files from server
  const [existingFiles, setExistingFiles] = useState({
    pictures: [],
    pedimento: null,
    factura: null,
  });

  // Files marked for deletion
  const [deletedFiles, setDeletedFiles] = useState({
    pictures: [],
    pedimento: false,
    factura: false,
  });

  // Dropdown data from database
  const [plantas, setPlantas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // File viewer modal
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState('');
  const [fileViewerType, setFileViewerType] = useState('image');
  const [fileViewerTitle, setFileViewerTitle] = useState('');

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

  // Fetch dropdown options
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

  // Fetch asset data and files
  useEffect(() => {
    if (!assetId) {
      setError('ID de activo no proporcionado');
      setLoading(false);
      return;
    }

    const fetchAsset = async () => {
      try {
        // Fetch asset data
        const assetRes = await fetch(`/api/activos/${assetId}`);
        const assetData = await assetRes.json();

        if (!assetData.success) {
          setError(assetData.message || 'Error al cargar el activo');
          setLoading(false);
          return;
        }

        const asset = assetData.data;

        // Check if asset is "baja" - cannot edit
        if (asset.status === 'baja') {
          setError('No se puede editar un activo dado de baja. Este activo fue dado de baja y no puede ser modificado.');
          setLoading(false);
          return;
        }

        // Format date for input
        let fechaAlta = '';
        if (asset.fechaAlta) {
          const date = new Date(asset.fechaAlta);
          fechaAlta = date.toISOString().split('T')[0];
        }

        setFormData({
          numeroActivo: asset.numeroActivo || '',
          numeroEtiqueta: asset.numeroEtiqueta || '',
          tipo: asset.tipo_id || '',
          marca: asset.marca || '',
          modelo: asset.modelo || '',
          serie: asset.serie || '',
          ubicacion: asset.ubicacion_id || '',
          planta: asset.planta_id || '',
          nacionalExtranjero: asset.nacionalExtranjero || '',
          numeroPedimento: asset.numeroPedimento || '',
          fechaAlta: fechaAlta,
          numeroCapex: asset.numeroCapex || '',
          ordenInterna: asset.ordenInterna || '',
          observaciones: asset.observaciones || '',
          statusCipFa: asset.statusCipFa || '',
        });

        // Fetch files
        const filesRes = await fetch(`/api/activos/${assetId}/files`);
        const filesData = await filesRes.json();

        if (filesData.success) {
          setExistingFiles(filesData.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching asset:', err);
        setError('Error de conexión al cargar el activo');
        setLoading(false);
      }
    };

    fetchAsset();
  }, [assetId]);

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    if (error) setError('');
    if (success) setSuccess(false);
  };

  // New pictures handling
  const handleNewPicturesChange = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setNewPictures(prev => [...prev, ...imageFiles]);
    }
    event.target.value = '';
  };

  const handleRemoveNewPicture = (index) => {
    setNewPictures(prev => prev.filter((_, i) => i !== index));
  };

  // Delete existing picture
  const handleDeleteExistingPicture = (picUrl) => {
    setDeletedFiles(prev => ({
      ...prev,
      pictures: [...prev.pictures, picUrl],
    }));
  };

  // Restore deleted picture
  const handleRestoreExistingPicture = (picUrl) => {
    setDeletedFiles(prev => ({
      ...prev,
      pictures: prev.pictures.filter(p => p !== picUrl),
    }));
  };

  // Pedimento handling
  const handleNewPedimentoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setNewPedimento(file);
    } else {
      setError('Por favor seleccione un archivo PDF');
    }
    event.target.value = '';
  };

  const handleRemoveNewPedimento = () => {
    setNewPedimento(null);
  };

  const handleDeleteExistingPedimento = () => {
    setDeletedFiles(prev => ({ ...prev, pedimento: true }));
  };

  const handleRestoreExistingPedimento = () => {
    setDeletedFiles(prev => ({ ...prev, pedimento: false }));
  };

  // Factura handling
  const handleNewFacturaChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setNewFactura(file);
    } else {
      setError('Por favor seleccione un archivo PDF');
    }
    event.target.value = '';
  };

  const handleRemoveNewFactura = () => {
    setNewFactura(null);
  };

  const handleDeleteExistingFactura = () => {
    setDeletedFiles(prev => ({ ...prev, factura: true }));
  };

  const handleRestoreExistingFactura = () => {
    setDeletedFiles(prev => ({ ...prev, factura: false }));
  };

  // File viewer
  const openFileViewer = (url, type, title) => {
    setFileViewerUrl(url);
    setFileViewerType(type);
    setFileViewerTitle(title);
    setFileViewerOpen(true);
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      // First update the asset data
      const updateRes = await fetch(`/api/activos/${assetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numeroActivo: formData.numeroActivo,
          numeroEtiqueta: formData.numeroEtiqueta,
          tipo_id: formData.tipo,
          marca: formData.marca,
          modelo: formData.modelo,
          serie: formData.serie,
          ubicacion_id: formData.ubicacion,
          planta_id: formData.planta,
          nacionalExtranjero: formData.nacionalExtranjero,
          numeroPedimento: formData.numeroPedimento,
          numeroCapex: formData.numeroCapex,
          ordenInterna: formData.ordenInterna,
          observaciones: formData.observaciones,
          statusCipFa: formData.statusCipFa,
        }),
      });

      const updateData = await updateRes.json();

      if (!updateData.success) {
        setError(updateData.message || 'Error al actualizar el activo');
        setSaving(false);
        return;
      }

      // Upload new files if any
      if (newPictures.length > 0 || newPedimento || newFactura) {
        const uploadData = new FormData();
        uploadData.append('assetId', assetId);
        uploadData.append('numeroEtiqueta', formData.numeroEtiqueta);

        newPictures.forEach((picture) => {
          uploadData.append('assetPictures', picture);
        });

        if (newPedimento) {
          uploadData.append('pedimento', newPedimento);
        }

        if (newFactura) {
          uploadData.append('factura', newFactura);
        }

        // Upload files
        await fetch(`/api/activos/${assetId}/upload`, {
          method: 'POST',
          body: uploadData,
        });
      }

      // Delete files marked for deletion
      if (deletedFiles.pictures.length > 0 || deletedFiles.pedimento || deletedFiles.factura) {
        await fetch(`/api/activos/${assetId}/files`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deletedFiles),
        });
      }

      setSuccess(true);
      setSaving(false);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Refresh files
      const filesRes = await fetch(`/api/activos/${assetId}/files`);
      const filesData = await filesRes.json();
      if (filesData.success) {
        setExistingFiles(filesData.data);
      }

      // Clear new files and deleted files
      setNewPictures([]);
      setNewPedimento(null);
      setNewFactura(null);
      setDeletedFiles({ pictures: [], pedimento: false, factura: false });

    } catch (err) {
      console.error('Error updating asset:', err);
      setError('Error de conexión. Por favor, intente nuevamente.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get non-deleted existing pictures
  const visibleExistingPictures = existingFiles.pictures.filter(
    pic => !deletedFiles.pictures.includes(pic)
  );

  return (
    <Box>
      <PageBanner
        title="Editar Activo"
        subtitle=""
        icon={<EditIcon sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%)"
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
                Activo actualizado exitosamente
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
                  type="date"
                  label="Fecha de Alta"
                  name="fechaAlta"
                  value={formData.fechaAlta}
                  onChange={handleChange('fechaAlta')}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled
                  helperText="La fecha de alta no se puede modificar"
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

            {/* Pictures Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Fotos del Activo
              </Typography>

              {/* Existing Pictures */}
              {existingFiles.pictures.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Fotos existentes:
                  </Typography>
                  <Grid container spacing={2}>
                    {existingFiles.pictures.map((pic, index) => {
                      const isDeleted = deletedFiles.pictures.includes(pic);
                      return (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Box
                            sx={{
                              position: 'relative',
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: isDeleted ? '2px solid #f44336' : '1px solid #e0e0e0',
                              opacity: isDeleted ? 0.5 : 1,
                            }}
                          >
                            <Box
                              component="img"
                              src={pic}
                              alt={`Foto ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: 120,
                                objectFit: 'cover',
                                cursor: 'pointer',
                              }}
                              onClick={() => openFileViewer(pic, 'image', `Foto ${index + 1}`)}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                display: 'flex',
                                gap: 0.5,
                              }}
                            >
                              {isDeleted ? (
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestoreExistingPicture(pic)}
                                  sx={{
                                    backgroundColor: 'rgba(76,175,80,0.9)',
                                    '&:hover': { backgroundColor: 'rgba(76,175,80,1)' },
                                    color: 'white',
                                  }}
                                  title="Restaurar"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteExistingPicture(pic)}
                                  sx={{
                                    backgroundColor: 'rgba(244,67,54,0.9)',
                                    '&:hover': { backgroundColor: 'rgba(244,67,54,1)' },
                                    color: 'white',
                                  }}
                                  title="Eliminar"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            {isDeleted && (
                              <Chip
                                label="Marcado para eliminar"
                                size="small"
                                color="error"
                                sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  fontSize: '0.65rem',
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {/* New Pictures */}
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
                  onChange={handleNewPicturesChange}
                />
              </Button>

              {newPictures.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    Nuevas fotos a subir:
                  </Typography>
                  <Grid container spacing={2}>
                    {newPictures.map((picture, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box
                          sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '2px solid #4caf50',
                          }}
                        >
                          <Box
                            component="img"
                            src={URL.createObjectURL(picture)}
                            alt={`Nueva ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNewPicture(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(244,67,54,0.9)',
                              '&:hover': { backgroundColor: 'rgba(244,67,54,1)' },
                              color: 'white',
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <Chip
                            label="Nueva"
                            size="small"
                            color="success"
                            sx={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              fontSize: '0.65rem',
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Pedimento Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Pedimento (PDF)
              </Typography>

              {/* Existing Pedimento */}
              {existingFiles.pedimento && !deletedFiles.pedimento && (
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon color="error" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Pedimento existente
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => openFileViewer(existingFiles.pedimento, 'pdf', 'Pedimento')}
                      title="Ver"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={handleDeleteExistingPedimento}
                      title="Eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {existingFiles.pedimento && deletedFiles.pedimento && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={handleRestoreExistingPedimento}>
                      Restaurar
                    </Button>
                  }
                >
                  Pedimento marcado para eliminar
                </Alert>
              )}

              {/* New Pedimento */}
              {!newPedimento ? (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PdfIcon />}
                >
                  {existingFiles.pedimento ? 'Reemplazar Pedimento' : 'Subir Pedimento'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={handleNewPedimentoChange}
                  />
                </Button>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid #4caf50',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#e8f5e9',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon color="error" />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {newPedimento.name}
                      </Typography>
                      <Chip label="Nuevo" size="small" color="success" />
                    </Box>
                  </Box>
                  <IconButton color="error" onClick={handleRemoveNewPedimento}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Factura Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Factura (PDF)
              </Typography>

              {/* Existing Factura */}
              {existingFiles.factura && !deletedFiles.factura && (
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon color="error" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Factura existente
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      color="primary"
                      onClick={() => openFileViewer(existingFiles.factura, 'pdf', 'Factura')}
                      title="Ver"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={handleDeleteExistingFactura}
                      title="Eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {existingFiles.factura && deletedFiles.factura && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={handleRestoreExistingFactura}>
                      Restaurar
                    </Button>
                  }
                >
                  Factura marcada para eliminar
                </Alert>
              )}

              {/* New Factura */}
              {!newFactura ? (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PdfIcon />}
                >
                  {existingFiles.factura ? 'Reemplazar Factura' : 'Subir Factura'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,application/pdf"
                    onChange={handleNewFacturaChange}
                  />
                </Button>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    border: '2px solid #4caf50',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#e8f5e9',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon color="error" />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {newFactura.name}
                      </Typography>
                      <Chip label="Nueva" size="small" color="success" />
                    </Box>
                  </Box>
                  <IconButton color="error" onClick={handleRemoveNewFactura}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/buscar-activos')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
                sx={{
                  minWidth: 150,
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      <Dialog
        open={fileViewerOpen}
        onClose={closeFileViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh', maxHeight: '90vh' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {fileViewerType === 'pdf' ? <PdfIcon color="error" /> : <PhotoIcon color="primary" />}
            <Typography variant="h6">{fileViewerTitle}</Typography>
          </Box>
          <IconButton onClick={closeFileViewer}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: fileViewerType === 'pdf' ? '#525659' : '#f5f5f5',
          }}
        >
          {fileViewerType === 'pdf' ? (
            <iframe
              src={fileViewerUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={fileViewerTitle}
            />
          ) : (
            <Box
              component="img"
              src={fileViewerUrl}
              alt={fileViewerTitle}
              sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

