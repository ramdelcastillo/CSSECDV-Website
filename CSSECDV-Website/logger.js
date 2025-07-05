import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, "logs.json");

const logEvent = async (event) => {
    const logEntry = {
        timestamp: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
        ...event,
    };

    try {
        let logs = [];

        if (fs.existsSync(logFilePath)) {
            const fileData = await fs.promises.readFile(logFilePath, "utf8");
            logs = JSON.parse(fileData || "[]");
        }

        logs.push(logEntry);

        await fs.promises.writeFile(logFilePath, JSON.stringify(logs, null, 2)); // Append to file
    } catch (error) {
        console.error("Error writing to log file:", error);
    }
};

export default logEvent;
