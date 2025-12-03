import { useEffect, type ReactNode } from "react";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";

type Props = { children: ReactNode };

export const ProtectedRoute = (props: Props) => {
    const {children} = props;
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate(`/login`);
    }
  }, [user, navigate]);

  return children;
};
