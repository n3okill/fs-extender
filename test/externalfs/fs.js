module.exports = {
    exists: function (path, callback) {
        return callback(true);
    },
    promises: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        exists: async function (path) {
            return true;
        }
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    existsSync: function (path) {
        return true;
    }
};