import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Container,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';

const Header: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
              <Box
                component="img"
                src="/images/logo.svg"
                alt="TranscriptPro Logo"
                sx={{ height: 40, mr: 1 }}
              />
              TranscriptPro
            </Link>
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenu}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {!session ? (
                  <>
                    <MenuItem onClick={() => router.push('/login')}>Login</MenuItem>
                    <MenuItem onClick={() => router.push('/register')}>Register</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => router.push('/dashboard')}>Dashboard</MenuItem>
                    <MenuItem onClick={() => router.push('/transcribe')}>New Transcription</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button color="inherit" sx={{ mr: 2 }} component={Link} href="/pricing">
                Pricing
              </Button>
              {!session ? (
                <>
                  <Button color="inherit" sx={{ mr: 2 }} component={Link} href="/login">
                    Login
                  </Button>
                  <Button variant="contained" color="primary" component={Link} href="/register">
                    Get Started
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" sx={{ mr: 2 }} component={Link} href="/dashboard">
                    Dashboard
                  </Button>
                  <Button color="inherit" sx={{ mr: 2 }} component={Link} href="/transcribe">
                    New Transcription
                  </Button>
                  <Button onClick={handleLogout} color="inherit">
                    Logout
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
