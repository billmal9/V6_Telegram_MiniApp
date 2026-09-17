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

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                command: command,
                message: "Command received"
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