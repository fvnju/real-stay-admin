import { colors, createTheme, PaletteColorOptions } from "@mui/material";
import type {} from "@mui/material/themeCssVarsAugmentation";

// MUI module augmentation for custom breakpoints and palette
declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    mobile: true;
    tablet: true;
    miniLaptops: true;
    laptop: true;
    desktop: true;
  }

  interface PaletteOptions {
    ochre: PaletteColorOptions;
    neutrals: PaletteColorOptions;
  }

  interface Palette {
    ochre: PaletteColor;
    neutrals: PaletteColor;
  }

  interface PaletteColor {
    lighter?: string;
    darker?: string;
    pale?: string;
  }

  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
    pale?: string;
  }
}

const { palette } = createTheme();

/**
 * The colors of the HeroUI theme of the mobile app (heroui-native and
 * @heroui/styles, `--background`, `--surface`, ...) in hex, because MUI
 * needs real colors to make its shades.
 */
const LIGHT = {
  background: "#f5f5f5",
  surface: "#ffffff",
  surfaceSecondary: "#efeff0",
  default: "#ebebec",
  foreground: "#18181b",
  muted: "#71717a",
  border: "#dedee0",
  accent: "#0485f7",
  success: "#17c964",
  warning: "#f5a524",
  danger: "#ff383c",
};

const DARK: typeof LIGHT = {
  background: "#060607",
  surface: "#18181b",
  surfaceSecondary: "#232325",
  default: "#27272a",
  foreground: "#fcfcfc",
  muted: "#9f9fa9",
  border: "#28282c",
  accent: "#0485f7",
  success: "#17c964",
  warning: "#f7b750",
  danger: "#db3b3e",
};

/**
 * The old dark theme used `primary` for surfaces and `secondary` for text.
 * The pages still use these names, so they keep these meanings.
 */
function schemePalette(c: typeof LIGHT) {
  const greys = palette.augmentColor({
    color: {
      main: c.muted,
      light: c.foreground,
      dark: c.muted,
      contrastText: c.surface,
    },
  });
  return {
    primary: {
      main: c.surface,
      light: c.border,
      dark: c.background,
      contrastText: c.foreground,
    },
    secondary: {
      main: c.foreground,
      light: c.foreground,
      lighter: c.muted,
      dark: c.muted,
      contrastText: c.surface,
    },
    error: { main: c.danger, light: c.danger, dark: c.danger, pale: c.danger },
    success: { main: c.success, light: c.success, dark: c.success },
    warning: { main: c.warning, light: c.warning, dark: c.warning },
    info: { main: c.accent, light: c.accent, dark: c.accent },
    background: { default: c.background, paper: c.surface },
    text: { primary: c.foreground, secondary: c.muted, disabled: c.muted },
    divider: c.border,
    common: { black: "#000000", white: "#ffffff" },
    ochre: greys,
    neutrals: greys,
  };
}

