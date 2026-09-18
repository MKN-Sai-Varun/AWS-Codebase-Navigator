import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Folder, FileCode } from "lucide-react";

// Builds a nested tree from a flat list of { path, type } entries.
function buildTree(files) {
  const root = { name: "", children: {}, isFile: false };
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let node = root;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          children: {},
          isFile: isLast
        };
      }
      node = node.children[part];
    });
  }
  return root;
}

function TreeNode({ node, depth, selectedFile, onFileSelect, filterActive }) {
  const [expanded, setExpanded] = useState(filterActive ? true : depth === 0);
  const childEntries = Object.values(node.children).sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  if (node.isFile) {
    const isSelected = selectedFile === node.path;
    return (
      <div
        className={`tree-node${isSelected ? " selected" : ""}`}
        style={{ paddingLeft: 8 + depth * 14 }}
        role="button"
        tabIndex={0}
        onClick={() => onFileSelect(node.path)}
        onKeyDown={(event) => event.key === "Enter" && onFileSelect(node.path)}
      >
        <FileCode className="icon" />
        <span>{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      {depth > 0 && (
        <div
          className="tree-node"
          style={{ paddingLeft: 8 + (depth - 1) * 14 }}
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((prev) => !prev)}
          onKeyDown={(event) => event.key === "Enter" && setExpanded((prev) => !prev)}
        >
          {expanded ? <ChevronDown className="icon" /> : <ChevronRight className="icon" />}
          <Folder className="icon" />
          <span>{node.name}</span>
        </div>
      )}
      {expanded &&
        childEntries.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth > 0 ? depth + 1 : depth}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            filterActive={filterActive}
          />
        ))}
    </div>
  );
}

export default function FileExplorer({ files, selectedFile, onFileSelect }) {
  const [query, setQuery] = useState("");

  const filteredFiles = useMemo(() => {
    if (!query.trim()) return files;
    const lower = query.toLowerCase();
    return files.filter((file) => file.path.toLowerCase().includes(lower));
  }, [files, query]);

  const tree = useMemo(() => buildTree(filteredFiles), [filteredFiles]);
  const filterActive = query.trim().length > 0;

  return (
    <div className="panel explorer-panel">
      <div className="explorer-search">
        <input
          type="text"
          placeholder="Filter files…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Filter files"
        />
      </div>
      <div className="tree">
        {filteredFiles.length === 0 ? (
          <div style={{ padding: 12, color: "var(--text-faint)", fontSize: 13 }}>
            No files match "{query}".
          </div>
        ) : (
          <TreeNode
            node={tree}
            depth={0}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            filterActive={filterActive}
          />
        )}
      </div>
    </div>
  );
}