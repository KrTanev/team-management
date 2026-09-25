import { ArrowLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { errorMessage } from "../api/errors";
import { useRemoveTeamMember, useTeam } from "../api/teams";
import type { Team } from "../api/types";
import { useAuth } from "../auth/authContext";
import { AddMemberDialog } from "../components/teams/AddMemberDialog";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";

export const TeamDetailPage = () => {
  const teamId = Number(useParams().teamId);
  const { data: team, isPending, error } = useTeam(teamId);

  return (
    <>
      <Link to="/teams" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" aria-hidden />
        All teams
      </Link>
      {error && <Alert>{errorMessage(error)}</Alert>}
      {isPending && <Spinner label="Loading team" />}
      {team && <TeamDetail team={team} />}
    </>
  );
};

function TeamDetail({ team }: { team: Team }) {
  const { user } = useAuth();
  const removeMember = useRemoveTeamMember(team.id);
  const [adding, setAdding] = useState(false);

  const canManage =
    user?.role === "admin" || team.members.some((m) => m.userId === user?.id && m.role === "lead");

  return (
    <>
      <PageHeader
        title={team.name}
        subtitle={team.description || undefined}
        actions={
          canManage && (
            <Button onClick={() => setAdding(true)}>
              <UserPlus className="size-4" aria-hidden />
              Add member
            </Button>
          )
        }
      />

      {removeMember.error && <Alert>{errorMessage(removeMember.error)}</Alert>}

      <section className="rounded-lg border border-slate-200 bg-white">
        <h2 id="members-heading" className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
          Members
        </h2>
        <ul aria-labelledby="members-heading" className="divide-y divide-slate-100">
          {team.members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-900">{member.displayName}</span>
                {member.role === "lead" && <Badge tone="brand">lead</Badge>}
              </div>
              {canManage && (
                <Button
                  variant="danger"
                  aria-label={`Remove ${member.displayName}`}
                  onClick={() => removeMember.mutate(member.userId)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
          {team.members.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No members yet.</li>}
        </ul>
      </section>

      {adding && <AddMemberDialog team={team} onClose={() => setAdding(false)} />}
    </>
  );
}

export default TeamDetailPage;
