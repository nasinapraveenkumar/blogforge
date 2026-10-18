
import { Link } from "react-router-dom";

export default function WorkspacePlaceholder({ title, description }) {
  return (
    <section className="workspace-placeholder">
      <span className="panel-kicker">BLOGFORGE WORKSPACE</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link to="/dashboard" className="secondary-action">
        ← Back to Dashboard
      </Link>
    </section>
  );
}
