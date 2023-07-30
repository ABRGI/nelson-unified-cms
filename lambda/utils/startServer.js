/**
 * Starts the server on the specified port.
 *
 * @param {Object} app - The Express application instance.
 * @param {number} port - The port number to listen on.
 * @returns {void}
 */
const startServer = (app, port) => {
    const server = app.listen(port, () => {
        console.log(`API listening on port ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying another port...`);
            port += 1;
            startServer(app, port);
        } else {
            console.error('An error occurred:', err);
        }
    });
};

module.exports = startServer;