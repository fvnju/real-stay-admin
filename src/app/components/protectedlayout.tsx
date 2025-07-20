"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { menuItems } from "../lib/menu";
import { theme } from "../lib/theme";
import { useUserSession } from "../lib/useUserSession";

const drawerWidth = 300;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useUserSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  //   useEffect(() => {
  //     if (isAuthenticated === false) {
  //       router.replace("/sign-in");
  //     }
  //   }, [isAuthenticated, router]);

  //   if (isAuthenticated === null)
  //     return (
  //       <Backdrop
  //         open
  //         sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
  //       >
  //         <CircularProgress color="inherit" />
  //       </Backdrop>
  //     );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <CssBaseline />
      <Toolbar
        sx={{ borderBottom: `1px solid ${theme?.palette?.secondary?.light}` }}
      >
        <Stack flex="1" direction="row" gap={1}>
          <Image src="/edge-tech-logo.svg" width={35} height={35} alt="logo" />
          <Stack>
            <Typography
              className=" font-semibold text-lg"
              variant="body1"
              sx={{ fontWeight: "600" }}
              color="primary.light"
            >
              Edge-Tech Innovations
            </Typography>
            <Typography color="primary.main" variant="body2">
              Realstay admin panel
            </Typography>
          </Stack>
        </Stack>
      </Toolbar>
      <List sx={{ mt: 1 }}>
        {menuItems.map((m) => (
          <Stack>
            <Typography
              sx={{ color: theme?.palette?.primary?.main, pl: 2, mt: 3 }}
              variant="caption"
            >
              {m?.heading}
            </Typography>
            {m?.menus?.map((menu) => (
              <ListItemButton
                component="a"
                href={menu.path}
                key={menu.label}
                onClick={() => router.push(menu.path)}
                sx={{ px: 2, py: 1 }}
              >
                <ListItemIcon
                  sx={{ minWidth: 32, color: theme?.palette?.primary?.light }}
                >
                  <Icon icon={menu.icon} width="18" height="18" />
                </ListItemIcon>
                <ListItemText
                  primary={menu.label}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    color: theme?.palette?.primary?.light,
                  }}
                />
              </ListItemButton>
            ))}
          </Stack>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer - 1,
          borderRight: `1px solid ${theme?.palette?.secondary?.light}`,
          backgroundColor: theme?.palette?.primary?.dark,
        }}
      >
        <Toolbar>
          <Stack flex="1" direction="row" gap={1}>
            <Image
              src="/edge-tech-logo.svg"
              width={35}
              height={35}
              alt="logo"
            />
            <Stack>
              <Typography
                className=" font-semibold text-lg"
                variant="body2"
                sx={{ fontWeight: "600" }}
                color="primary.light"
              >
                Edge-Tech Innovations
              </Typography>
              <Typography color="primary.main" variant="body2">
                Realstay admin panel
              </Typography>
            </Stack>
          </Stack>

          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ ml: 2, display: { sm: "none" } }}
          >
            <Icon
              icon="hugeicons:menu-04"
              width="18"
              height="18"
              className="text-white"
            />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              borderRight: `1px solid ${theme?.palette?.secondary?.light}`,
              backgroundColor: theme?.palette?.primary?.dark,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme?.palette?.secondary?.light}`,
              backgroundColor: theme?.palette?.primary?.dark,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
