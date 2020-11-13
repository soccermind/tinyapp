// returns single user object if email is found in specified database, undefined if email is not found.
const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
};

module.exports = { getUserByEmail };