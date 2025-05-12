const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

let connection;

const connect = async () => {
    try {
        connection = await mysql.createConnection(config);
        return connection;
    } catch (error) {
        console.error('[-] Database connection failed:', error);
        process.exit(1);
    }
};

// Export methods
module.exports = {
    connect,
    query: async (sql, params) => {
        try {
            if (!connection) {
                await connect();
            }
            const [results] = await connection.query(sql, params);
            return results;
        } catch (error) {
            console.error('[-] Query error:', error);
            throw error;
        }
    },
    close: async () => {
        if (connection) {
            await connection.end();
            console.log('\n[+] Database connection closed');
        }
    }
};