const crypto = require("crypto");

exports.handler = async function (event) {
    try {
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({
                    error: "Method not allowed"
                })
            };
        }

        const data = JSON.parse(event.body || "{}");

        const command = data.command;
        const initData = data.initData;

        const allowedCommands = [
            "start",
            "pause",
            "closeall"
        ];

        if (!allowedCommands.includes(command)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Invalid command"
                })
            };
        }

        if (!initData) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    error: "Telegram authentication data missing"
                })
            };
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: "Telegram credentials are not configured"
                })
            };
        }

        // Parse Telegram initData
        const params = new URLSearchParams(initData);
        const receivedHash = params.get("hash");

        if (!receivedHash) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    error: "Telegram authentication hash missing"
                })
            };
        }

        params.delete("hash");

        // Sort parameters alphabetically
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        // Telegram Web App authentication
        const secretKey = crypto
            .createHmac("sha256", "WebAppData")
            .update(botToken)
            .digest();

        const calculatedHash = crypto
            .createHmac("sha256", secretKey)
            .update(dataCheckString)
            .digest("hex");

        if (calculatedHash !== receivedHash) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    error: "Invalid Telegram authentication"
                })
            };
        }

        // Authentication successful
        const telegramCommand = "/" + command;

        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: telegramCommand
                })
            }
        );

        const telegramData = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
            return {
                statusCode: 502,
                body: JSON.stringify({
                    error: "Telegram rejected the command"
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                command: command,
                message: "Secure Telegram command sent"
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Server error"
            })
        };
    }
};
