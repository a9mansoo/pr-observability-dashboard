# PR Observability Dashboard

A lightweight PR intelligence system that aggregates GitHub pull request data, applies rule-based classification, and generates a static, navigable HTML dashboard.

It helps teams answer one question:

> **“What PRs need my attention right now?”**

---

## Architecture

This system is composed of three parts:

### 1. GitHub Actions (Orchestrator)

* Runs on a schedule or trigger
* Executes the collector and renderer
* Publishes the generated dashboard

---

### 2. JavaScript Collector

* Fetches PR data from the GitHub API
* Normalizes complex API responses
* Applies rule-based classification

---

### 3. Python Renderer

* Consumes normalized JSON
* Generates a static HTML dashboard

---

## Data Flow

```
GitHub API (complex PR objects)
        ↓
Collector (normalize + classify)
        ↓
Normalized JSON (stable schema)
        ↓
Renderer → Static Dashboard
```

---

## Usage

### Reusable GitHub Workflow

```yaml
name: PR Observability

on:
  schedule:
    - cron: "0 * * * *"

jobs:
  observe:
    uses: a9mansoo/.github/workflows/pull_request_monitor.yml@v1
    with:
      PR_TYPES: 'READY_FOR_REVIEW'
      REPOSITORY: ${{ github.repository }}
      CONFIG_PATH: .github/pr-rules.json
    secrets:
      REPO_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Configuration

PR classification is driven by a JSON configuration file validated using a strict schema.

### File: `.github/pr-rules.json`

```json
{
  "READY_FOR_REVIEW": {
    "rules": [
      {
        "type": "labels_presence",
        "includes": ["ready_for_review"],
        "excludes": ["wip"]
      },
      {
        "type": "labels_actor",
        "labels_to_check": ["ready_for_review"],
        "actor": "a9mansoo"
      }
    ]
  }
}
```

---

## Configuration Model

The configuration is a mapping of:

```
STATE_NAME → rule definitions
```

### Structure

```json
{
  "<STATE_NAME>": {
    "rules": [ ... ]
  }
}
```

### Key Concepts

* Each **top-level key** represents a PR state
* Each state contains a list of **rules**
* All rules within a state must pass (**logical AND**)
* A PR is assigned to a state if it satisfies all rules

---

## JSON Schema

The configuration must conform to:

```json
{
  "type": "object",
  "additionalProperties": {
    "type": "object",
    "required": ["rules"],
    "properties": {
      "rules": {
        "type": "array",
        "items": {
          "oneOf": [
            { "$ref": "#/definitions/labels_presence" },
            { "$ref": "#/definitions/labels_actor" }
          ]
        }
      }
    }
  },
  "definitions": {
    "labels_presence": {
      "type": "object",
      "required": ["type", "includes", "excludes"],
      "properties": {
        "type": { "const": "labels_presence" },
        "includes": {
          "type": "array",
          "items": { "type": "string" }
        },
        "excludes": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "labels_actor": {
      "type": "object",
      "required": ["type", "labels_to_check", "actor"],
      "properties": {
        "type": { "const": "labels_actor" },
        "labels_to_check": {
          "type": "array",
          "items": { "type": "string" }
        },
        "actor": { "type": "string" }
      }
    }
  }
}
```

---

## Supported Rules

### 1. `labels_presence`

Checks whether required labels are present and excluded labels are absent.

```json
{
  "type": "labels_presence",
  "includes": ["ready_for_review"],
  "excludes": ["wip"]
}
```

**Behavior:**

* All `includes` labels must exist
* None of the `excludes` labels may exist

---

### 2. `labels_actor`

Checks whether a specific user applied a label.

```json
{
  "type": "labels_actor",
  "labels_to_check": ["ready_for_review"],
  "actor": "alice"
}
```

**Behavior:**

* At least one label must exist
* That label must have been applied by the specified actor

⚠️ Requires PR timeline/events API.

---

## Normalized PR Schema (Internal)

GitHub API responses are large and deeply nested. The collector transforms them into a simplified structure:

```json
{
  "number": 1347,
  "title": "Amazing new feature",
  "author": "octocat",
  "state": "open",
  "isDraft": false,
  "createdAt": "2011-01-26T19:01:12Z",
  "updatedAt": "2011-01-26T19:01:12Z",
  "url": "https://github.com/octocat/Hello-World/pull/1347"
}
```

---

## Why Normalization Exists

The GitHub API includes:

* deeply nested objects
* redundant metadata
* irrelevant fields for PR triage

Normalization ensures:

* stable schema for rule evaluation
* simpler logic
* cleaner rendering
* predictable outputs

---

## Output Schema

The collector produces:

```json
{
  "generatedAt": "2026-04-18T12:00:00Z",
  "repository": "owner/repo",
  "pullRequests": [
    {
      "number": 42,
      "title": "Fix API timeout",
      "author": "alice",
      "url": "https://github.com/...",
      "state": "READY_FOR_REVIEW"
    }
  ]
}
```

---

## Dashboard Output

The generated dashboard includes:

* PR grouping by state
* quick navigation links
* static HTML (no runtime dependencies)

---

## Rule Evaluation

For each PR:

```
PR → evaluate rules → matches state → included in dashboard
```

* Rules within a state are ANDed
* State assignment depends on rule satisfaction
* Order of evaluation may affect classification

---

## Design Principles

* **Deterministic output**: same input → same output
* **Schema-first validation** (AJV)
* **Separation of concerns**
* **Static output** (no runtime dependencies)
* **Rule-driven system**

---

## Why this exists

GitHub gives you raw data.

This system gives you:

> **decision-ready information**

---

## Future Extensions

* PR risk scoring (files changed, diff size)
* CI flakiness detection
* multi-repo aggregation
* Slack notifications
* interactive dashboard (React frontend)

---
