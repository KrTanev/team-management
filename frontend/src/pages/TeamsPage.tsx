import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { errorMessage } from "../api/errors";
import { useCreateTeam, useTeams } from "../api/teams";
import { useAuth } from "../auth/authContext";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { Spinner } from "../components/ui/Spinner";

export const TeamsPage = () => {
  const { user } = useAuth();
  const { data, isPending, error } = useTeams();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Teams"
        subtitle={data ? `${data.total} teams` : undefined}
        actions={
          user?.role === "admin" && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden />
              New team
            </Button>
          )
        }
      />

      {creating && <NewTeamForm onDone={() => setCreating(false)} />}
      {error && <Alert>{errorMessage(error)}</Alert>}
      {isPending && <Spinner label="Loading teams" />}

      {data && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((team) => (
            <li key={team.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Link to={`/teams/${team.id}`} className="text-base font-semibold text-slate-900 hover:text-brand-700">
                {team.name}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{team.description || "No description"}</p>
              <p className="mt-4 text-xs text-slate-500">
                {team.members.length} {team.members.length === 1 ? "member" : "members"}
                {team.members.some((m) => m.role === "lead") &&
                  ` · led by ${team.members.find((m) => m.role === "lead")!.displayName}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

function NewTeamForm({ onDone }: { onDone: () => void }) {
  const createTeam = useCreateTeam();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; description: string }>();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTeam.mutateAsync(values);
      onDone();
    } catch {
      // shown via createTeam.error
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      aria-label="New team"
      className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      {createTeam.error && <Alert>{errorMessage(createTeam.error)}</Alert>}
      <Field label="Name" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
      <Field label="Description" {...register("description")} />
      <div className="flex gap-2">
        <Button type="submit" disabled={createTeam.isPending}>
          Create team
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default TeamsPage;
