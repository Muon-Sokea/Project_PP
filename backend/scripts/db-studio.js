// Wrapper around `prisma studio` that avoids the EADDRINUSE crash you get
// from running `npm run db:studio` twice — Studio has no "already running"
// check of its own, so a second run just throws and dies. This checks the
// port first: if Studio is already up, it says so and exits cleanly instead
// of stack-tracing; otherwise it starts Studio normally.
const net = require("net");
const { spawn } = require("child_process");

const PORT = 5555;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => { resolve(false); });
  });
}

(async () => {
  if (await isPortInUse(PORT)) {
    console.log(`Prisma Studio is already running — open http://localhost:${PORT}`);
    process.exit(0);
  }

  const child = spawn(`npx prisma studio --port ${PORT}`, {
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
})();
