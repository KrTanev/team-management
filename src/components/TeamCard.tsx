import {
  Card,
  CardActions,
  CardContent,
  Button,
  Typography,
} from "@mui/material";
import type { Team } from "../api/types/teamTypes";
import { useNavigate } from "react-router-dom";

type TeamCardProps = {
  team: Team;
};

export const TeamCard = ({ team }: TeamCardProps) => {
  const membersCount = team.users?.length ?? 0;
  const navigate = useNavigate();

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {team.name}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Members: {membersCount}
        </Typography>

        <Typography variant="caption" color="text.secondary" display="block">
          Created: {new Date(team.createdAt).toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Updated: {new Date(team.updatedAt).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions>
        <Button onClick={() => { navigate("/team-details") }}>
          VIEW TEAM
        </Button>
      </CardActions>
    </Card>
  );
}