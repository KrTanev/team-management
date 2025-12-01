import React from "react";
import { Box, Button, Typography } from "@mui/material";

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  State
> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="primary" onClick={this.reset}>
              Try again
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => (window.location.href = "/")}
            >
              Go home
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children ?? null;
  }
}

export default ErrorBoundary;
