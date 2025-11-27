import { and, eq, or } from 'drizzle-orm';
import { db } from '../src/libs/DB';
import { moduleAiPromptsSchema, usersSchema } from '../src/models/Schema';

async function testApiQuery() {
  try {
    // Get a test user (first super_admin or org_admin)
    const user = await db.query.usersSchema.findFirst({
      where: or(
        eq(usersSchema.role, 'super_admin'),
        eq(usersSchema.role, 'org_admin'),
        eq(usersSchema.role, 'therapist'),
      ),
    });

    if (!user) {
      console.error('No user found');
      process.exit(1);
    }

    console.log(`Testing with user: ${user.email} (role: ${user.role})`);
    console.log(`Organization ID: ${user.organizationId}`);
    console.log('');

    // Replicate the API query exactly
    const prompts = await db
      .select()
      .from(moduleAiPromptsSchema)
      .where(
        and(
          eq(moduleAiPromptsSchema.isActive, true),
          or(
            eq(moduleAiPromptsSchema.scope, 'system'),
            and(
              eq(moduleAiPromptsSchema.scope, 'organization'),
              eq(moduleAiPromptsSchema.organizationId, user.organizationId!),
            ),
            eq(moduleAiPromptsSchema.createdBy, user.id),
          ),
        ),
      )
      .orderBy(
        moduleAiPromptsSchema.scope,
        moduleAiPromptsSchema.category,
        moduleAiPromptsSchema.name,
      );

    console.log(`Query returned ${prompts.length} prompts\n`);

    // Group by category
    const byCategory = prompts.reduce(
      (acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('By category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\nAll prompts:');
    prompts.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.category}] ${p.name} (scope: ${p.scope})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testApiQuery();
