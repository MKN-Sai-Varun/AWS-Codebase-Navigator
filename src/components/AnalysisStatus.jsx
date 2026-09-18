import { Loader2 } from "lucide-react";
import { STATUS_LABELS } from "../utils/constants.js";

export default function AnalysisStatus({ status }) {
  const label = STATUS_LABELS[status] || status;
  const showSpinner = status === "queued" || status === "analyzing";
  return (
    <span className={`status ${status}`}>
      {showSpinner ? <Loader2 size={13} className="spin" /> : <span className="status-dot" />}
      {label}
    </span>
  );
}