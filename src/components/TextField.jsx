export default function TextField(theme) {
  return {
    MuiTextField: {
      styleOverrides: {
        root: {
          ...(theme.palette.mode === 'dark' && {
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: theme.palette.text.primary,
              color: theme.palette.text.primary,
            },
            '& .MuiInputLabel-root.Mui-disabled': {
              color: theme.palette.text.secondary,
            },
            '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
            },
            '& .MuiSelect-select.Mui-disabled': {
              WebkitTextFillColor: theme.palette.text.primary,
              color: theme.palette.text.primary,
            },
          }),
        },
      },
    },
  };
}