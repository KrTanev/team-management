import { Hammer } from "lucide-react";

import { PageHeader } from "../components/ui/PageHeader";

type Props = { title: string; task: string };

/** Placeholder for pages you build during the BetterDev frontend track. */
export const NotBuiltPage = ({ title, task }: Props) => (
  <>
    <PageHeader title={title} />
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <Hammer className="mx-auto mb-3 size-6 text-slate-400" aria-hidden />
      <p className="text-sm text-slate-600">Not built yet.</p>
      <p className="mt-1 text-sm text-slate-500">
        See <code className="rounded bg-slate-100 px-1">betterdev/tasks/{task}.md</code>
      </p>
    </div>
  </>
);

export default NotBuiltPage;
