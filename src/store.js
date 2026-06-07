import { drivers, jobs } from "./data.js";

const validJobStatuses = new Set([
  "new",
  "assigned",
  "in_progress",
  "completed",
  "cancelled"
]);

const validDriverStatuses = new Set(["available", "on_job", "off_duty"]);
const validPriorities = new Set(["low", "normal", "high", "urgent"]);

const createId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const timestamp = () => new Date().toISOString();

const publicJob = (job) => ({
  ...job,
  assignedDriver: job.assignedDriverId
    ? drivers.find((driver) => driver.id === job.assignedDriverId) ?? null
    : null
});

export const listJobs = ({ status, priority, q } = {}) => {
  const query = q?.trim().toLowerCase();

  return jobs
    .filter((job) => (status ? job.status === status : true))
    .filter((job) => (priority ? job.priority === priority : true))
    .filter((job) => {
      if (!query) return true;
      return [
        job.title,
        job.customerName,
        job.contactName,
        job.pickupAddress,
        job.dropoffAddress
      ].some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
    .map(publicJob);
};

export const getJob = (id) => {
  const job = jobs.find((candidate) => candidate.id === id);
  return job ? publicJob(job) : null;
};

export const createJob = (payload) => {
  const required = [
    "title",
    "customerName",
    "pickupAddress",
    "dropoffAddress",
    "requestedPickupAt",
    "dueAt"
  ];
  const missing = required.filter((field) => !payload[field]);

  if (missing.length > 0) {
    return { error: `Missing required field(s): ${missing.join(", ")}` };
  }

  const priority = payload.priority ?? "normal";
  if (!validPriorities.has(priority)) {
    return { error: `Invalid priority: ${priority}` };
  }

  const createdAt = timestamp();
  const job = {
    id: createId("job"),
    title: payload.title,
    customerName: payload.customerName,
    contactName: payload.contactName ?? "",
    contactPhone: payload.contactPhone ?? "",
    pickupAddress: payload.pickupAddress,
    dropoffAddress: payload.dropoffAddress,
    priority,
    status: "new",
    assignedDriverId: null,
    requestedPickupAt: payload.requestedPickupAt,
    dueAt: payload.dueAt,
    notes: payload.notes ?? "",
    createdAt,
    updatedAt: createdAt,
    statusUpdates: [
      {
        id: createId("upd"),
        status: "new",
        message: "Job created.",
        createdAt
      }
    ]
  };

  jobs.push(job);
  return { job: publicJob(job) };
};

export const updateJob = (id, payload) => {
  const job = jobs.find((candidate) => candidate.id === id);
  if (!job) return { error: "Job not found", statusCode: 404 };

  if (payload.status && !validJobStatuses.has(payload.status)) {
    return { error: `Invalid job status: ${payload.status}` };
  }

  if (payload.priority && !validPriorities.has(payload.priority)) {
    return { error: `Invalid priority: ${payload.priority}` };
  }

  const editableFields = [
    "title",
    "customerName",
    "contactName",
    "contactPhone",
    "pickupAddress",
    "dropoffAddress",
    "priority",
    "requestedPickupAt",
    "dueAt",
    "notes"
  ];

  for (const field of editableFields) {
    if (payload[field] !== undefined) job[field] = payload[field];
  }

  if (payload.status && payload.status !== job.status) {
    job.status = payload.status;
    job.statusUpdates.push({
      id: createId("upd"),
      status: payload.status,
      message: payload.message ?? `Status changed to ${payload.status}.`,
      driverId: job.assignedDriverId,
      createdAt: timestamp()
    });
  }

  job.updatedAt = timestamp();
  return { job: publicJob(job) };
};

export const assignDriver = (jobId, driverId) => {
  const job = jobs.find((candidate) => candidate.id === jobId);
  if (!job) return { error: "Job not found", statusCode: 404 };

  const driver = drivers.find((candidate) => candidate.id === driverId);
  if (!driver) return { error: "Driver not found", statusCode: 404 };

  if (driver.status === "off_duty") {
    return { error: "Driver is off duty", statusCode: 409 };
  }

  if (driver.activeJobId && driver.activeJobId !== job.id) {
    return {
      error: `Driver is already assigned to job ${driver.activeJobId}`,
      statusCode: 409
    };
  }

  const previousDriver = drivers.find(
    (candidate) => candidate.id === job.assignedDriverId
  );
  if (previousDriver && previousDriver.id !== driver.id) {
    previousDriver.activeJobId = null;
    previousDriver.status = "available";
    previousDriver.updatedAt = timestamp();
  }

  const updatedAt = timestamp();
  job.assignedDriverId = driver.id;
  job.status = job.status === "new" ? "assigned" : job.status;
  job.updatedAt = updatedAt;
  job.statusUpdates.push({
    id: createId("upd"),
    status: job.status,
    message: `Assigned to ${driver.name}.`,
    driverId: driver.id,
    createdAt: updatedAt
  });

  driver.status = "on_job";
  driver.activeJobId = job.id;
  driver.updatedAt = updatedAt;

  return { job: publicJob(job) };
};

export const addStatusUpdate = (jobId, payload) => {
  const job = jobs.find((candidate) => candidate.id === jobId);
  if (!job) return { error: "Job not found", statusCode: 404 };

  if (!payload.status || !validJobStatuses.has(payload.status)) {
    return { error: "A valid status is required" };
  }

  const createdAt = timestamp();
  job.status = payload.status;
  job.updatedAt = createdAt;
  job.statusUpdates.push({
    id: createId("upd"),
    status: payload.status,
    message: payload.message ?? "",
    driverId: payload.driverId ?? job.assignedDriverId,
    createdAt
  });

  if (payload.status === "completed" || payload.status === "cancelled") {
    const driver = drivers.find((candidate) => candidate.id === job.assignedDriverId);
    if (driver) {
      driver.status = "available";
      driver.activeJobId = null;
      driver.updatedAt = createdAt;
    }
  }

  return { job: publicJob(job) };
};

export const listDrivers = ({ status } = {}) =>
  drivers
    .filter((driver) => (status ? driver.status === status : true))
    .sort((a, b) => a.name.localeCompare(b.name));

export const createDriver = (payload) => {
  const required = ["name", "phone", "vehicle"];
  const missing = required.filter((field) => !payload[field]);

  if (missing.length > 0) {
    return { error: `Missing required field(s): ${missing.join(", ")}` };
  }

  const status = payload.status ?? "available";
  if (!validDriverStatuses.has(status)) {
    return { error: `Invalid driver status: ${status}` };
  }

  const driver = {
    id: createId("drv"),
    name: payload.name,
    phone: payload.phone,
    vehicle: payload.vehicle,
    status,
    currentLocation: payload.currentLocation ?? "",
    activeJobId: null,
    updatedAt: timestamp()
  };

  drivers.push(driver);
  return { driver };
};

export const updateDriver = (id, payload) => {
  const driver = drivers.find((candidate) => candidate.id === id);
  if (!driver) return { error: "Driver not found", statusCode: 404 };

  if (payload.status && !validDriverStatuses.has(payload.status)) {
    return { error: `Invalid driver status: ${payload.status}` };
  }

  for (const field of ["name", "phone", "vehicle", "status", "currentLocation"]) {
    if (payload[field] !== undefined) driver[field] = payload[field];
  }

  driver.updatedAt = timestamp();
  return { driver };
};

export const getDashboard = () => {
  const jobsByStatus = jobs.reduce((summary, job) => {
    summary[job.status] = (summary[job.status] ?? 0) + 1;
    return summary;
  }, {});

  const driversByStatus = drivers.reduce((summary, driver) => {
    summary[driver.status] = (summary[driver.status] ?? 0) + 1;
    return summary;
  }, {});

  const activeJobs = jobs.filter((job) =>
    ["assigned", "in_progress"].includes(job.status)
  );

  return {
    totals: {
      jobs: jobs.length,
      drivers: drivers.length,
      activeJobs: activeJobs.length,
      newJobs: jobsByStatus.new ?? 0
    },
    jobsByStatus,
    driversByStatus,
    upcomingJobs: listJobs().slice(0, 5)
  };
};