export const theme = createTheme({
  typography: {
    fontFamily: "var(--font-inter), sans-serif",
    fontSize: 14,
  },

  // The colors follow the `light` or `dark` class on <html> (next-themes),
  // the same as HeroUI. Use `theme.vars.palette` in styles: it is a CSS
  // variable, so it changes with the mode. `theme.palette` is the light value.
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: { palette: schemePalette(LIGHT) },
    dark: { palette: schemePalette(DARK) },
  },

  breakpoints: {
    keys: [
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "mobile",
      "tablet",
      "miniLaptops",
      "laptop",
      "desktop",
    ],
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      mobile: 600,
      tablet: 900,
      miniLaptops: 1000,
      laptop: 1024,
      desktop: 1500,
    },
  },

  shadows: [
    "none",
    "0px 4px 10px rgba(0, 0, 0, 0.1)",
    "0px 6px 12px rgba(0, 0, 0, 0.08)",
    "0px 8px 16px rgba(0, 0, 0, 0.07)",
    "0px 10px 20px rgba(0, 0, 0, 0.06)",
    "0px 12px 24px rgba(0, 0, 0, 0.05)",
    "0px 14px 28px rgba(0, 0, 0, 0.04)",
    "0px 16px 32px rgba(0, 0, 0, 0.03)",
    "0px 18px 36px rgba(0, 0, 0, 0.02)",
    "0px 20px 40px rgba(0, 0, 0, 0.015)",
    "0px 22px 44px rgba(0, 0, 0, 0.01)",
    "0px 24px 48px rgba(0, 0, 0, 0.01)",
    "0px 26px 52px rgba(0, 0, 0, 0.01)",
    "0px 28px 56px rgba(0, 0, 0, 0.01)",
    "0px 30px 60px rgba(0, 0, 0, 0.01)",
    "0px 32px 64px rgba(0, 0, 0, 0.01)",
    "0px 34px 68px rgba(0, 0, 0, 0.01)",
    "0px 36px 72px rgba(0, 0, 0, 0.01)",
    "0px 38px 76px rgba(0, 0, 0, 0.01)",
    "0px 40px 80px rgba(0, 0, 0, 0.01)",
    "0px 42px 84px rgba(0, 0, 0, 0.01)",
    "0px 44px 88px rgba(0, 0, 0, 0.01)",
    "0px 46px 92px rgba(0, 0, 0, 0.01)",
    "0px 48px 96px rgba(0, 0, 0, 0.01)",
    "0px 50px 100px rgba(0, 0, 0, 0.01)",
  ],

  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: "var(--font-inter), sans-serif",
          // fontSize: "0.875rem",
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: ".75rem",
          color: "var(--mui-palette-text-secondary)",
          "&.Mui-focused": {
            color: "var(--mui-palette-text-secondary)",
          },
          "&.Mui-error": {
            color: "var(--mui-palette-error-main)",
          },
        },
        asterisk: {
          color: "var(--mui-palette-error-main)",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        // InputLabelProps: { shrink: true,  },

        inputProps: { min: 0 },
      },
      styleOverrides: {
        root: ({ theme }) => ({
          // marginTop: "1.2rem",

          "& .MuiInputBase-input": {
            top: 0,
            fontSize: ".75rem",
            color: theme.vars.palette.secondary.main, // input text color
            // WebkitTextFillColor: theme.vars.palette.secondary.main,
            borderRadius: "8px",
            marginLeft: "0.5rem",
            "&::placeholder": {
              color: theme.vars.palette.secondary.main, // placeholder color
              // WebkitTextFillColor: theme.vars.palette.secondary.main,
              opacity: 1,
            },
            "&.Mui-disabled": {
              color: theme.vars.palette.secondary.main,
            },
          },
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            "&.Mui-focused .MuiInputBase-input": {
              color: theme.vars.palette.secondary.main,
            },

            "&.Mui-disabled .MuiInputBase-input": {
              color: theme.vars.palette.secondary.main,
              opacity: 0.7,
            },
            "& fieldset": {
              top: 0,
              borderColor: theme.vars.palette.secondary.main,
              legend: {
                display: "none",
              },
            },
            "&:hover fieldset": {
              borderColor: theme.vars.palette.secondary.main,
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.vars.palette.secondary.main,
            },
            "&.Mui-disabled fieldset": {
              borderColor: theme.vars.palette.secondary.main,
              opacity: 0.5,
              color: theme.vars.palette.secondary.main,
              "&:hover": {
                cursor: "not-allowed",
              },
            },
          },
          "& .MuiInputLabel-root": {
            transform: "translate(0px, -28px) scale(0.9)", // optional: reposition label
            color: theme.vars.palette.secondary.main,
            "&.Mui-focused": {
              color: theme.vars.palette.secondary.main,
            },
            "&.Mui-disabled": {
              color: theme.vars.palette.secondary.main,
            },
          },
        }),
      },
    },

    MuiInputAdornment: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.secondary.main, // icon color
          cursor: "pointer", // pointer on hover
          "&:hover": {
            color: theme.vars.palette.primary.main, // optional hover color
          },
        }),
      },
    },

    MuiSvgIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: "1rem", // adjust size
          // color: theme.vars.palette.secondary.lighter, // default color
        }),
      },
    },

    MuiPickersSectionList: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: ".75rem",
          color: theme.vars.palette.secondary.main,
          padding: "12px 14px",
          minHeight: "45px",
          display: "flex",
          alignItems: "center",
          borderColor: theme.vars.palette.secondary.main,

          "& .MuiPickersSectionList-section": {
            color: theme.vars.palette.secondary.main,
            borderColor: theme.vars.palette.secondary.main,
          },

          "& .MuiPickersSectionList-sectionContent": {
            fontSize: ".75rem",
          },

          "& .MuiPickersSectionList-sectionSeparator": {
            color: theme.vars.palette.secondary.main,
            opacity: 0.6,
          },

          "&.Mui-disabled": {
            color: theme.vars.palette.secondary.main,
            opacity: 0.5,
          },
          "& .MuiSvgIcon-root": {
            color: theme.vars.palette.secondary.main,
            // opacity: 0.5,
          },
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: "8px",
          alignItems: "center",
          borderColor: theme.vars.palette.secondary.main,
          input: {
            "&.Mui-disabled": {
              // backgroundColor: '#f0f0f0',
              WebkitTextFillColor: theme.vars.palette.secondary.main,
              color: theme.vars.palette.secondary.main,
            },
          },
          notchedOutline: {
            "&.Mui-disabled": {
              borderColor: theme.vars.palette.secondary.main,
            },
          },
          root: {
            "&.Mui-disabled:hover": {
              cursor: "not-allowed", // hover cursor
            },
          },
          "& fieldset": {
            color: theme.vars.palette.secondary.main,
            borderColor: theme.vars.palette.secondary.main,
            legend: { display: "none" },
          },

          "&:hover fieldset": {
            borderColor: theme.vars.palette.secondary.main,
          },

          "&.Mui-focused fieldset": {
            borderColor: theme.vars.palette.secondary.main,
          },

          "&.Mui-disabled fieldset": {
            color: theme.vars.palette.secondary.contrastText,
            // opacity: 0.5,
          },
        }),
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-input": {
            borderRadius: "8px",
          },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: () => ({
          textTransform: "none",
          borderRadius: "8px",
          fontWeight: 500,
          // padding: "8px 16px",
          fontSize: ".875rem",
          transition: "background-color 0.3s ease",

          // "&:hover": {
          //   backgroundColor: theme.vars.palette.primary.light,
          // },
        }),
        containedPrimary: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.vars.palette.secondary.light,
            color: theme.vars.palette.primary.main,
            border: `1px solid ${theme.vars.palette.primary.main}`,
          },
        }),
        containedSecondary: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.vars.palette.primary.dark,
            color: theme.vars.palette.secondary.main,
          },
        }),
        containedError: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.vars.palette.secondary.light,
            color: theme.vars.palette.error.main,
            border: `1px solid ${theme.vars.palette.error.main}`,
          },
        }),
        containedSuccess: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.vars.palette.secondary.light,
            color: theme.vars.palette.success.main,
            border: `1px solid ${theme.vars.palette.success.main}`,
          },
        }),
        containedInfo: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.vars.palette.secondary.light,
            color: theme.vars.palette.info.main,
            border: `1px solid ${theme.vars.palette.info.main}`,
          },
        }),
        containedWarning: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.vars.palette.secondary.light,
            color: theme.vars.palette.warning.main,
            border: `1px solid ${theme.vars.palette.warning.main}`,
          },
        }),
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: { display: "none" },
        root: ({ theme }) => ({
          minHeight: "unset",
          color: theme.vars.palette.secondary.light, // makes tab indicator and text white
          backgroundColor: theme.vars.palette.primary.dark,
          pt: 3,
          width: "fit-content",
          borderRadius: "10px",
        }),
      },
    },

    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          fontWeight: 500,
          minHeight: "unset",
          // margin: "0.5rem",
          padding: "6px 12px",
          borderRadius: "10px",
          color: theme.vars.palette.secondary.light, // normal state text color
          "&.Mui-selected": {
            backgroundColor: theme.vars.palette.primary.light,
            border: "none",
            color: theme.vars.palette.secondary.light,
          },
          transition: "0.8s ease all",
        }),
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.vars.palette.primary.light,
        }),
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.secondary.light,
          // fontSize: theme.typography.body1,
        }),
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: ".75rem",
          color: theme.vars.palette.secondary.light,
          borderBottom: `1px solid ${theme.vars.palette.primary.light}`,
        }),
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: "background-color 0.3s",
          "&:hover td": {
            backgroundColor: theme.vars.palette.primary.light,
            cursor: "pointer",
          },
        }),
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 0,
          margin: 2,
          transitionDuration: "300ms",
          "&.Mui-checked": {
            transform: "translateX(16px)",
            color: "#fff",
            "& + .MuiSwitch-track": {
              backgroundColor: "#65C466",
              opacity: 1,
              border: 0,
            },
          },
          "&.Mui-disabled .MuiSwitch-thumb": {
            color: "#E9E9EA",
          },
          "&.Mui-disabled + .MuiSwitch-track": {
            opacity: 0.7,
          },
        },
        thumb: {
          width: 22,
          height: 22,
          boxSizing: "border-box",
        },
        track: {
          borderRadius: 13,
          backgroundColor: "#E9E9EA",
          opacity: 1,
          transition: "background-color 500ms",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "10px",
          padding: "2rem",
        },
      },
    },

    MuiPagination: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.secondary.light,
        }),
      },
    },

    MuiPaginationItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.secondary.light,
        }),
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars.palette.secondary.light,
        }),
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: "8px",
          backgroundColor: theme.vars.palette.primary.main,
          // borderColor: theme.vars.palette.primary.light,
          border: `1px solid ${theme.vars.palette.primary.light}`,
        }),
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          // padding: "4px 0",
          backgroundColor: theme.vars.palette.primary.main,
          color: theme.vars.palette.secondary.main,
        }),
      },
    },

    MuiStack: {
      defaultProps: {
        component: "div",
      },
    },
  },
});
