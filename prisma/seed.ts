import {
  PrismaClient,
  EntryCategory,
  EntryType,
  EntryStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type EntrySpec = {
  category: EntryCategory;
  type: EntryType;
  amount: number;
  description: string;
  status: EntryStatus;
  submitter: "maker" | "maker2";
  daysAgoCreated: number;
  decided: boolean;
  rejectionReason?: string;
  softDeleted?: boolean;
};

const entrySpecs: EntrySpec[] = [
  {
    category: "rent",
    type: "out",
    amount: 4500,
    description: "Office rent — main branch",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 3,
    decided: true,
  },
  {
    category: "utilities",
    type: "out",
    amount: 320.5,
    description: "Electricity + water, October",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 5,
    decided: true,
  },
  {
    category: "salaries",
    type: "out",
    amount: 18500,
    description: "Payroll run — engineering team",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 2,
    decided: true,
  },
  {
    category: "client_payment",
    type: "in",
    amount: 12000,
    description: "Invoice #2291 — Kestrel Retail",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 1,
    decided: true,
  },
  {
    category: "vendor_payment",
    type: "out",
    amount: 2750,
    description: "Supplier payment — packaging vendor",
    status: "submitted",
    submitter: "maker",
    daysAgoCreated: 0,
    decided: false,
  },
  {
    category: "office_supplies",
    type: "out",
    amount: 145.99,
    description: "Printer toner + stationery restock",
    status: "rejected",
    submitter: "maker",
    daysAgoCreated: 6,
    decided: true,
    rejectionReason: "Missing itemized receipt",
  },
  {
    category: "travel",
    type: "out",
    amount: 980,
    description: "Client visit — Lahore round trip",
    status: "submitted",
    submitter: "maker",
    daysAgoCreated: 1,
    decided: false,
  },
  {
    category: "marketing",
    type: "out",
    amount: 3200,
    description: "Q4 paid social campaign",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 8,
    decided: true,
  },
  {
    category: "software_subscriptions",
    type: "out",
    amount: 599,
    description: "Annual SaaS renewals batch",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 4,
    decided: true,
  },
  {
    category: "insurance",
    type: "out",
    amount: 1100,
    description: "Office liability insurance premium",
    status: "submitted",
    submitter: "maker",
    daysAgoCreated: 0,
    decided: false,
  },
  {
    category: "taxes",
    type: "out",
    amount: 6400,
    description: "Quarterly withholding tax deposit",
    status: "approved",
    submitter: "maker2",
    daysAgoCreated: 7,
    decided: true,
  },
  {
    category: "professional_fees",
    type: "out",
    amount: 2200,
    description: "External audit — legal consultation",
    status: "rejected",
    submitter: "maker2",
    daysAgoCreated: 9,
    decided: true,
    rejectionReason: "Needs manager pre-approval on file",
  },
  {
    category: "equipment",
    type: "out",
    amount: 5300,
    description: "Two workstation laptops",
    status: "approved",
    submitter: "maker2",
    daysAgoCreated: 2,
    decided: true,
  },
  {
    category: "misc",
    type: "out",
    amount: 210,
    description: "Team lunch — sprint close",
    status: "submitted",
    submitter: "maker2",
    daysAgoCreated: 0,
    decided: false,
  },
  {
    category: "rent",
    type: "out",
    amount: 4500,
    description: "Office rent — branch two",
    status: "approved",
    submitter: "maker2",
    daysAgoCreated: 32,
    decided: true,
  },
  {
    category: "client_payment",
    type: "in",
    amount: 8000,
    description: "Invoice #2288 — Marlow Textiles",
    status: "approved",
    submitter: "maker2",
    daysAgoCreated: 25,
    decided: true,
  },
  {
    category: "vendor_payment",
    type: "out",
    amount: 1420,
    description: "Raw materials — August batch",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 40,
    decided: true,
    softDeleted: true,
  },
  {
    category: "marketing",
    type: "out",
    amount: 890,
    description: "Print ad placement — trial run",
    status: "approved",
    submitter: "maker",
    daysAgoCreated: 45,
    decided: true,
    softDeleted: true,
  },
];

async function main() {
  await prisma.auditLog.deleteMany({});
  await prisma.objection.deleteMany({});
  await prisma.accessRequest.deleteMany({});
  await prisma.entry.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  const maker = await prisma.user.create({
    data: {
      name: "Maker One",
      email: "maker1@ledgerz.com",
      passwordHash,
      role: UserRole.maker,
    },
  });

  const maker2 = await prisma.user.create({
    data: {
      name: "Maker Two",
      email: "maker2@ledgerz.com",
      passwordHash,
      role: UserRole.maker,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Manager One",
      email: "manager@ledgerz.com",
      passwordHash,
      role: UserRole.manager,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin One",
      email: "admin@ledgerz.com",
      passwordHash,
      role: UserRole.admin,
    },
  });

  const submitterMap = { maker, maker2 };
  const createdEntries: { id: number; spec: EntrySpec }[] = [];

  for (const spec of entrySpecs) {
    const submitter = submitterMap[spec.submitter];
    const createdAt = daysAgo(spec.daysAgoCreated);

    const entry = await prisma.entry.create({
      data: {
        amount: spec.amount,
        type: spec.type,
        category: spec.category,
        description: spec.description,
        status: spec.status,
        submittedBy: submitter.id,
        createdAt,
        decidedBy: spec.decided ? manager.id : null,
        decidedAt: spec.decided
          ? daysAgo(Math.max(spec.daysAgoCreated - 1, 0))
          : null,
        rejectionReason: spec.rejectionReason ?? null,
        deletedAt: spec.softDeleted
          ? daysAgo(Math.max(spec.daysAgoCreated - 2, 0))
          : null,
        deletedBy: spec.softDeleted ? manager.id : null,
      },
    });

    createdEntries.push({ id: entry.id, spec });
  }

  for (const { id, spec } of createdEntries) {
    if (spec.status === "approved" && spec.decided) {
      await prisma.auditLog.create({
        data: {
          refType: "entry",
          refId: id,
          action: "approve",
          actorId: manager.id,
        },
      });
    }
    if (spec.status === "rejected" && spec.decided) {
      await prisma.auditLog.create({
        data: {
          refType: "entry",
          refId: id,
          action: "reject",
          actorId: manager.id,
        },
      });
    }
    if (spec.softDeleted) {
      await prisma.auditLog.create({
        data: {
          refType: "entry",
          refId: id,
          action: "delete",
          actorId: manager.id,
        },
      });
    }
  }

  const rejectedEntry = createdEntries.find(
    (e) => e.spec.status === "rejected",
  );
  const approvedEntry = createdEntries.find(
    (e) => e.spec.status === "approved" && !e.spec.softDeleted,
  );

  if (rejectedEntry) {
    const objection = await prisma.objection.create({
      data: {
        entryId: rejectedEntry.id,
        raisedBy: admin.id,
        note: "Flagging for follow-up — receipt still outstanding after rejection.",
        resolved: false,
        createdAt: daysAgo(1),
      },
    });
    await prisma.auditLog.create({
      data: {
        refType: "objection",
        refId: objection.id,
        action: "create",
        actorId: admin.id,
      },
    });
  }

  if (approvedEntry) {
    const objection = await prisma.objection.create({
      data: {
        entryId: approvedEntry.id,
        raisedBy: admin.id,
        note: "Approved amount looks high relative to prior months, worth a second look.",
        resolved: true,
        createdAt: daysAgo(4),
      },
    });
    await prisma.auditLog.create({
      data: {
        refType: "objection",
        refId: objection.id,
        action: "create",
        actorId: admin.id,
      },
    });
  }

  const pendingRequest = await prisma.accessRequest.create({
    data: {
      name: "Farah Iqbal",
      email: "farah@ledgerz.com",
      requestedRole: UserRole.maker,
      note: "Joining the finance team next week, need maker access.",
      status: "pending",
      createdAt: daysAgo(1),
    },
  });

  const approvedRequest = await prisma.accessRequest.create({
    data: {
      name: "Bilal Sheikh",
      email: "bilal@ledgerz.com",
      requestedRole: UserRole.manager,
      note: "Taking over finance operations.",
      status: "approved",
      reviewedBy: manager.id,
      reviewedAt: daysAgo(2),
      createdAt: daysAgo(5),
    },
  });

  const deniedRequest = await prisma.accessRequest.create({
    data: {
      name: "Unknown Applicant",
      email: "random@example.com",
      requestedRole: UserRole.admin,
      note: null,
      status: "denied",
      reviewedBy: manager.id,
      reviewedAt: daysAgo(3),
      createdAt: daysAgo(4),
    },
  });

  await prisma.auditLog.create({
    data: {
      refType: "access_request",
      refId: approvedRequest.id,
      action: "approve",
      actorId: manager.id,
    },
  });
  await prisma.auditLog.create({
    data: {
      refType: "access_request",
      refId: deniedRequest.id,
      action: "deny",
      actorId: manager.id,
    },
  });

  console.log("Sample data seeded.");
  console.log(
    "Users: maker1@ledgerz.com, maker2@ledgerz.com, manager@ledgerz.com, admin@ledgerz.com — all password: password123",
  );
  console.log(`Entries: ${createdEntries.length}`);
  console.log(
    `Access requests: pending #${pendingRequest.id}, approved #${approvedRequest.id}, denied #${deniedRequest.id}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
