'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import PageBanner from '@/app/components/PageBanner';

export default function ConfigurationPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [plantas, setPlantas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [tipos, setTipos] = useState([]);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'plantas', 'ubicaciones', 'tipos'
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plantasRes, ubicacionesRes, tiposRes] = await Promise.all([
        fetch('/api/configuration/plantas'),
        fetch('/api/configuration/ubicaciones'),
        fetch('/api/configuration/tipos'),
      ]);

      const plantasData = await plantasRes.json();
      const ubicacionesData = await ubicacionesRes.json();
      const tiposData = await tiposRes.json();

      if (plantasData.success) setPlantas(plantasData.data || []);
      if (ubicacionesData.success) setUbicaciones(ubicacionesData.data || []);
      if (tiposData.success) setTipos(tiposData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (type, mode = 'add', item = null) => {
    setDialogType(type);
    setDialogMode(mode);
    if (mode === 'edit' && item) {
      setEditingId(item.id);
      setFormData({
        nombre: item.nombre || '',
        descripcion: item.descripcion || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        descripcion: '',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ nombre: '', descripcion: '' });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleFormChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = `/api/configuration/${dialogType}`;
      const method = dialogMode === 'add' ? 'POST' : 'PUT';
      const body = dialogMode === 'add' 
        ? formData 
        : { ...formData, id: editingId };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Error al guardar');
        setLoading(false);
        return;
      }

      setSuccess(dialogMode === 'add' ? 'Agregado exitosamente' : 'Actualizado exitosamente');
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Error saving:', err);
      setError('Error de conexión');
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/configuration/${type}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Error al eliminar');
        setLoading(false);
        return;
      }

      setSuccess('Eliminado exitosamente');
      fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
      setError('Error de conexión');
      setLoading(false);
    }
  };

  const renderTable = (data, type, label) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No hay {label} registrados
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.nombre}</TableCell>
                <TableCell>{item.descripcion || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(type, 'edit', item)}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(type, item.id)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <PageBanner
        title="Configuración"
        subtitle="Gestión de Plantas, Ubicaciones y Tipos"
        icon={<SettingsIcon sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)"
      />

      {(error || success) && (
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ mb: 3 }}
          onClose={() => {
            setError('');
            setSuccess('');
          }}
        >
          {error || success}
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Plantas" />
              <Tab label="Ubicaciones" />
              <Tab label="Tipos" />
            </Tabs>
          </Box>

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const types = ['plantas', 'ubicaciones', 'tipos'];
                handleOpenDialog(types[tabValue], 'add');
              }}
            >
              Agregar {tabValue === 0 ? 'Planta' : tabValue === 1 ? 'Ubicación' : 'Tipo'}
            </Button>
          </Box>

          {loading && !openDialog ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {tabValue === 0 && renderTable(plantas, 'plantas', 'plantas')}
              {tabValue === 1 && renderTable(ubicaciones, 'ubicaciones', 'ubicaciones')}
              {tabValue === 2 && renderTable(tipos, 'tipos', 'tipos')}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Agregar' : 'Editar'}{' '}
          {dialogType === 'plantas' ? 'Planta' : dialogType === 'ubicaciones' ? 'Ubicación' : 'Tipo'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            required
            variant="outlined"
            value={formData.nombre}
            onChange={handleFormChange('nombre')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.descripcion}
            onChange={handleFormChange('descripcion')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

