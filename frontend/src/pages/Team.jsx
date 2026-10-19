import { Link } from "react-router-dom";
import "./Team.css";

const teamMembers = [
  {
    number: "01",
    name: "Praveen",
    role: "Backend Developer",
    initials: "P",
    contribution:
      "Builds the server-side foundation of BlogForge, including APIs, authentication, database integration, and backend functionality.",
    skills: ["Node.js", "Express.js", "MongoDB", "REST APIs"],
    focus: "SERVER & DATA",
  },
  {
    number: "02",
    name: "Sravya",
    role: "Frontend Developer",
    initials: "S",
    contribution:
      "Works on the user interface, responsive layouts, and visual design to make BlogForge clean, accessible, and easy to use.",
    skills: ["React", "CSS", "UI Design", "Responsive UI"],
    focus: "INTERFACE & DESIGN",
  },
  {
    number: "03",
    name: "Premaja",
    role: "Frontend Developer",
    initials: "P",
    contribution:
      "Develops frontend pages and components, helping connect the interface with application functionality for a smooth blogging experience.",
    skills: ["React", "JavaScript", "Components", "API Integration"],
    focus: "PAGES & INTEGRATION",
  },
];

export default function Team() {
  return (
    <main className="team-page">
      <nav className="team-nav">
        <Link to="/" className="team-brand">
          <span className="team-brand-mark">B</span>
          <span>
            BlogForge
            <small>THE PEOPLE BEHIND THE PLATFORM</small>
          </span>
        </Link>

        <Link to="/" className="team-back-link">
          <span aria-hidden="true">←</span> Back to BlogForge
        </Link>
      </nav>

      <section className="team-hero">
        <div className="team-eyebrow">
          <span className="team-status-dot" />
          MEET THE DEVELOPERS
        </div>

        <h1>
          Built by a team.
          <br />
          <span>Made for writers.</span>
        </h1>

        <p className="team-hero-description">
          BlogForge brings together backend engineering and frontend
          development to create a home for ideas, stories, and the developer
          community.
        </p>

        <div className="team-hero-meta">
          <span>3 MEMBERS</span>
          <span className="team-meta-separator">/</span>
          <span>1 SHARED VISION</span>
          <span className="team-meta-separator">/</span>
          <span>BUILT WITH MERN</span>
        </div>
      </section>

      <section className="team-members-section">
        <div className="team-section-heading">
          <div>
            <span className="team-section-label">THE PEOPLE</span>
            <h2>Meet the team</h2>
          </div>
          <p>Different responsibilities. One product.</p>
        </div>

        <div className="team-members-grid">
          {teamMembers.map((member) => (
            <article className="team-member-card" key={member.number}>
              <div className="team-card-top">
                <span className="team-member-number">{member.number}</span>
                <span className="team-member-focus">{member.focus}</span>
              </div>

              <div className="team-avatar" aria-label={`${member.name} initials`}>
                {member.initials}
              </div>

              <h3>{member.name}</h3>
              <p className="team-member-role">{member.role}</p>

              <div className="team-card-divider" />

              <p className="team-member-contribution">
                {member.contribution}
              </p>

              <div className="team-skills">
                {member.skills.map((skill) => (
                  <span className="team-skill" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="team-principles">
        <div>
          <span className="team-section-label">HOW WE BUILD</span>
          <h2>One platform. Three perspectives.</h2>
        </div>

        <div className="team-principles-list">
          <div className="team-principle">
            <span className="team-principle-number">01</span>
            <div>
              <h3>Reliable foundations</h3>
              <p>Backend services and data handling designed to support the platform.</p>
            </div>
          </div>

          <div className="team-principle">
            <span className="team-principle-number">02</span>
            <div>
              <h3>Thoughtful interfaces</h3>
              <p>Clear layouts that help writers focus on their ideas.</p>
            </div>
          </div>

          <div className="team-principle">
            <span className="team-principle-number">03</span>
            <div>
              <h3>Collaborative development</h3>
              <p>Different areas of ownership working toward one consistent experience.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="team-footer">
        <Link to="/" className="team-footer-brand">
          <span className="team-brand-mark">B</span>
          BlogForge
        </Link>

        <p>Built with purpose, by the BlogForge team.</p>

        <Link to="/" className="team-footer-home">
          Explore the platform <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </main>
  );
}
