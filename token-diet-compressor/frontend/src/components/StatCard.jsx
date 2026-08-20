import { motion } from "framer-motion";

export default function StatCard({ icon, label, value, sublabel, accent = "violet", children }) {
  return (
    <motion.div
      className={`card stat-card stat-card--${accent}`}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <div className="stat-card-top">
        {icon && <span className="stat-card-icon">{icon}</span>}
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {sublabel && <div className="stat-card-sublabel">{sublabel}</div>}
      </div>
      {children && <div className="stat-card-visual">{children}</div>}
    </motion.div>
  );
}
