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
                message: "Telegram command sent"
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
