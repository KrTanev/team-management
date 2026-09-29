import { useNavigate, useRouteError } from "react-router-dom";

import { Button } from "../components/ui/Button";

export const ErrorPage = () => {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl p-10">
      <h1 className="mb-2 text-2xl font-semibold">Oops — an error occurred</h1>
      <p className="mb-6 text-sm whitespace-pre-wrap text-slate-600">
        {String(error?.message ?? error ?? "Unknown error")}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => navigate(-1)}>Go back</Button>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;
