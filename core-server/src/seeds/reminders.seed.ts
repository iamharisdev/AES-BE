// core-server/src/seeds/reminders.seed.ts
import { db } from "../db";
import { reminderTemplate } from "../models/reminder-template";
import { reminderRule } from "../models/reminder-rule";
import { eq } from "drizzle-orm";

export async function seedReminders() {
  console.log("?? Seeding reminder templates and rules...");

  const templates = [
    { code: "week_8", providerTemplateId: "HX25bbb2a7c6b5e41f5f2008cd37e30db9" },
    { code: "week_12", providerTemplateId: "HX9da127dd85b1aefb79c6c870e37e5af0" },
    { code: "week_17", providerTemplateId: "HXfbb5a2acda215003824d44db5a789979" },
    { code: "week_20", providerTemplateId: "HX3c615fbb1b2082806b06d9f2d2e06c4d" },
    { code: "week_26", providerTemplateId: "HX2472e26e26f084a71d866b282256ef83" },
    { code: "week_28", providerTemplateId: "HXb670e51e37e72eeb622524e481729b81" },
    { code: "week_30", providerTemplateId: "HX729e5bca62ba3719180ed75d829a55e2" },
    { code: "week_34", providerTemplateId: "HX94ecbf3f43b4bae2afffda6dddad480c" },
    { code: "week_36", providerTemplateId: "HX95a0846b3377d3615e3f0bcc4d6ddef6" },
    { code: "week_38", providerTemplateId: "HXe628973e3ac94e0b3fccbf568824e5f6" },
    { code: "week_40", providerTemplateId: "HX2b910f7248763dcddbcb746a13ccbae7" },
    { code: "inactivity_48h", providerTemplateId: "HXe0598be1a93bf66fa04dcbdddcdbd869" },
  ];

  // Insert templates if missing
  for (const tpl of templates) {
    const existing = await db
      .select()
      .from(reminderTemplate)
      .where(eq(reminderTemplate.code, tpl.code));

    if (existing.length === 0) {
      await db.insert(reminderTemplate).values({
        code: tpl.code,
        providerTemplateId: tpl.providerTemplateId,
        provider: "twilio",
        channel: "whatsapp",
        isActive: true,
      });
      console.log(`? Inserted template: ${tpl.code}`);
    } else {
      console.log(`??  Template already exists: ${tpl.code}`);
    }
  }

  // Week-based rules
  const weekRules = [
    { code: "week_8", week: 8 },
    { code: "week_12", week: 12 },
    { code: "week_17", week: 17 },
    { code: "week_20", week: 20 },
    { code: "week_26", week: 26 },
    { code: "week_28", week: 28 },
    { code: "week_30", week: 30 },
    { code: "week_34", week: 34 },
    { code: "week_36", week: 36 },
    { code: "week_38", week: 38 },
    { code: "week_40", week: 40 },
  ];

  for (const wr of weekRules) {
    const tpl = await db
      .select()
      .from(reminderTemplate)
      .where(eq(reminderTemplate.code, wr.code));

    if (tpl.length > 0) {
      const existingRule = await db
        .select()
        .from(reminderRule)
        .where(eq(reminderRule.targetWeek, wr.week));

      if (existingRule.length === 0) {
        await db.insert(reminderRule).values({
          templateId: tpl[0].id,
          targetWeek: wr.week,
          isActive: true,
        });
        console.log(`? Inserted rule for week ${wr.week}`);
      } else {
        console.log(`??  Rule already exists for week ${wr.week}`);
      }
    }
  }

  // Inactivity rule
  const inactivityTpl = await db
    .select()
    .from(reminderTemplate)
    .where(eq(reminderTemplate.code, "inactivity_48h"));

  if (inactivityTpl.length > 0) {
    const existingInactivityRule = await db
      .select()
      .from(reminderRule)
      .where(eq(reminderRule.triggerCode, "inactivity_48h"));

    if (existingInactivityRule.length === 0) {
      await db.insert(reminderRule).values({
        templateId: inactivityTpl[0].id,
        triggerCode: "inactivity_48h",
        isActive: true,
      });
      console.log("? Inserted inactivity_48h rule");
    } else {
      console.log("??  Inactivity rule already exists");
    }
  }

  console.log("?? Reminder seeding complete.");
}

// Allow running directly with Bun
if (import.meta.main) {
  seedReminders()
    .then(() => {
      console.log("? Seeding completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("? Seeding failed:", err);
      process.exit(1);
    });
}
