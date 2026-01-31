# Grut — A My own VCS ⚙️

[![Author: Deep Saha](https://img.shields.io/badge/author-Deep%20Saha-blue)]

**Author:** Deep Saha  
**Contact:** Open an issue or find me on GitHub (search for `Deep Saha`).

**Grut** is a tiny, educational Git-like version control system implemented in Node.js. It provides a minimal set of commands to initialize a repository, add files to a staging area, create commits, view the commit history, and show diffs for commits.

---

## 🔧 Features

- Initialize a repository with `grut init` (creates a `.grut` folder)
- Stage files with `grut add <file>` (stores file contents as objects)
- Commit staged changes with `grut commit "<message>"`
- View commit history with `grut log`
- Show diffs for a specific commit with `grut show <commitHash>`

---

## 🚀 Quick Start

Prerequisites:
- Node.js (v16+ recommended)
- npm

1. Clone or download the project and install dependencies:

```bash
npm install
```

2. Run commands directly with Node:

```bash
node Main.mjs init
node Main.mjs add README.md
node Main.mjs commit "Initial commit"
node Main.mjs log
node Main.mjs show <commitHash>
```

3. (Optional) Install the CLI globally for convenience:

```bash
npm link
# now you can run
grut init
grut add <file>
grut commit "msg"
```

---

## 📁 Repository layout

- `.grut/` — repository metadata
  - `objects/` — stored objects (files & commits hashed by SHA-1)
  - `HEAD` — hash of the current commit (empty when none)
  - `index` — JSON array representing the staging area
- `Main.mjs` — main CLI implementation
- `package.json` — project metadata & dependencies

---

## 🧠 How it works (functions)

- `init()` — Creates `.grut` folder and initial `HEAD` and `index` files. If already initialized, reports so.

- `add(file)` —
  - Reads file contents
  - Hashes content with SHA-1 and stores the file under `.grut/objects/<hash>` (if not already present)
  - Updates `index` with `{ path, hash }` (staging)

- `commit(message)` —
  - Reads the staging `index` and current `HEAD`
  - If index is empty, prints `Nothing to commit`
  - Creates a commit object with timestamp, message, parent, and files
  - Stores the commit in `objects/<commitHash>` and updates `HEAD`
  - Clears the `index`

- `log()` —
  - Walks commits starting from `HEAD` and prints each commit's hash, date, and message

- `show(commitHash)` —
  - Loads commit data and prints diffs for each file in that commit compared with its parent (or shows new files if no parent)
  - Uses `diff` library to compute and colorize additions (green) and removals (red)

---

## ⚠️ Notes & Tips

- This tool is intentionally minimal and meant for learning: no branches, merges, or blob compression.
- Commit hashes are raw SHA-1 of the commit JSON — keep them handy for `grut show`.
- Use `node Main.mjs <command>` if you haven't run `npm link`.

---

## 🧩 Contributing

Contributions, bug reports, and improvements are welcome. Please open an issue or a PR with a clear description.

---

## 👨‍💻 Author

**Deep Saha**  