import 'dotenv/config';
import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import ejs from "ejs";
import fs from "fs";
import {logMiddleware} from "./middleware/log.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, {recursive: true});
}

// Logging middleware
app.use(logMiddleware(logsDir));

// Increment the visitor count
app.use((req, res, next) => {
    const ignoredUserAgents = ["bot", "crawler", "spider", "scanner", "curl", "wget", "python", "java", "php", 'unknown', 'discord'];
    // if the user agent contains any of the ignored user agents, skip incrementing the counter
    const userAgent = req.headers['user-agent']?.toLowerCase() || 'Unknown';
    if (ignoredUserAgents.some(ua => userAgent.toLowerCase().includes(ua))) {
        return next();
    }

    // Increment the human visit counter
    if (req.method === 'GET' && req.path === '/') {
        let ip = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.socket.remoteAddress;

        fetch(process.env.PARADAUX_API_BASE_URL + "/api/ifum/visit", {
            method: "POST",
            headers: {
                'X-SECRET': process.env.PARADAUX_API_SECRET,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ipAddress: ip,
                userAgent: req.headers['user-agent'] || 'Unknown',
            })
        }).catch(err => console.error(err));
    }
    next();
});
app.get("/", (req, res) => {
    res.render("Index", {
        apiBaseUrl: process.env.PARADAUX_API_BASE_URL
    });
});

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
    console.log(`ifuckedur.mom app listening on port ${PORT}`);
});