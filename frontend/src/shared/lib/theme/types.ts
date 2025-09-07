import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    dropZone: {
      main: string;
      light: string;
    };
  }

  interface PaletteOptions {
    dropZone?: {
      main?: string;
      light?: string;
    };
  }
}
