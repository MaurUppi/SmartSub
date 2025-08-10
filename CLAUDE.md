# SmartSub-OpenVINO Project Memory

**Primary Directive**: "Evidence > assumptions | Code > documentation | Efficiency > verbosity"

## Project Context

- **Current Branch**: feature/openvino-integration
- **Main Branch**: main (for PRs)
- **Active Work**: Types consolidation across 6 domains
- **Task Documents**: `.claude/specs/openvino-integration/task-types-consolidation-*.md`

## Universal Execution Rules

### 1. Task Document Compliance

- **MANDATORY**: Read your assigned task document COMPLETELY before starting
- **Task Files Location**: `.claude/specs/openvino-integration/`
- **Follow task document EXACTLY** - They contain specific code templates and instructions
- **Do NOT deviate** from the plan specified in your task document

### 2. Phase-by-Phase Execution

- **Work phase by phase** - Complete all tasks in Phase 1 before moving to Phase 2
- **Sequential execution** - Tasks often depend on previous completions
- **Use git stash between phases** as documented in task files
- **Document phase completion** before moving to next

### 3. Import Path Rules (CRITICAL)

- **Types**: Use absolute imports: e.g `'types/gpu'` NOT `'../types/gpu'`
- **Helper files**: e.g Use relative imports to types: `'../../types/gpu'`
- **Test files**: e.g Use absolute imports: `'types/gpu'`
- **Verify**: e.g `grep -r "from.*types" --include="*.ts"`

### 4. Testing & Validation

- **Test after each task** - Run TypeScript compilation to verify
- **Zero tolerance**: TypeScript must compile with 0 errors
- **Run specified tests**: Each task document lists required tests
- **Verify imports**: Check import paths follow rules above

### 5. Git Commit Strategy

- **Commit with provided messages** - Each task has a specific commit message format
- **Atomic commits**: One task = one commit
- **Format**: `refactor(types): [Task X.X.X] Description`
- **Immediate commits**: Don't batch changes

### 6. Documentation Updates

- **Update task status**: Mark ✅ when complete
- **Record issues**: Document any deviations or problems
- **Update checkboxes**: Complete acceptance criteria
- **Note deferrals**: Mark as DEFERRED with reason

## Agent Failure Protocol

If an agent fails or produces incorrect output:

1. **STOP** - Do not proceed to next task
2. **REVERT** - Git reset to last known good state
3. **ANALYZE** - What went wrong?
4. **ADJUST** - Modify agent instructions
5. **RETRY** - With more specific constraints
6. **ESCALATE** - If fails twice, handle manually

## File Classification

### Can Modify:

- Files in `types/` (including provider.ts with tracking)
- Files in `main/`
- Test files
- Documentation in `.claude/specs/`

### Modified Upstream Files:

- `types/provider.ts` (UPSTREAM - Modified for integration)
  - Changes tracked in `.claude/specs/openvino-integration/upstream-provider-type-changes.md`
  - Will be submitted as PR to buxuku/SmartSub upon project completion

### DO NOT MODIFY:

- Any other file marked as UPSTREAM in task documents

## Common Commands

```bash
# Type checking
npm run type-check

# Test specific file
npm test -- test/unit/[filename]

# Check circular dependencies
npx madge --circular types/

# Git checkpoint
git add -A && git stash

# Restore from stash
git stash pop
```

## DO NOT DO List

- **DO NOT** modify upstream files without explicit approval
- **DO NOT** skip tests after making changes
- **DO NOT** make non-atomic commits
- **DO NOT** proceed with TypeScript errors
- **DO NOT** explore beyond task scope
- **DO NOT** make architectural decisions outside the plan
- **DO NOT** create new documentation unless requested

## Sub-Agent Coordination

- **One file at a time**: Only one agent modifies a file
- **Check git status**: Before starting any modifications
- **Clear handoffs**: Document what was changed
- **No overwrites**: Respect other agents' changes
- **Follow task order**: Dependencies matter

## Remember

- **Task documents are your source of truth**
- **Each task has specific requirements** - Read them
- **When in doubt, check the task document**
- **If task document unclear, ask for clarification**

---

Last Updated: 2025-01-10
Version: 1.0
