import { Command } from "commander";
import { startWorker, stopWorker } from "@/shared/services/mailer/worker";

const program = new Command();

program
  .name("worker-manager")
  .description("Manage email worker")
  .version("1.0.0");

program
  .command("start")
  .description("Start the email worker")
  .action(async () => {
    try {
      await startWorker();
      console.log("Email worker started successfully");
    } catch (error) {
      console.error("Failed to start worker:", error);
      process.exit(1);
    }
  });

program
  .command("stop")
  .description("Stop the email worker")
  .action(async () => {
    try {
      await stopWorker();
      console.log("Email worker stopped successfully");
    } catch (error) {
      console.error("Failed to stop worker:", error);
      process.exit(1);
    }
  });

program
  .command("restart")
  .description("Restart the email worker")
  .action(async () => {
    try {
      await stopWorker();
      await startWorker();
      console.log("Email worker restarted successfully");
    } catch (error) {
      console.error("Failed to restart worker:", error);
      process.exit(1);
    }
  });

program.parse();
