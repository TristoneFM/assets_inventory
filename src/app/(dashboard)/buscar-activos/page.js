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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  InputAdornment,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  FormControlLabel,
  Checkbox,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  LocalShipping as ShippingIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  PhotoLibrary as PhotoIcon,
  Download as DownloadIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import PageBanner from '@/app/components/PageBanner';

export default function BuscarActivosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activos, setActivos] = useState([]);
  const [filteredActivos, setFilteredActivos] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    tipo: '',
    planta: '',
    ubicacion: '',
    nacionalExtranjero: '',
    status: 'activo', // Default to show only active assets
    statusCipFa: '',
  });

  // Dropdown options
  const [tipos, setTipos] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);

  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState(null);
  const [assetFiles, setAssetFiles] = useState({ pictures: [], pedimento: null, factura: null });
  const [loadingFiles, setLoadingFiles] = useState(false);

  // File viewer modal
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileViewerUrl, setFileViewerUrl] = useState('');
  const [fileViewerType, setFileViewerType] = useState('image'); // 'image' or 'pdf'
  const [fileViewerTitle, setFileViewerTitle] = useState('');

  const openFileViewer = (url, type, title) => {
    setFileViewerUrl(url);
    setFileViewerType(type);
    setFileViewerTitle(title);
    setFileViewerOpen(true);
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setFileViewerUrl('');
    setFileViewerTitle('');
  };

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activoToDelete, setActivoToDelete] = useState(null);

  // Current logged-in user
  const [currentUser, setCurrentUser] = useState(null);

  // Column visibility
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    numeroActivo: true,
    numeroEtiqueta: true,
    tipo: true,
    marcaModelo: true,
    serie: false,
    ubicacion: true,
    planta: true,
    nacionalExtranjero: false,
    fechaAlta: false,
    userAlta: false,
    numeroCapex: false,
    ordenInterna: false,
    statusCipFa: false,
    status: true,
    acciones: true,
  });

  // Column definitions
  const columnDefinitions = [
    { key: 'numeroActivo', label: 'No. Activo' },
    { key: 'numeroEtiqueta', label: 'No. Etiqueta' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'marcaModelo', label: 'Marca / Modelo' },
    { key: 'serie', label: 'Serie' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'planta', label: 'Planta' },
    { key: 'nacionalExtranjero', label: 'Nacional/Extranjero' },
    { key: 'fechaAlta', label: 'Fecha Alta' },
    { key: 'userAlta', label: 'Usuario Alta' },
    { key: 'numeroCapex', label: 'No. Capex' },
    { key: 'ordenInterna', label: 'Orden Interna' },
    { key: 'statusCipFa', label: 'CIP/FA' },
    { key: 'status', label: 'Status' },
    { key: 'acciones', label: 'Acciones', alwaysVisible: true },
  ];

  const handleColumnMenuOpen = (event) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const showAllColumns = () => {
    const allVisible = {};
    columnDefinitions.forEach((col) => {
      allVisible[col.key] = true;
    });
    setVisibleColumns(allVisible);
  };

  const hideOptionalColumns = () => {
    setVisibleColumns({
      numeroActivo: true,
      numeroEtiqueta: true,
      tipo: true,
      marcaModelo: true,
      serie: false,
      ubicacion: true,
      planta: true,
      nacionalExtranjero: false,
      fechaAlta: false,
      userAlta: false,
      numeroCapex: false,
      ordenInterna: false,
      statusCipFa: false,
      status: true,
      acciones: true,
    });
  };

  useEffect(() => {
    fetchData();
    // Get logged-in user from localStorage
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Error getting user data:', err);
    }
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activos]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activosRes, tiposRes, plantasRes, ubicacionesRes] = await Promise.all([
        fetch('/api/activos'),
        fetch('/api/configuration/tipos'),
        fetch('/api/configuration/plantas'),
        fetch('/api/configuration/ubicaciones'),
      ]);

      const activosData = await activosRes.json();
      const tiposData = await tiposRes.json();
      const plantasData = await plantasRes.json();
      const ubicacionesData = await ubicacionesRes.json();

      if (activosData.success) {
        setActivos(activosData.data || []);
        setFilteredActivos(activosData.data || []);
      }
      if (tiposData.success) setTipos(tiposData.data || []);
      if (plantasData.success) setPlantas(plantasData.data || []);
      if (ubicacionesData.success) setUbicaciones(ubicacionesData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activos];

    // Search filter (searches in multiple fields)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (activo) =>
          activo.numeroActivo?.toLowerCase().includes(searchLower) ||
          activo.numeroEtiqueta?.toLowerCase().includes(searchLower) ||
          activo.marca?.toLowerCase().includes(searchLower) ||
          activo.modelo?.toLowerCase().includes(searchLower) ||
          activo.serie?.toLowerCase().includes(searchLower)
      );
    }

    // Tipo filter
    if (filters.tipo) {
      filtered = filtered.filter((activo) => activo.tipo_id == filters.tipo);
    }

    // Planta filter
    if (filters.planta) {
      filtered = filtered.filter((activo) => activo.planta_id == filters.planta);
    }

    // Ubicacion filter
    if (filters.ubicacion) {
      filtered = filtered.filter((activo) => activo.ubicacion_id == filters.ubicacion);
    }

    // Nacional/Extranjero filter
    if (filters.nacionalExtranjero) {
      filtered = filtered.filter((activo) => activo.nacionalExtranjero === filters.nacionalExtranjero);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((activo) => activo.status === filters.status);
    }

    // Status CIP/FA filter
    if (filters.statusCipFa) {
      filtered = filtered.filter((activo) => activo.statusCipFa === filters.statusCipFa);
    }

    setFilteredActivos(filtered);
    setPage(0);
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({
      ...filters,
      [field]: event.target.value,
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      tipo: '',
      planta: '',
      ubicacion: '',
      nacionalExtranjero: '',
      status: '', // Show all when cleared
      statusCipFa: '',
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = async (activo) => {
    setSelectedActivo(activo);
    setViewDialogOpen(true);
    setLoadingFiles(true);
    setAssetFiles({ pictures: [], pedimento: null, factura: null });

    // Fetch files for this asset
    try {
      const response = await fetch(`/api/activos/${activo.id}/files`);
      const data = await response.json();
      if (data.success) {
        setAssetFiles(data.data);
      }
    } catch (err) {
      console.error('Error fetching asset files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleEdit = (activo) => {
    router.push(`/editar-activo?id=${activo.id}`);
  };

  const handleDeleteClick = (activo) => {
    setActivoToDelete(activo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activoToDelete) return;

    // Get userBaja from logged-in user
    const userBaja = currentUser?.emp_alias || currentUser?.username || 'unknown';

    try {
      const response = await fetch(`/api/activos/${activoToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userBaja }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Activo dado de baja exitosamente');
        fetchData();
      } else {
        setError(data.message || 'Error al dar de baja el activo');
      }
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('Error de conexión');
    } finally {
      setDeleteDialogOpen(false);
      setActivoToDelete(null);
    }
  };

  const getStatusChip = (status) => {
    const statusColors = {
      activo: 'success',
      inactivo: 'default',
      baja: 'error',
    };
    return (
      <Chip
        label={status || 'activo'}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  return (
    <Box>
      <PageBanner
        title="Buscar Activos"
        subtitle="Consulta y gestión de activos"
        icon={<SearchIcon sx={{ fontSize: 60 }} />}
        bgGradient="linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters Card */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Número, etiqueta, marca, modelo..."
                value={filters.search}
                onChange={handleFilterChange('search')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={filters.tipo}
                onChange={handleFilterChange('tipo')}
              >
                <MenuItem value="">Todos</MenuItem>
                {tipos.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Planta"
                value={filters.planta}
                onChange={handleFilterChange('planta')}
              >
                <MenuItem value="">Todas</MenuItem>
                {plantas.map((planta) => (
                  <MenuItem key={planta.id} value={planta.id}>
                    {planta.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Ubicación"
                value={filters.ubicacion}
                onChange={handleFilterChange('ubicacion')}
              >
                <MenuItem value="">Todas</MenuItem>
                {ubicaciones.map((ubicacion) => (
                  <MenuItem key={ubicacion.id} value={ubicacion.id}>
                    {ubicacion.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Nacional/Extranjero"
                value={filters.nacionalExtranjero}
                onChange={handleFilterChange('nacionalExtranjero')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="nacional">Nacional</MenuItem>
                <MenuItem value="extranjero">Extranjero</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={handleFilterChange('status')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="activo">Activo</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="CIP/FA"
                value={filters.statusCipFa}
                onChange={handleFilterChange('statusCipFa')}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="CIP">CIP</MenuItem>
                <MenuItem value="FA">FA</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Resultados ({filteredActivos.length} activos)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Mostrar/Ocultar Columnas">
                <Button
                  variant="outlined"
                  startIcon={<ViewColumnIcon />}
                  onClick={handleColumnMenuOpen}
                >
                  Columnas
                </Button>
              </Tooltip>
              <Button
                variant="contained"
                onClick={() => router.push('/crear-activo')}
              >
                Nuevo Activo
              </Button>
            </Box>
          </Box>

          {/* Column Visibility Menu */}
          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={handleColumnMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { minWidth: 250, maxHeight: 400 },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Columnas Visibles
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button size="small" variant="text" onClick={showAllColumns}>
                  Mostrar Todas
                </Button>
                <Button size="small" variant="text" onClick={hideOptionalColumns}>
                  Por Defecto
                </Button>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ px: 1, py: 0.5 }}>
              {columnDefinitions.map((col) => (
                <FormControlLabel
                  key={col.key}
                  control={
                    <Checkbox
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      disabled={col.alwaysVisible}
                      size="small"
                    />
                  }
                  label={col.label}
                  sx={{ display: 'block', ml: 0 }}
                />
              ))}
            </Box>
          </Menu>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredActivos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No se encontraron activos
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      {visibleColumns.numeroActivo && <TableCell>No. Activo</TableCell>}
                      {visibleColumns.numeroEtiqueta && <TableCell>No. Etiqueta</TableCell>}
                      {visibleColumns.tipo && <TableCell>Tipo</TableCell>}
                      {visibleColumns.marcaModelo && <TableCell>Marca / Modelo</TableCell>}
                      {visibleColumns.serie && <TableCell>Serie</TableCell>}
                      {visibleColumns.ubicacion && <TableCell>Ubicación</TableCell>}
                      {visibleColumns.planta && <TableCell>Planta</TableCell>}
                      {visibleColumns.nacionalExtranjero && <TableCell>Nac/Ext</TableCell>}
                      {visibleColumns.fechaAlta && <TableCell>Fecha Alta</TableCell>}
                      {visibleColumns.userAlta && <TableCell>Usuario Alta</TableCell>}
                      {visibleColumns.numeroCapex && <TableCell>No. Capex</TableCell>}
                      {visibleColumns.ordenInterna && <TableCell>Orden Interna</TableCell>}
                      {visibleColumns.statusCipFa && <TableCell>CIP/FA</TableCell>}
                      {visibleColumns.status && <TableCell>Status</TableCell>}
                      {visibleColumns.acciones && <TableCell align="center">Acciones</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredActivos
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((activo) => (
                        <TableRow key={activo.id} hover>
                          {visibleColumns.numeroActivo && <TableCell>{activo.numeroActivo}</TableCell>}
                          {visibleColumns.numeroEtiqueta && <TableCell>{activo.numeroEtiqueta}</TableCell>}
                          {visibleColumns.tipo && <TableCell>{activo.tipo_nombre || '-'}</TableCell>}
                          {visibleColumns.marcaModelo && (
                            <TableCell>
                              {activo.marca} / {activo.modelo}
                            </TableCell>
                          )}
                          {visibleColumns.serie && <TableCell>{activo.serie || '-'}</TableCell>}
                          {visibleColumns.ubicacion && <TableCell>{activo.ubicacion_nombre || '-'}</TableCell>}
                          {visibleColumns.planta && <TableCell>{activo.planta_nombre || '-'}</TableCell>}
                          {visibleColumns.nacionalExtranjero && (
                            <TableCell sx={{ textTransform: 'capitalize' }}>
                              {activo.nacionalExtranjero || '-'}
                            </TableCell>
                          )}
                          {visibleColumns.fechaAlta && (
                            <TableCell>
                              {activo.fechaAlta
                                ? new Date(activo.fechaAlta).toLocaleDateString('es-MX')
                                : '-'}
                            </TableCell>
                          )}
                          {visibleColumns.userAlta && <TableCell>{activo.userAlta || '-'}</TableCell>}
                          {visibleColumns.numeroCapex && <TableCell>{activo.numeroCapex || '-'}</TableCell>}
                          {visibleColumns.ordenInterna && <TableCell>{activo.ordenInterna || '-'}</TableCell>}
                          {visibleColumns.statusCipFa && <TableCell>{activo.statusCipFa || '-'}</TableCell>}
                          {visibleColumns.status && <TableCell>{getStatusChip(activo.status)}</TableCell>}
                          {visibleColumns.acciones && (
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleView(activo)}
                                title="Ver detalles"
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(activo)}
                                title={activo.status === 'baja' ? 'No se puede editar un activo dado de baja' : 'Editar'}
                                disabled={activo.status === 'baja'}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(activo)}
                                title={activo.status === 'baja' ? 'Este activo ya está dado de baja' : 'Dar de Baja'}
                                disabled={activo.status === 'baja'}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredActivos.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count}`
                }
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {selectedActivo && (
          <>
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
                color: 'white',
                p: 3,
                position: 'relative',
              }}
            >
              <IconButton
                onClick={() => setViewDialogOpen(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'white',
                }}
              >
                <CloseIcon />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 40 }} />
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                    Etiqueta
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {selectedActivo.numeroEtiqueta}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    No. Activo: {selectedActivo.numeroActivo}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                {getStatusChip(selectedActivo.status)}
              </Box>
            </Box>

            <DialogContent sx={{ p: 0 }}>
              {/* Información del Equipo */}
              <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CategoryIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Información del Equipo
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Tipo
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.tipo_nombre || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Marca
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.marca}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Modelo
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.modelo}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white', borderRadius: 2, height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Serie
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.serie || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Ubicación */}
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Ubicación
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Ubicación
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.ubicacion_nombre || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Planta
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.planta_nombre || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Información Aduanal */}
              <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ShippingIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Información Aduanal
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Nacional / Extranjero
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, textTransform: 'capitalize' }}>
                        {selectedActivo.nacionalExtranjero}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Número de Pedimento
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.numeroPedimento || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Información Financiera */}
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InventoryIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Información Financiera
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Número de Capex
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.numeroCapex || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Orden Interna
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.ordenInterna || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Status CIP/FA
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.statusCipFa || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  {selectedActivo.observaciones && (
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Observaciones
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {selectedActivo.observaciones}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Fechas de Registro */}
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Registro
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Fecha de Alta
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.fechaAlta
                          ? new Date(selectedActivo.fechaAlta).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Usuario Alta
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {selectedActivo.userAlta || '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  {selectedActivo.fechaBaja && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2' }}>
                          <Typography variant="caption" color="error" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Fecha de Baja
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: '#c62828' }}>
                            {new Date(selectedActivo.fechaBaja).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2' }}>
                          <Typography variant="caption" color="error" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Usuario Baja
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: '#c62828' }}>
                            {selectedActivo.userBaja || '-'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>

              {/* Archivos y Fotos */}
              <Box sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhotoIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    Archivos y Fotos
                  </Typography>
                </Box>

                {loadingFiles ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <>
                    {/* Pictures */}
                    {assetFiles.pictures.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                          Fotos del Activo ({assetFiles.pictures.length})
                        </Typography>
                        <Grid container spacing={2}>
                          {assetFiles.pictures.map((pic, index) => (
                            <Grid item xs={6} sm={4} md={3} key={index}>
                              <Box
                                sx={{
                                  position: 'relative',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  border: '1px solid #e0e0e0',
                                  backgroundColor: 'white',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    boxShadow: 2,
                                  },
                                }}
                                onClick={() => openFileViewer(pic, 'image', `Foto ${index + 1}`)}
                              >
                                <Box
                                  component="img"
                                  src={pic}
                                  alt={`Foto ${index + 1}`}
                                  sx={{
                                    width: '100%',
                                    height: 120,
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    textAlign: 'center',
                                    py: 0.5,
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                  }}
                                >
                                  Foto {index + 1}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {/* Documents */}
                    <Grid container spacing={2}>
                      {assetFiles.pedimento && (
                        <Grid item xs={12} sm={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              backgroundColor: 'white',
                              borderRadius: 2,
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PdfIcon color="error" />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Pedimento
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  PDF
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              color="primary"
                              onClick={() => openFileViewer(assetFiles.pedimento, 'pdf', 'Pedimento')}
                              title="Ver Pedimento"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Paper>
                        </Grid>
                      )}

                      {assetFiles.factura && (
                        <Grid item xs={12} sm={6}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              backgroundColor: 'white',
                              borderRadius: 2,
                              border: '1px solid #e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PdfIcon color="error" />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Factura
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  PDF
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton
                              color="primary"
                              onClick={() => openFileViewer(assetFiles.factura, 'pdf', 'Factura')}
                              title="Ver Factura"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>

                    {/* No files message */}
                    {assetFiles.pictures.length === 0 && !assetFiles.pedimento && !assetFiles.factura && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No hay archivos adjuntos para este activo
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Button onClick={() => setViewDialogOpen(false)} sx={{ mr: 1 }}>
                Cerrar
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  setViewDialogOpen(false);
                  handleEdit(selectedActivo);
                }}
                disabled={selectedActivo?.status === 'baja'}
                title={selectedActivo?.status === 'baja' ? 'No se puede editar un activo dado de baja' : ''}
              >
                {selectedActivo?.status === 'baja' ? 'Activo Dado de Baja' : 'Editar Activo'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Baja de Activo</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea dar de baja el activo{' '}
            <strong>{activoToDelete?.numeroEtiqueta}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            El activo será marcado como &quot;baja&quot; con la fecha de hoy y no aparecerá en las búsquedas activas.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Usuario: <strong>{currentUser?.emp_alias || currentUser?.username || 'N/A'}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Dar de Baja
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Viewer Modal */}
      <Dialog
        open={fileViewerOpen}
        onClose={closeFileViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
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
            {fileViewerType === 'pdf' ? (
              <PdfIcon color="error" />
            ) : (
              <PhotoIcon color="primary" />
            )}
            <Typography variant="h6">{fileViewerTitle}</Typography>
          </Box>
          <Box>
            <IconButton
              onClick={() => window.open(fileViewerUrl, '_blank')}
              title="Abrir en nueva pestaña"
              sx={{ mr: 1 }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton onClick={closeFileViewer} title="Cerrar">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: fileViewerType === 'pdf' ? '#525659' : '#f5f5f5',
            overflow: 'hidden',
          }}
        >
          {fileViewerType === 'pdf' ? (
            <iframe
              src={fileViewerUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={fileViewerTitle}
            />
          ) : (
            <Box
              component="img"
              src={fileViewerUrl}
              alt={fileViewerTitle}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

