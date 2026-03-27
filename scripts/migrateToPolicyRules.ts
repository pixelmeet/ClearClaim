// scripts/migrateToPolicyRules.ts
// Run ONCE: npx ts-node --project tsconfig.json scripts/migrateToPolicyRules.ts
// Or: npx tsx scripts/migrateToPolicyRules.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const pColl = db.collection('policyrules');

  // Check if migration already done
  const existingCount = await pColl.countDocuments();
  if (existingCount > 0) {
    console.log(`Found ${existingCount} existing PolicyRule documents. Skipping migration to avoid duplicates.`);
    console.log('If you want to re-run, delete all policyrules documents first.');
    await mongoose.disconnect();
    return;
  }

  let created = 0;

  // ─── Migrate ApprovalFlows ──────────────────────────────────────────────
  const flowsColl = db.collection('approvalflows');
  const flows = await flowsColl.find({}).toArray();
  console.log(`Found ${flows.length} ApprovalFlow documents to migrate`);

  for (const flow of flows) {
    const steps: any[] = [];
    let idx = 0;

    // Manager step
    if (flow.isManagerApprover) {
      steps.push({
        stepIndex: idx++,
        approverType: 'MANAGER',
        approverId: null,
        approverRole: null,
        required: true,
        autoApprove: false,
        label: 'Manager approval',
      });
    }

    // Flow steps
    for (const step of (flow.steps ?? [])) {
      steps.push({
        stepIndex: idx++,
        approverType: step.type === 'USER' ? 'USER' : 'ROLE',
        approverId: step.userId ?? null,
        approverRole: step.role ?? null,
        required: step.required ?? true,
        autoApprove: step.autoApprove ?? false,
        label: step.label ?? null,
      });
    }

    // Conditions: if category was set on the flow, convert to a category condition
    const conditions: any[] = [];
    if (flow.category) {
      conditions.push({ field: 'category', operator: 'eq', value: flow.category });
    }

    const doc = {
      companyId:          flow.companyId,
      name:               flow.name ?? 'Migrated flow',
      description:        `Migrated from ApprovalFlow on ${new Date().toISOString()}`,
      priority:           conditions.length > 0 ? 50 : 100,
      active:             true,
      conditionLogic:     'AND',
      conditions,
      steps,
      isDefault:          conditions.length === 0, // flows with no category become the default
      fallbackBehavior:   'DEFAULT_FLOW',
      minApprovalPercent: flow.minApprovalPercent ?? 0,
      createdAt:          flow.createdAt ?? new Date(),
      updatedAt:          new Date(),
    };

    await pColl.insertOne(doc);
    created++;
    console.log(`  ✓ Migrated flow: ${flow.name ?? 'unnamed'} → PolicyRule (priority ${doc.priority}${doc.isDefault ? ', DEFAULT' : ''})`);
  }

  // ─── Migrate ApprovalRules ──────────────────────────────────────────────
  const rulesColl = db.collection('approvalrules');
  const rules = await rulesColl.find({}).toArray();
  console.log(`Found ${rules.length} ApprovalRule documents to migrate`);

  for (const rule of rules) {
    if (!rule.appliesToUser) {
      console.log(`  ⊘ Skipping rule "${rule.ruleName}" — no appliesToUser (handled by flow migration)`);
      continue;
    }

    const steps = (rule.approvers ?? [])
      .sort((a: any, b: any) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
      .map((a: any, i: number) => ({
        stepIndex:    i,
        approverType: 'USER',
        approverId:   a.user,
        approverRole: null,
        required:     a.required ?? true,
        autoApprove:  a.autoApprove ?? false,
        label:        null,
      }));

    const doc = {
      companyId:          typeof rule.organization === 'string'
                            ? new mongoose.Types.ObjectId(rule.organization)
                            : rule.organization,
      name:               rule.ruleName ?? 'Migrated rule',
      description:        `Migrated from ApprovalRule on ${new Date().toISOString()}`,
      priority:           10, // employee-specific rules run before flow-based ones
      active:             true,
      conditionLogic:     'AND',
      conditions:         [{ field: 'employeeId', operator: 'eq', value: rule.appliesToUser.toString() }],
      steps,
      isDefault:          false,
      fallbackBehavior:   'DEFAULT_FLOW',
      minApprovalPercent: rule.minApprovalPercent ?? 0,
      createdAt:          rule.createdAt ?? new Date(),
      updatedAt:          new Date(),
    };

    await pColl.insertOne(doc);
    created++;
    console.log(`  ✓ Migrated rule: ${rule.ruleName ?? 'unnamed'} → PolicyRule (priority 10, employee-specific)`);
  }

  // ─── Migrate ThresholdRules ─────────────────────────────────────────────
  const thresholdsColl = db.collection('thresholdrules');
  let thresholds: any[] = [];
  try {
    thresholds = await thresholdsColl.find({ active: true }).toArray();
    console.log(`Found ${thresholds.length} ThresholdRule documents to migrate`);
  } catch {
    console.log('No ThresholdRule collection found, skipping...');
  }

  for (const tr of thresholds) {
    const doc = {
      companyId:          tr.companyId,
      name:               tr.label ?? `Threshold: ≥${tr.minAmount}`,
      description:        `Migrated from ThresholdRule on ${new Date().toISOString()}`,
      priority:           30, // between employee-specific (10) and category-based (50)
      active:             true,
      conditionLogic:     'AND',
      conditions:         [{ field: 'amount', operator: 'gte', value: tr.minAmount }],
      steps:              [{
        stepIndex:    0,
        approverType: 'USER',
        approverId:   tr.userId,
        approverRole: null,
        required:     true,
        autoApprove:  false,
        label:        tr.label ?? 'High Value Scrutiny',
      }],
      isDefault:          false,
      fallbackBehavior:   'DEFAULT_FLOW',
      minApprovalPercent: 0,
      createdAt:          tr.createdAt ?? new Date(),
      updatedAt:          new Date(),
    };

    await pColl.insertOne(doc);
    created++;
    console.log(`  ✓ Migrated threshold: ≥${tr.minAmount} → PolicyRule (priority 30)`);
  }

  console.log(`\n✓ Migration complete: Created ${created} PolicyRule documents`);
  console.log('\nNote: Old ApprovalFlow, ApprovalRule, and ThresholdRule collections are preserved.');
  console.log('Remove them manually after verifying the new system works correctly.');

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
