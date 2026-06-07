import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  addStatusUpdate,
  assignDriver,
  createDriver,
  createJob,
  getDashboard,
  getJob,
  listDrivers,
  listJobs,
  updateDriver,
  updateJob
} from "./store.js";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const sendHtml = async (res, filePath) => {
  try {
    const html = await readFile(filePath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
};

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(body, null, 2));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { __invalidJson: true };
  }
};

const parseUrl = (req) => new URL(req.url ?? "/", `http://${req.headers.host}`);

const match = (pathname, pattern) => {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
};

const requireJson = async (req, res) => {
  const payload = await readBody(req);
  if (payload.__invalidJson) {
    sendJson(res, 400, { error: "Request body must be valid JSON" });
    return null;
  }
  return payload;
};

const handleResult = (res, result, key) => {
  if (result.error) {
    sendJson(res, result.statusCode ?? 400, { error: result.error });
    return;
  }

  sendJson(res, result.statusCode ?? 200, key ? { [key]: result[key] } : result);
};

const server = http.createServer(async (req, res) => {
  const url = parseUrl(req);
  const { pathname, searchParams } = url;
  const method = req.method ?? "GET";

  if (method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok", service: "dispatchrr-api" });
    return;
  }

  if (method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    await sendHtml(res, join(publicDir, "index.html"));
    return;
  }

  if (method === "GET" && (pathname === "/admin" || pathname === "/admin.html")) {
    await sendHtml(res, join(publicDir, "admin.html"));
    return;
  }

  if (method === "GET" && pathname === "/api/dashboard") {
    sendJson(res, 200, { dashboard: getDashboard() });
    return;
  }

  if (method === "GET" && pathname === "/api/jobs") {
    sendJson(res, 200, {
      jobs: listJobs({
        status: searchParams.get("status"),
        priority: searchParams.get("priority"),
        q: searchParams.get("q")
      })
    });
    return;
  }

  if (method === "POST" && pathname === "/api/jobs") {
    const payload = await requireJson(req, res);
    if (!payload) return;
    handleResult(res, { ...createJob(payload), statusCode: 201 }, "job");
    return;
  }

  const jobParams = match(pathname, "/api/jobs/:id");
  if (jobParams && method === "GET") {
    const job = getJob(jobParams.id);
    sendJson(res, job ? 200 : 404, job ? { job } : { error: "Job not found" });
    return;
  }

  if (jobParams && method === "PATCH") {
    const payload = await requireJson(req, res);
    if (!payload) return;
    handleResult(res, updateJob(jobParams.id, payload), "job");
    return;
  }

  const assignParams = match(pathname, "/api/jobs/:id/assign");
  if (assignParams && method === "POST") {
    const payload = await requireJson(req, res);
    if (!payload) return;
    handleResult(res, assignDriver(assignParams.id, payload.driverId), "job");
    return;
  }

  const statusParams = match(pathname, "/api/jobs/:id/status-updates");
  if (statusParams && method === "POST") {
    const payload = await requireJson(req, res);
    if (!payload) return;
    handleResult(res, addStatusUpdate(statusParams.id, payload), "job");
    return;
  }

  if (method === "GET" && pathname === "/api/drivers") {
    sendJson(res, 200, {
      drivers: listDrivers({ status: searchParams.get("status") })
    });
    return;
  }

  if (method === "POST" && pathname === "/api/drivers") {
    const payload = await requireJson(req, res);
    if (!payload) return;
    handleResult(res, { ...createDriver(payload), statusCode: 201 }, "driver");
    return;
  }

  const driverParams = match(pathname, "/api/drivers/:id");
  if (driverParams && method === "PATCH") {
    const payload = await requireJson(req, res);
    if (!payload) return;
    handleResult(res, updateDriver(driverParams.id, payload), "driver");
    return;
  }

  sendJson(res, 404, { error: "Route not found" });
});

server.listen(port, () => {
  console.log(`Dispatchrr API listening on http://localhost:${port}`);
});
