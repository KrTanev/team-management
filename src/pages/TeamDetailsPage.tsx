import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import PersonIcon from "@mui/icons-material/Person";
import Grid from "@mui/material/Grid";

export const TeamDetailsPage = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
      <Grid container spacing={2} minHeight={160}>
        {[0, 1, 2].map((member) => (
          <Grid
            key={member}
            size={{ xs: 12, sm: 4 }}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Avatar sx={{ width: 72, height: 72 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
