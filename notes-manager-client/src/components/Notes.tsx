import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Tabs,
  Tab,
  Fade,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Note {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

interface UserInfo {
  firstName: string;
  lastName: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Notes: React.FC = () => {
  const [personalNotes, setPersonalNotes] = useState<Note[]>([]);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchPersonalNotes();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5132/api/auth/user-info', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      navigate('/login');
    }
  };

  const fetchPersonalNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5132/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPersonalNotes(response.data);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('An error occurred while loading notes');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSearchResults([]);
    setError(null);
  };

  const handleTitleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!searchTitle.trim()) {
        setSearchResults([]);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Search parameters:', { titleSearch: searchTitle.trim() });

      const response = await axios.get('http://localhost:5132/api/notes/search-by-title', {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        params: { 
          titleSearch: searchTitle.trim() 
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setSearchResults(response.data);
        if (response.data.length === 0) {
          setError('No notes found with this title');
        }
      } else {
        setError('Invalid response format');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error while searching:', error);
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid search parameters';
        console.log('Error response:', error.response.data);
        setError(errorMessage);
      } else if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('An error occurred while searching');
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!fromDate && !toDate) {
        setError('Please select at least one date');
        return;
      }

      if (fromDate && toDate && fromDate > toDate) {
        setError('Start date must be before end date');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const params: any = {};
      if (fromDate) {
        params.fromDate = fromDate.toISOString();
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        params.toDate = endDate.toISOString();
      }

      const response = await axios.get('http://localhost:5132/api/notes/search-by-date', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      if (response.data && Array.isArray(response.data)) {
        setSearchResults(response.data);
        if (response.data.length === 0) {
          setError('No notes found for the selected period');
        }
      } else {
        setError('Invalid response format');
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error while searching:', error);
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid date parameters';
        setError(errorMessage);
      } else if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('An error occurred while searching');
      }
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(
        'http://localhost:5132/api/notes',
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTitle('');
      setDescription('');
      setSearchTitle('');
      setFromDate(null);
      setToDate(null);
      fetchPersonalNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      setError('Failed to create note. Please try again.');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.put(
        `http://localhost:5132/api/notes/${editingNote.id}`,
        { title: editingNote.title, description: editingNote.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOpenDialog(false);
      setEditingNote(null);
      fetchPersonalNotes();
    } catch (error) {
      console.error('Failed to update note:', error);
      setError('Failed to update note. Please try again.');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.delete(`http://localhost:5132/api/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchPersonalNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <Container maxWidth="xl" className="page-transition">
      <Box sx={{ display: 'flex', minHeight: '100vh', py: 4 }}>
        {/* Sidebar - Search Section */}
        <Paper
          elevation={3}
          sx={{
            width: 320,
            mr: 4,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 24,
            height: 'fit-content',
            maxHeight: 'calc(100vh - 48px)',
            overflow: 'auto'
          }}
        >
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Search Notes
            </Typography>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="By Title" />
              <Tab label="By Date" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Search by title"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={handleTitleSearch}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start date"
                    value={fromDate}
                    onChange={(date: Date | null) => setFromDate(date)}
                    slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                  />
                  <DatePicker
                    label="End date"
                    value={toDate}
                    onChange={(date: Date | null) => setToDate(date)}
                    slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                  />
                </LocalizationProvider>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={handleDateSearch}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Box>
            </TabPanel>
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            p: 3,
            borderRadius: 4,
            boxShadow: 1
          }}>
            <Typography variant="h4" component="h1">
              {userInfo && `Welcome back, ${userInfo.firstName} ${userInfo.lastName}!`}
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleLogout}>
              Logout
            </Button>
          </Box>

          {/* Create Note Section */}
          <Card sx={{ mb: 4, borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AddIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Create New Note
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateNote}
                    fullWidth
                    startIcon={<AddIcon />}
                  >
                    Add Note
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Notes Display */}
          <Box>
            {searchResults.length > 0 ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ mr: 1 }} />
                  Search Results
                </Typography>
                <Grid container spacing={3}>
                  {searchResults.map((note, index) => (
                    <Grid item xs={12} sm={6} md={4} key={note.id}>
                      <Fade in timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                        <Card className="card-hover" sx={{ borderRadius: 4 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {note.title}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              {note.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <EditIcon sx={{ mr: 1 }} />
                  My Notes
                </Typography>
                <Grid container spacing={3}>
                  {personalNotes.map((note, index) => (
                    <Grid item xs={12} sm={6} md={4} key={note.id}>
                      <Fade in timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                        <Card className="card-hover" sx={{ borderRadius: 4 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="h6" gutterBottom>
                                {note.title}
                              </Typography>
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingNote(note);
                                    setOpenDialog(true);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography color="textSecondary" gutterBottom>
                              {new Date(note.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              {note.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>

          {/* Edit Dialog */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)}
            PaperProps={{
              sx: { borderRadius: 4 }
            }}
          >
            <DialogTitle>Edit Note</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Title"
                value={editingNote?.title || ''}
                onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                margin="normal"
                size="small"
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={editingNote?.description || ''}
                onChange={(e) => setEditingNote(prev => prev ? { ...prev, description: e.target.value } : null)}
                margin="normal"
                size="small"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateNote} variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 4 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default Notes; 