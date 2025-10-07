import PropTypes from "prop-types";
import { useContext, useMemo } from "react";
// @mui
import { CssBaseline } from "@mui/material";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
  StyledEngineProvider,
} from "@mui/material/styles";

//hooks
import useSettings from "../hooks/useSettings";

//Settings
import palette from "./palette";
import typography from "./typography";
import breakpoints from "./breakpoints";
import shadows, { customShadows } from "./shadows";

// Import TextField override
import TextField from "../components/TextField";

// ----------------------------------------------------------------------

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export default function ThemeProvider({ children }) {
  const { themeMode } = useSettings();
  const isLight = themeMode === "light";
  const themeOptions = useMemo(
    () => ({
      palette: isLight ? palette.light : palette.dark,
      typography,
      breakpoints,
      shape: { borderRadius: 8 },
      shadows: isLight ? shadows.light : shadows.dark,
      customShadows: isLight ? customShadows.light : customShadows.dark,
      utils: {
        getColorByMode: (lightColor = 'primary', darkColor = 'info') => {
          return isLight ? lightColor : darkColor;
        }
      }
    }),
    [isLight]
  );

  const theme = createTheme(themeOptions);

  // Apply TextField overrides
  const themeWithComponents = createTheme({
    ...theme,
    components: {
      ...theme.components,
      ...TextField(theme),
    },
  });

  // Apply global theme object with dark mode color mapping
  themeWithComponents.colorMode = isLight ? 'primary' : 'info';

  return (
    <StyledEngineProvider injectFirst>
      <MUIThemeProvider theme={themeWithComponents}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </StyledEngineProvider>
  );
}
