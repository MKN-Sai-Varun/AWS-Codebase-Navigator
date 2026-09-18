import { Inbox } from "lucide-react";

export default function EmptyState({ title, description, icon: Icon = Inbox }) {
  return (
    <div className="state-block">
      <Icon className="icon-lg" />
      <div className="state-block-title">{title}</div>
      {description ? <div className="state-block-desc">{description}</div> : null}
    </div>
  );
}