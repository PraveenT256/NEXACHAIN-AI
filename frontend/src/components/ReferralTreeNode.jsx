import { useState } from "react";

export default function ReferralTreeNode({ node }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className="referral-tree-node">
      <div className="referral-tree-row">
        {hasChildren ? (
          <button className="referral-tree-toggle" onClick={() => setIsExpanded((prev) => !prev)}>
            {isExpanded ? "−" : "+"}
          </button>
        ) : (
          <span className="referral-tree-toggle-placeholder" />
        )}
        <span className="referral-tree-name">{node.fullName}</span>
        <span className="referral-tree-email">{node.email}</span>
        <span className={`status-badge status-${node.accountStatus.toLowerCase()}`}>
          {node.accountStatus}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <ul className="referral-tree-children">
          {node.children.map((child) => (
            <ReferralTreeNode key={child._id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
