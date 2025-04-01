import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Paper,
  Fade,
  useTheme,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface Note {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  userEmail: string;
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

const Home: React.FC = () => {
  const [searchTitle, setSearchTitle] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setNotes([]);
    setError(null);
  };

  const handleTitleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!searchTitle.trim()) {
        setError('Please enter a search term');
        return;
      }

      const response = await axios.get('http://localhost:5132/api/notes/public/search-by-title', {
        params: { titleSearch: searchTitle.trim() }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setNotes(response.data);
        if (response.data.length === 0) {
          setError('No notes found with this title');
        }
      } else {
        setError('Invalid response format');
        setNotes([]);
      }
    } catch (error: any) {
      console.error('Error while searching:', error);
      setError(error.response?.data?.message || 'An error occurred while searching');
      setNotes([]);
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

      const params: any = {};
      if (fromDate) {
        params.fromDate = fromDate.toISOString();
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        params.toDate = endDate.toISOString();
      }

      const response = await axios.get('http://localhost:5132/api/notes/public/search-by-date', { params });
      
      if (response.data && Array.isArray(response.data)) {
        setNotes(response.data);
        if (response.data.length === 0) {
          setError('No notes found for the selected period');
        }
      } else {
        setError('Invalid response format');
        setNotes([]);
      }
    } catch (error: any) {
      console.error('Error while searching:', error);
      setError(error.response?.data?.message || 'An error occurred while searching');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 8
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center',
          mb: 8
        }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3
            }}
          >
            Welcome to NotesManager
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ maxWidth: 800, mb: 6 }}
          >
            Your personal space for organizing thoughts, ideas, and important information.
            Create, edit, and manage your notes with ease.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6} lg={4}>
            <Card 
              className="card-hover"
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <EditIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Create Notes
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Write and organize your thoughts with our intuitive note-taking system.
                  Add titles, descriptions, and keep everything organized.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card 
              className="card-hover"
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <SearchIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Search Notes
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Find your notes quickly with our powerful search functionality.
                  Search by title or date to locate exactly what you need.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Card 
              className="card-hover"
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 4 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Secure & Private
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Your notes are private and secure. Access them anytime, anywhere,
                  with your personal account.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 8,
          gap: 3
        }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            startIcon={<LoginIcon />}
            sx={{ 
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Login
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register')}
            startIcon={<PersonAddIcon />}
            sx={{ 
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Register
          </Button>
        </Box>

        {/* Search Section */}
        <Box sx={{ mt: 8, mb: 6 }}>
          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{
              textAlign: 'center',
              mb: 4,
              fontWeight: 600
            }}
          >
            Search Public Notes
          </Typography>
          
          <Paper
            elevation={3}
            sx={{
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              p: 3
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="Search by Title" />
                <Tab label="Search by Date" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start date"
                      value={fromDate}
                      onChange={(date: Date | null) => setFromDate(date)}
                      slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End date"
                      value={toDate}
                      onChange={(date: Date | null) => setToDate(date)}
                      slotProps={{ textField: { fullWidth: true, variant: 'outlined', size: 'small' } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={4}>
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
                </Grid>
              </Grid>
            </TabPanel>

            {error && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {notes.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Search Results
                </Typography>
                <Grid container spacing={3}>
                  {notes.map((note, index) => (
                    <Grid item xs={12} sm={6} md={4} key={note.id}>
                      <Fade in timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                        <Card className="card-hover" sx={{ borderRadius: 4 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {note.title}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                              By {note.userEmail}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                              {note.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {notes.length === 0 && !loading && !error && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="textSecondary">
                  No notes found. Try adjusting your search criteria.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 3
        }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            startIcon={<LoginIcon />}
            sx={{ 
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Login
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/register')}
            startIcon={<PersonAddIcon />}
            sx={{ 
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem'
            }}
          >
            Register
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 