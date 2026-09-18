import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message = "Loading…" }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <LoaderCircle className="icon-lg spin" aria-hidden="true" />
      <div className="state-block-title">{message}</div>
    </div>
  );
}
