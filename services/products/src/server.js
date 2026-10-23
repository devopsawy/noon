import { createApp, SERVICE_NAME } from "./app.js";

const port = Number(process.env.PORT ?? 8080);
const server = createApp().listen(port, () => console.log(`${SERVICE_NAME} listening on :${port}`));

// Let in-flight requests finish when Kubernetes stops the pod.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
